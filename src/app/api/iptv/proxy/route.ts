import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API para contornar CORS e bloqueios de rede
 * Usa o backend Next.js para fazer requests ao servidor IPTV
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  // Validar URL
  try {
    const url = new URL(targetUrl);
    if (!url.hostname) {
      throw new Error('Invalid URL');
    }
  } catch (e) {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      // Timeout longo para servidores lentos
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Target server returned ${response.status} ${response.statusText}`,
          url: targetUrl,
        },
        { status: response.status }
      );
    }

    // Tentar fazer parse como JSON
    const contentType = response.headers.get('content-type') || '';
    const data = await response.text();

    // Se for JSON, retorna com parse
    if (contentType.includes('application/json')) {
      try {
        const jsonData = JSON.parse(data);
        return NextResponse.json(jsonData);
      } catch (e) {
        // Se falhar o parse, retorna como texto
        return NextResponse.json({ data }, { status: 200 });
      }
    }

    // Se for outro tipo de conteúdo, retorna como texto
    return NextResponse.json({ data }, { status: 200 });

  } catch (error) {
    console.error('Proxy error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout (30s)' },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Unknown proxy error' },
      { status: 500 }
    );
  }
}
