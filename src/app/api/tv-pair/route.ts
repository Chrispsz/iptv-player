import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Interface para sessão de pareamento
interface PairingSession {
  code: string;
  status: 'pending' | 'connected' | 'completed';
  createdAt: number;
  credentials?: {
    host: string;
    username: string;
    password: string;
    m3uUrl: string;
  };
}

// Armazenamento em memória (em produção usar Redis/Database)
// Usar globalThis para persistir entre requests em serverless
const getStore = () => {
  if (!(globalThis as any).pairingStore) {
    (globalThis as any).pairingStore = new Map<string, PairingSession>();
  }
  return (globalThis as any).pairingStore as Map<string, PairingSession>;
};

const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutos em ms

// Limpar sessões expiradas
function cleanExpired() {
  const store = getStore();
  const now = Date.now();

  for (const [code, session] of store.entries()) {
    if (now - session.createdAt > EXPIRY_TIME) {
      store.delete(code);
      console.log(`🗑️ Sessão expirada: ${code}`);
    }
  }
}

// Gerar código único de 3 dígitos
function generateCode(): string {
  return Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
}

// Verificar se código já existe
function isCodeAvailable(code: string): boolean {
  const store = getStore();
  const session = store.get(code);
  if (!session) return true;

  // Se código existe mas está completado/expirado, pode reusar
  const age = Date.now() - session.createdAt;
  if (age > EXPIRY_TIME || session.status === 'completed') {
    store.delete(code);
    return true;
  }

  return false;
}

// POST /api/tv-pair - Gerar nova sessão (TV)
// POST /api/tv-pair/connect - Conectar à sessão (Celular)
// POST /api/tv-pair/credentials - Enviar credenciais (Celular)
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    let body;
    try {
      body = await request.json();
    } catch (e) {
      // Body pode estar vazio ou inválido
      body = {};
    }

    // Limpar expirados
    cleanExpired();

    // ============================================
    // ACTION: generate - TV gera novo código
    // ============================================
    if (action === 'generate') {
      let code: string;
      let attempts = 0;
      const maxAttempts = 100;

      // Tentar gerar código único
      do {
        code = generateCode();
        attempts++;
      } while (!isCodeAvailable(code) && attempts < maxAttempts);

      if (!isCodeAvailable(code)) {
        return NextResponse.json(
          { error: 'Não foi possível gerar código único' },
          { status: 500 }
        );
      }

      const store = getStore();

      // Criar nova sessão
      const session: PairingSession = {
        code,
        status: 'pending',
        createdAt: Date.now(),
      };

      store.set(code, session);
      console.log(`📺 Sessão criada: ${code}`);

      return NextResponse.json({
        success: true,
        code,
        expiresIn: EXPIRY_TIME / 1000, // em segundos
      });
    }

    // ============================================
    // ACTION: connect - Celular conecta ao código
    // ============================================
    if (action === 'connect') {
      const { code } = body;

      if (!code || code.length !== 3) {
        return NextResponse.json(
          { error: 'Código inválido. Use 3 dígitos.' },
          { status: 400 }
        );
      }

      const store = getStore();
      const session = store.get(code);

      if (!session) {
        return NextResponse.json(
          { error: 'Código não encontrado ou expirado. Gere novo código na TV.' },
          { status: 404 }
        );
      }

      // Se já completado, não pode reconectar
      if (session.status === 'completed') {
        return NextResponse.json(
          { error: 'Esta TV já está configurada. Gere novo código.' },
          { status: 409 }
        );
      }

      // Atualizar status para connected
      session.status = 'connected';
      store.set(code, session);
      console.log(`📱 Celular conectou à sessão: ${code}`);

      return NextResponse.json({
        success: true,
        message: 'Conectado à TV. Aguardando credenciais...',
      });
    }

    // ============================================
    // ACTION: credentials - Celular envia credenciais
    // ============================================
    if (action === 'credentials') {
      const { code, credentials } = body;

      if (!code || code.length !== 3) {
        return NextResponse.json(
          { error: 'Código inválido' },
          { status: 400 }
        );
      }

      if (!credentials || !credentials.host || !credentials.username || !credentials.password) {
        return NextResponse.json(
          { error: 'Credenciais incompletas' },
          { status: 400 }
        );
      }

      const store = getStore();
      const session = store.get(code);

      if (!session) {
        return NextResponse.json(
          { error: 'Código não encontrado ou expirado' },
          { status: 404 }
        );
      }

      if (session.status === 'completed') {
        return NextResponse.json(
          { error: 'Esta TV já está configurada' },
          { status: 409 }
        );
      }

      // Salvar credenciais
      session.credentials = {
        host: credentials.host,
        username: credentials.username,
        password: credentials.password,
        m3uUrl: credentials.m3uUrl || '',
      };
      session.status = 'completed';
      store.set(code, session);

      console.log(`✅ Credenciais enviadas para sessão: ${code}`);
      console.log(`   Host: ${credentials.host}`);
      console.log(`   Usuário: ${credentials.username}`);

      return NextResponse.json({
        success: true,
        message: 'Credenciais enviadas para TV com sucesso!',
      });
    }

    // ============================================
    // ACTION desconhecida
    // ============================================
    return NextResponse.json(
      { error: 'Ação inválida. Use: generate, connect, ou credentials' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Erro na API tv-pair:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/tv-pair?code=123 - Consultar status da sessão (TV)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code || code.length !== 3) {
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 400 }
      );
    }

    // Limpar expirados
    cleanExpired();

    const store = getStore();
    const session = store.get(code);

    if (!session) {
      return NextResponse.json(
        { error: 'Código não encontrado ou expirado' },
        { status: 404 }
      );
    }

    const age = Date.now() - session.createdAt;
    const remaining = Math.max(0, EXPIRY_TIME - age);

    // Se expirou
    if (remaining === 0) {
      store.delete(code);
      return NextResponse.json(
        { error: 'Código expirado' },
        { status: 410 }
      );
    }

    const response = {
      success: true,
      code: session.code,
      status: session.status,
      hasCredentials: !!session.credentials,
      credentials: session.credentials || null,
      remaining: Math.floor(remaining / 1000), // em segundos
    };

    console.log(`📤 Status consultado para código: ${code}, status: ${session.status}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erro ao consultar status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
