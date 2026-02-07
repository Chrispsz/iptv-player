'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Tv, Search, X, Trash2, Loader2, Zap } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { ChannelList } from '@/components/iptv/channel-list'
import { PlayerModal } from '@/components/iptv/player-modal'
import { useIptv } from '@/hooks/use-iptv'
import { usePlayer } from '@/hooks/use-player'

interface Category {
  category_id: string
  category_name: string
}

interface Channel {
  stream_id: string
  name: string
  stream_icon?: string
  category_id: string
  url: string
  original_url?: string
}

export default function IPTVPlayerPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showPlayer, setShowPlayer] = useState(false)
  
  const iptv = useIptv()
  const player = usePlayer()
  
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // Filter channels based on search
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return iptv.allChannels
    
    const query = searchQuery.toLowerCase()
    return iptv.allChannels.filter(channel =>
      channel.name.toLowerCase().includes(query)
    )
  }, [iptv.allChannels, searchQuery])
  
  // Handle connect
  const handleConnect = useCallback(() => {
    if (!iptv.rawInput.trim()) {
      toast.error('Por favor, cole suas credenciais')
      return
    }
    iptv.connect()
  }, [iptv.connect, iptv.rawInput])
  
  // Handle category selection
  const handleCategoryClick = useCallback((category: Category) => {
    iptv.loadChannels(category)
  }, [iptv.loadChannels])
  
  // Handle channel click
  const handleChannelClick = useCallback((channel: Channel) => {
    player.play(channel)
    setShowPlayer(true)
  }, [player.play])
  
  // Close player
  const handleClosePlayer = useCallback(() => {
    setShowPlayer(false)
    player.stop()
  }, [player.stop])
  
  // Handle web video caster
  const handleCast = useCallback(() => {
    player.openInWebVideoCaster()
  }, [player.openInWebVideoCaster])
  
  // Handle clear cache
  const handleClearCache = useCallback(() => {
    iptv.clearCache()
  }, [iptv.clearCache])
  
  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top">
      {/* Header */}
      <header className="glass-nav border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Tv className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">IPTV Brasil</h1>
                <p className="text-xs text-muted-foreground">Canais ao vivo</p>
              </div>
            </div>
            
            {(iptv.categories.length > 0 || iptv.host) && (
              <button
                onClick={handleClearCache}
                className="btn-apple btn-ghost touch-target"
                title="Limpar cache"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        {/* Connection Section */}
        {iptv.categories.length === 0 && (
          <div className="max-w-2xl mx-auto space-y-6 slide-up">
            <div className="text-center space-y-4 pb-4">
              <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/20">
                <Tv className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Bem-vindo ao IPTV Brasil
                </h2>
                <p className="text-muted-foreground">
                  Cole suas credenciais para começar a assistir
                </p>
              </div>
            </div>
            
            <div className="card-apple p-6 space-y-4">
              <label className="text-sm font-medium flex items-center gap-2">
                Credenciais do servidor
              </label>
              <Textarea
                ref={inputRef}
                placeholder="Cole suas credenciais aqui...&#10;&#10;Exemplo:&#10;Servidor: servidor.com:8080&#10;Usuário: usuario&#10;Senha: senha"
                value={iptv.rawInput}
                onChange={(e) => iptv.setRawInput(e.target.value)}
                className="min-h-[140px] text-sm resize-none input-apple"
                rows={6}
              />
              
              <button
                onClick={handleConnect}
                disabled={iptv.isLoadingCategories}
                className="btn-apple btn-primary w-full h-12 text-base font-semibold"
              >
                {iptv.isLoadingCategories ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Conectando...
                  </>
                ) : (
                  'CONECTAR'
                )}
              </button>
              
              {iptv.error && (
                <div className="error-state p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">
                    {iptv.error}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Categories Section */}
        {iptv.categories.length > 0 && (
          <div className="space-y-6 fade-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Categorias ({iptv.categories.length})
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {iptv.categories.map((category, index) => (
                  <button
                    key={category.category_id}
                    onClick={() => handleCategoryClick(category)}
                    className={`category-chip ${
                      iptv.selectedCategory?.category_id === category.category_id
                        ? 'active'
                        : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span>{category.category_name}</span>
                    {iptv.isLoadingChannels && 
                      iptv.selectedCategory?.category_id === category.category_id && (
                        <Loader2 className="h-3 w-3 animate-spin ml-2" />
                      )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Channels Section */}
        {iptv.selectedCategory && (
          <div className="space-y-6 slide-up">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar canais..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-apple pl-12"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 p-2 rounded-full bg-muted/10 hover:bg-muted/20 btn-apple btn-ghost h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  </div>
                  
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {filteredChannels.length} {filteredChannels.length === 1 ? 'canal' : 'canais'}
                  </span>
              </div>
              
              <div className="max-h-[60vh] scroll-apple pr-2">
                <ChannelList
                  channels={filteredChannels}
                  onChannelClick={handleChannelClick}
                  isLoading={iptv.isLoadingChannels}
                  searchQuery={searchQuery}
                  activeChannelId={player.currentChannel?.stream_id}
                />
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Player Modal */}
      <PlayerModal
        videoRef={player.videoRef}
        currentChannel={player.currentChannel}
        isPlaying={player.isPlaying}
        isBuffering={player.isBuffering}
        error={player.error}
        onClose={handleClosePlayer}
        onTogglePlay={player.togglePlay}
        onCast={handleCast}
        isOpen={showPlayer}
      />
    </div>
  )
}
