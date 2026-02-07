import { useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

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
}

const EXCLUDED_CATEGORIES = [
  'filme', 'movie', 'film', 'vod', 'series', 'series4k', '4kseries',
  'radio', 'rádio', 'music', 'musica', 'audio', 'som',
  'adult', 'xxx', 'porn'
]

const BRAZILIAN_KEYWORDS = [
  'brasil', 'brazil', 'brasileira', 'brasileiro', 'globo',
  'record', 'sbt', 'band', 'rede', 'aberta', 'aberto',
  'sao paulo', 'rio', 'minas', 'bahia', 'parana',
  'catarinense', 'gaucha', 'brasilia', 'df', 'sp', 'rj',
  'mg', 'rs', 'pr', 'sc', 'ba', 'pe', 'go', 'es', 'ce', 'am', 'pa', 'rn'
]

interface ParsedCredentials {
  host: string
  username: string
  password: string
}

export function useIptv() {
  const [rawInput, setRawInput] = useState('')
  const [host, setHost] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [allChannels, setAllChannels] = useState<Channel[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingChannels, setIsLoadingChannels] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Parse credentials from text
  const parseCredentials = useCallback((text: string): ParsedCredentials => {
    const lines = text.split('\n')
    let extractedHost = ''
    let extractedUser = ''
    let extractedPass = ''

    lines.forEach(line => {
      const originalLine = line.trim()
      const lower = originalLine.toLowerCase()

      // Extrair host do servidor (remover porta, http/https e caracteres especiais)
      if (lower.includes('servidor:') || lower.includes('*servidor:')) {
        const keywordIndex = lower.indexOf('servidor:')
        if (keywordIndex !== -1) {
          const afterKeyword = originalLine.substring(keywordIndex + 'servidor:'.length).trim()
          // Remover http:// ou https://
          let cleanHost = afterKeyword.replace(/^https?:\/\//, '')
          // Remover caracteres especiais no início (*, ·, etc)
          cleanHost = cleanHost.replace(/^[*·]+/, '')
          // Remover porta se tiver formato host:porta
          cleanHost = cleanHost.split(':')[0].trim()
          extractedHost = cleanHost
        }
      }

      // Extrair host do M3U+ URL
      if (lower.includes('m3u+:')) {
        const urlMatch = originalLine.match(/https?:\/\/([^\/\s:]+)/)
        if (urlMatch) {
          extractedHost = extractedHost || urlMatch[1].trim()
        }
      }

      // Extrair usuário
      if (lower.includes('usuário:') || lower.includes('usuario:') || 
          lower.includes('*usuário:') || lower.includes('*usuario:') ||
          lower.includes('usuário:') || lower.includes('usuario:')) {
        const match = originalLine.match(/[:*]\s*(.+)/)
        if (match) extractedUser = match[1].trim()
      }

      // Extrair senha
      if (lower.includes('senha:') || lower.includes('*senha:')) {
        const match = originalLine.match(/[:*]\s*(.+)/)
        if (match) extractedPass = match[1].trim()
      }
    })

    // Tentar padrão de URL se não funcionou
    if (!extractedHost || !extractedUser || !extractedPass) {
      const urlMatch = text.match(/https?:\/\/([^\/\s:]+)\/get\.php\?username=([^&\s]+)&password=([^&\s]+)/)
      if (urlMatch) {
        extractedHost = extractedHost || urlMatch[1]
        extractedUser = extractedUser || urlMatch[2]
        extractedPass = extractedPass || urlMatch[3]
      }
    }

    console.log('Parsed credentials:', { host: extractedHost, username: extractedUser, password: extractedPass ? '***' : '' })

    return { host: extractedHost, username: extractedUser, password: extractedPass }
  }, [])
  
  // Connect and fetch categories
  const connect = useCallback(async (text?: string) => {
    const input = text || rawInput
    
    if (!input.trim()) {
      toast.error('Por favor, cole suas credenciais')
      return
    }

    const creds = parseCredentials(input)
    if (!creds.host || !creds.username || !creds.password) {
      toast.error('Não foi possível extrair as credenciais')
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()

    setIsLoadingCategories(true)
    setError(null)
    setHost(creds.host)
    setUsername(creds.username)
    setPassword(creds.password)
    setRawInput('')
    setSelectedCategory(null)
    setAllChannels([])

    try {
      let apiHost = creds.host
      if (!apiHost.startsWith('http://') && !apiHost.startsWith('https://')) {
        apiHost = `http://${creds.host}`
      }

      const response = await fetch('/api/iptv/xtream/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: apiHost,
          username: creds.username,
          password: creds.password,
          type: 'live'
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Erro ao conectar com servidor')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Filter Brazilian channels
      const filteredCategories = data.categories.filter((cat: Category) => {
        const catName = cat.category_name.toLowerCase()
        const isExcluded = EXCLUDED_CATEGORIES.some(excl => catName.includes(excl))
        if (isExcluded) return false
        const isBrazilian = BRAZILIAN_KEYWORDS.some(kw => catName.includes(kw))
        return isBrazilian
      })

      setCategories(filteredCategories)
      toast.success(`Categorias carregadas (${filteredCategories.length} categorias)`)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      const message = err instanceof Error ? err.message : 'Erro ao conectar'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoadingCategories(false)
      abortControllerRef.current = null
    }
  }, [rawInput, parseCredentials])
  
  // Load channels for category
  const loadChannels = useCallback(async (category: Category) => {
    if (!host || !username || !password) {
      toast.error('Conecte-se primeiro')
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()

    setSelectedCategory(category)
    setIsLoadingChannels(true)
    setError(null)

    try {
      let apiHost = host
      if (!apiHost.startsWith('http://') && !apiHost.startsWith('https://')) {
        apiHost = `http://${host}`
      }

      const response = await fetch('/api/iptv/xtream/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: apiHost,
          username,
          password,
          type: 'live',
          category_id: category.category_id
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar canais')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setAllChannels(data.streams)
      toast.success(`${data.streams.length} canais encontrados`)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      const message = err instanceof Error ? err.message : 'Erro ao carregar canais'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoadingChannels(false)
      abortControllerRef.current = null
    }
  }, [host, username, password])
  
  // Clear cache
  const clearCache = useCallback(() => {
    setCategories([])
    setAllChannels([])
    setSelectedCategory(null)
    setError(null)
    setHost('')
    setUsername('')
    setPassword('')
    setRawInput('')
    toast.success('Cache limpo')
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  
  return {
    rawInput,
    setRawInput,
    host,
    username,
    password,
    categories,
    selectedCategory,
    allChannels,
    isLoadingCategories,
    isLoadingChannels,
    error,
    connect,
    loadChannels,
    clearCache,
  }
}
