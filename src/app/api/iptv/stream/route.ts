import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const streamUrl = searchParams.get('url')

    if (!streamUrl) {
      return NextResponse.json(
        { error: 'URL do stream não fornecida' },
        { status: 400 }
      )
    }

    console.log('🎬 Stream URL:', streamUrl)

    // Validar URL
    let urlObj: URL
    try {
      urlObj = new URL(streamUrl)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        console.error('❌ Protocolo não permitido:', urlObj.protocol)
        return NextResponse.json(
          { error: 'Protocolo não permitido' },
          { status: 400 }
        )
      }
    } catch (err) {
      console.error('❌ URL inválida:', streamUrl, err)
      return NextResponse.json(
        { error: `URL inválida: ${streamUrl}` },
        { status: 400 }
      )
    }

    // Buscar stream
    const fetchStream = async (url: string, attempt = 1) => {
      console.log(`🔄 Tentativa ${attempt}:`, url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept-Encoding': 'identity',
          'Referer': urlObj.origin,
          'Origin': urlObj.origin,
        },
      })

      console.log(`📡 Status resposta:`, response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      const isHLS = contentType.includes('mpegurl') || url.includes('.m3u8')
      const isM3U = url.includes('.m3u') && !url.includes('.m3u8')

      console.log(`📺 Content-Type:`, contentType)
      console.log(`🎯 Tipo:`, isHLS ? 'HLS' : isM3U ? 'M3U Playlist' : 'Direct Stream')

      // Se for M3U, retornar texto direto
      if (isM3U) {
        const text = await response.text()
        console.log(`📝 Tamanho M3U:`, text.length, 'bytes')
        
        return new NextResponse(text, {
          status: 200,
          headers: {
            'Content-Type': 'application/x-mpegurl',
            'Content-Disposition': 'inline; filename="playlist.m3u"',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          },
        })
      }

      // Se for HLS, retornar texto
      if (isHLS) {
        const text = await response.text()
        console.log(`📝 Tamanho HLS:`, text.length, 'bytes')
        
        return new NextResponse(text, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          },
        })
      }

      // Stream direto (MP4, TS, etc)
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Falha ao ler stream')
      }

      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              controller.enqueue(value)
            }
            controller.close()
          } catch (error) {
            console.error('❌ Erro no stream:', error)
            controller.error(error)
          }
        },
      })

      console.log('🎬 Retornando stream direto')
      
      return new NextResponse(stream, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Content-Disposition': 'inline; filename="stream.mp4"',
        },
      })
    }

    // Tentar buscar stream
    try {
      return await fetchStream(streamUrl)
    } catch (err) {
      console.error('❌ Erro ao buscar stream:', err)
      
      // Tentar sem referer se falhou
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase()
        if (errorMessage.includes('cors') || errorMessage.includes('blocked')) {
          console.log('🔄 Retentando sem headers de referer...')
          
          try {
            const response = await fetch(streamUrl, {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
              },
            })
            
            if (response.ok) {
              const reader = response.body?.getReader()
              const stream = new ReadableStream({
                async start(controller) {
                  try {
                    while (true) {
                      const { done, value } = await reader.read()
                      if (done) break
                      controller.enqueue(value)
                    }
                    controller.close()
                  } catch (error) {
                    controller.error(error)
                  }
                },
              })
              
              return new NextResponse(stream, {
                status: 200,
                headers: {
                  'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
                  'Access-Control-Allow-Origin': '*',
                },
              })
            }
          } catch (retryErr) {
            console.error('❌ Falha na retry:', retryErr)
          }
        }
      }
      
      return NextResponse.json(
        { error: `Erro ao buscar stream: ${err.message}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro ao processar stream' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  })
}
