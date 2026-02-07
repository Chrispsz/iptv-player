import { NextRequest, NextResponse } from 'next/server'

interface Stream {
  stream_id: string
  name: string
  stream_icon?: string
  category_id: string
  url: string
  original_url: string
  added?: string
}

async function fetchStreams(apiHost: string, username: string, password: string, type: string, category_id?: string): Promise<Stream[]> {
  const ports = ['80', '8080']
  let lastError: Error | null = null

  for (const port of ports) {
    const baseUrl = `${apiHost}:${port}/player_api.php`
    let actionUrl = `${baseUrl}?username=${username}&password=${password}&action=get_${type}_streams`
    if (category_id) {
      actionUrl = `${actionUrl}&category_id=${category_id}`
    }

    console.log(`🔄 Tentando porta ${port}:`, actionUrl)

    try {
      const response = await fetch(actionUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.user_info?.status === 'error') {
        throw new Error('Credenciais inválidas')
      }

      if (!Array.isArray(data)) {
        throw new Error('Resposta inválida da API')
      }

      console.log(`✅ Sucesso com porta ${port}: ${data.length} streams`)

      return data.map((item: any) => {
        const streamBaseUrl = `${apiHost}:${port}/${username}/${password}/${item.stream_id}.${type === 'live' ? 'm3u8' : 'mp4'}`
        
        return {
          stream_id: item.stream_id?.toString() || '',
          name: item.name || 'Sem nome',
          stream_icon: item.stream_icon,
          category_id: item.category_id?.toString() || '0',
          url: streamBaseUrl,
          original_url: streamBaseUrl,
          added: item.added
        }
      })

    } catch (error) {
      console.error(`❌ Falha na porta ${port}:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))
      continue
    }
  }

  throw lastError || new Error('Não foi possível conectar em nenhuma porta')
}

export async function POST(request: NextRequest) {
  try {
    const { host, username, password, type = 'live', category_id } = await request.json()

    console.log('📡 Streams request:', { host, username, category_id })

    if (!host || !username || !password) {
      return NextResponse.json(
        { error: 'Credenciais incompletas' },
        { status: 400 }
      )
    }

    let apiHost = host
    if (!apiHost.startsWith('http://') && !apiHost.startsWith('https://')) {
      apiHost = `http://${host}`
    }

    const streams = await fetchStreams(apiHost, username, password, type, category_id)

    return NextResponse.json({ streams })

  } catch (error) {
    console.error('❌ Error fetching streams:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar canais' },
      { status: 500 }
    )
  }
}
