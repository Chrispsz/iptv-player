import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Armazenamento em memória (em produção usar Redis/Database)
const credentialsStore = new Map<string, any>();
const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutos em ms

// Limpar credenciais expiradas
function cleanExpired() {
  const now = Date.now();
  for (const [code, data] of credentialsStore.entries()) {
    if (now - data.createdAt > EXPIRY_TIME) {
      credentialsStore.delete(code);
      console.log(`🗑️ Código expirado: ${code}`);
    }
  }
}

// Endpoint para celular enviar credenciais
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, username, password } = body;

    if (!host || !username || !password) {
      return NextResponse.json(
        { error: 'Missing credentials' },
        { status: 400 }
      );
    }

    // Limpar expirados
    cleanExpired();

    // Gerar código único de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Salvar credenciais
    credentialsStore.set(code, {
      host,
      username,
      password,
      createdAt: Date.now(),
    });

    console.log(`📥 Credenciais salvas para código: ${code}`);

    return NextResponse.json({
      success: true,
      code,
      expiresIn: EXPIRY_TIME / 1000, // em segundos
    });
  } catch (error) {
    console.error('Erro ao salvar credenciais:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}

// Endpoint para TV consultar credenciais pelo código
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Missing code' },
        { status: 400 }
      );
    }

    // Limpar expirados
    cleanExpired();

    // Buscar credenciais
    const credentials = credentialsStore.get(code);

    if (!credentials) {
      return NextResponse.json(
        { error: 'Code not found or expired' },
        { status: 404 }
      );
    }

    const age = Date.now() - credentials.createdAt;
    const remaining = Math.max(0, EXPIRY_TIME - age);

    console.log(`📤 Credenciais consultadas para código: ${code}, restante: ${Math.floor(remaining/1000)}s`);

    return NextResponse.json({
      success: true,
      credentials: {
        host: credentials.host,
        username: credentials.username,
        password: credentials.password,
      },
      remaining: Math.floor(remaining / 1000), // em segundos
    });
  } catch (error) {
    console.error('Erro ao consultar credenciais:', error);
    return NextResponse route.ts
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
