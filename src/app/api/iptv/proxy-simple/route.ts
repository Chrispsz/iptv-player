import { NextRequest, NextResponse } from 'next/server';

const IPTV_REGEX = /^https?:\/\/([^\/:]+)(?::\d+)?\/player_api\.php/i;

function isIPTVRequest(url: string): boolean {
  return IPTV_REGEX.test(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl || !isIPTVRequest(targetUrl)) {
    return NextResponse.json(
      { error: 'Invalid URL' },
      { status: 400 }
    );
  }

  try {
    console.log(`[Proxy] Requesting: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      // Critical for streaming
      cache: 'no-store',
    });

    console.log(`[Proxy] Status: ${response.status}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[Proxy] Response type: ${Array.isArray(data) ? 'array' : typeof data}`);
    console.log(`[Proxy] Response keys: ${Object.keys(data).join(', ')}`);
    if (Array.isArray(data)) {
      console.log(`[Proxy] Array length: ${data.length}`);
    } else {
      console.log(`[Proxy] Response sample:`, JSON.stringify(data).substring(0, 200));
    }

    // Return with CORS headers
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy error', message: String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
