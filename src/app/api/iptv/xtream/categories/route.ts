import { NextRequest, NextResponse } from 'next/server'

interface Category {
  category_id: string
  category_name: string
  parent_id?: string
}

// Tenta porta 80, depois 8080
async function fetchCategories(apiHost: string, username: string, password: string, type: string): Promise<Category[]> {
  const ports = ['80', '8080']
  let lastError: Error | null = null

  for (const port of ports) {
    const baseUrl = `${apiHost}:${port}/player_api.php`
    const actionUrl = `${baseUrl}?username=${username}&password=${password}&action=get_${type}_categories`

    console.log(`Tentando porta ${port}:`, actionUrl)

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

      console.log(`Sucesso com porta ${port}`)

      return data.map((cat: any) => ({
        category_id: cat.category_id?.toString() || '0',
        category_name: cat.category_name || 'Sem categoria',
        parent_id: cat.parent_id
      }))

    } catch (error) {
      console.error(`Falha na porta ${port}:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))
      continue
    }
  }

  throw lastError || new Error('Não foi possível conectar em nenhuma porta')
}

export async function POST(request: NextRequest) {
  try {
    const { host, username, password, type = 'live' } = await request.json()

    console.log('Categories request:', { host, username })

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

    const categories = await fetchCategories(apiHost, username, password, type)

    return NextResponse.json({ categories })

  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar categorias' },
      { status: 500 }
    )
  }
}
