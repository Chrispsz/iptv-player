import { useState, useCallback, useEffect, useRef } from 'react'
import Hls from 'hls.js'

interface Channel {
  stream_id: string
  name: string
  stream_icon?: string
  category_id: string
  url: string
  original_url?: string
}

export function usePlayer() {
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  const cleanup = useCallback(() => {
    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad()
        hlsRef.current.detachMedia()
        hlsRef.current.destroy()
      } catch (e) {
        console.error('Error destroying HLS:', e)
      }
      hlsRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.removeAttribute('src')
      videoRef.current.load()
    }

    setIsPlaying(false)
    setIsBuffering(false)
    setError(null)
  }, [])

  const play = useCallback((channel: Channel) => {
    setCurrentChannel(channel)
    setError(null)
    setIsBuffering(true)
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    if (!currentChannel || !videoRef.current) {
      return
    }

    const videoElement = videoRef.current
    const streamUrl = currentChannel.url

    // Use setTimeout to avoid setState synchronous calls in effect
    setTimeout(() => cleanup(), 0)

    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('m3u8')

    if (isHls && Hls.isSupported()) {
      console.log('📺 Usando HLS.js para:', streamUrl)

      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 90,
      })

      hls.loadSource(streamUrl)
      hls.attachMedia(videoElement)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false)
        console.log('✅ HLS Manifesto carregado')
        
        videoElement.play().catch(err => {
          console.log('⚠️ Autoplay bloqueado:', err)
          videoElement.muted = true
          videoElement.play().catch(e => {
            console.error('❌ Erro ao tocar muted:', e)
            setIsPlaying(false)
            setIsBuffering(false)
          })
        })
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS Error:', data)
        
        if (data.fatal) {
          console.error('Erro fatal:', data.type)
          
          switch (data.type) {
            case 'networkError':
              setError('Erro de rede. Verifique sua conexão.')
              break
            case 'mediaError':
              setError('Erro no vídeo. Tente outro canal.')
              break
            default:
              setError('Erro ao carregar vídeo. Tente outro canal.')
          }
          
          setIsBuffering(false)
          setIsPlaying(false)
        }
      })

      hlsRef.current = hls
      
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('📱 Safari nativo para:', streamUrl)
      videoElement.src = streamUrl
      
      videoElement.addEventListener('loadedmetadata', () => {
        setIsBuffering(false)
        console.log('✅ Metadados carregados')
        
        videoElement.play().catch(err => {
          console.log('⚠️ Autoplay bloqueado:', err)
          videoElement.muted = true
          videoElement.play().catch(e => {
            console.error('❌ Erro ao tocar muted:', e)
            setIsPlaying(false)
            setIsBuffering(false)
          })
        })
      })
    } else {
      console.error('❌ Navegador não suporta HLS')
      // Use setTimeout to avoid setState synchronous calls in effect
      setTimeout(() => {
        setError('Seu navegador não suporta HLS. Tente usar Chrome, Firefox ou Edge.')
        setIsBuffering(false)
        setIsPlaying(false)
      }, 0)
    }
    
    return () => {
      cleanup()
    }
  }, [currentChannel, cleanup])

  const togglePlay = useCallback(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    if (isPlaying) {
      videoElement.pause()
      setIsPlaying(false)
      console.log('⏸️ Pausado')
    } else {
      videoElement.play().catch(err => {
        console.error('❌ Erro ao tocar:', err)
      setError('Erro ao tocar vídeo')
      setIsPlaying(false)
      setIsBuffering(false)
      })
    }
  }, [isPlaying])

  const stop = useCallback(() => {
    cleanup()
    setCurrentChannel(null)
    setIsBuffering(false)
    setIsPlaying(false)
    setError(null)
    console.log('⏹️ Player parado')
  }, [cleanup])

  const openInWebVideoCaster = useCallback(() => {
    if (!currentChannel) return

    // USAR URL ORIGINAL DO SERVIDOR
    const originalUrl = currentChannel.original_url || currentChannel.url
    
    console.log('📡 Web Video Caster URL:', originalUrl)

    const encodedUrl = encodeURIComponent(originalUrl)
    const wvcUrl = `webvideocaster://play?url=${encodedUrl}`

    console.log('🚀 Tentando abrir WVC com:', wvcUrl)

    try {
      window.location.href = wvcUrl
    } catch (e) {
      console.error('❌ Erro ao abrir location.href:', e)
    }

    setTimeout(() => {
      try {
        window.open(wvcUrl, '_blank')
      } catch (e) {
        console.error('❌ Erro ao abrir window.open:', e)
      }
    }, 100)

    alert('URL para Web Video Caster:\n' + originalUrl)
  }, [currentChannel])

  return {
    videoRef,
    currentChannel,
    isPlaying,
    isBuffering,
    error,
    play,
    togglePlay,
    stop,
    openInWebVideoCaster,
  }
}
