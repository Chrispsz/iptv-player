'use client'

import { memo, useCallback } from 'react'
import { Channel } from '@/hooks/use-player'
import { Tv, Loader2 } from 'lucide-react'

interface ChannelListProps {
  channels: Channel[]
  onChannelClick: (channel: Channel) => void
  isLoading?: boolean
  searchQuery?: string
  activeChannelId?: string
}

export const ChannelList = memo(function ChannelList({
  channels,
  onChannelClick,
  isLoading = false,
  searchQuery = '',
  activeChannelId,
}: ChannelListProps) {
  const handleClick = useCallback((channel: Channel) => {
    onChannelClick(channel)
  }, [onChannelClick])

  if (isLoading) {
    return (
      <div className="loading-state">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Carregando canais...</p>
      </div>
    )
  }

  if (channels.length === 0) {
    return (
      <div className="empty-state">
        <Tv className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-base text-foreground font-medium">
          {searchQuery ? 'Nenhum canal encontrado' : 'Selecione uma categoria'}
        </p>
        <p className="text-sm text-muted-foreground">
          {searchQuery 
            ? 'Tente buscar com outros termos' 
            : 'Escolha uma categoria para ver os canais disponíveis'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {channels.map((channel, index) => (
        <button
          key={channel.stream_id}
          onClick={() => handleClick(channel)}
          className={`channel-item w-full text-left fade-in ${
            activeChannelId === channel.stream_id ? 'active' : ''
          }`}
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <div className="flex-shrink-0">
            {channel.stream_icon ? (
              <img
                src={channel.stream_icon}
                alt={channel.name}
                className="h-10 w-10 rounded-lg object-cover bg-muted"
                loading="lazy"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Tv className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{channel.name}</p>
            <p className="text-xs text-muted-foreground/70">
              {activeChannelId === channel.stream_id ? 'Reproduzindo...' : ''}
            </p>
          </div>
          {activeChannelId === channel.stream_id && (
            <div className="flex-shrink-0">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          )}
        </button>
      ))}
    </div>
  )
})
