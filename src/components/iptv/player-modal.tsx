'use client'

import { memo } from 'react'
import { X, Cast, Play, Pause, Volume2, Maximize, Loader2 } from 'lucide-react'
import { Channel } from '@/hooks/use-player'

interface PlayerModalProps {
  videoRef: React.RefObject<HTMLVideoElement>
  currentChannel: Channel | null
  isPlaying: boolean
  isBuffering: boolean
  error: string | null
  onClose: () => void
  onTogglePlay: () => void
  onCast: () => void
  isOpen: boolean
}

export const PlayerModal = memo(function PlayerModal({
  videoRef,
  currentChannel,
  isPlaying,
  isBuffering,
  error,
  onClose,
  onTogglePlay,
  onCast,
  isOpen,
}: PlayerModalProps) {
  if (!isOpen || !currentChannel) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border/50 bg-card/95 backdrop-blur">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {currentChannel.stream_icon && (
              <img
                src={currentChannel.stream_icon}
                alt={currentChannel.name}
                className="h-8 w-8 rounded-lg object-cover bg-muted"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-medium truncate text-sm">
                {currentChannel.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isPlaying ? 'Reproduzindo' : 'Pausado'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onCast}
              className="btn-apple btn-ghost touch-target"
              title="Web Video Caster"
            >
              <Cast className="h-5 w-5" />
            </button>
            
            <button
              onClick={onClose}
              className="btn-apple btn-ghost touch-target"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="video-container aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              onClick={onTogglePlay}
            />
            
            {isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center p-8">
                  <p className="text-white font-medium mb-2">{error}</p>
                  <p className="text-white/70 text-sm">Tente outro canal</p>
                </div>
              </div>
            )}
            
            {!isPlaying && !isBuffering && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={onTogglePlay}>
                <div className="h-20 w-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-200">
                  <Play className="h-10 w-10 text-black ml-1" />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePlay}
                className="btn-apple btn-secondary touch-target"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </button>
              
              <button className="btn-apple btn-secondary touch-target" title="Volume">
                <Volume2 className="h-5 w-5" />
              </button>
            </div>
            
            <button className="btn-apple btn-secondary touch-target" title="Tela cheia">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})
