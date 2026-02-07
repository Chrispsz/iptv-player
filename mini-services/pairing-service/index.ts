import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Estado das sessões de pareamento
interface PairingSession {
  sessionId: string;
  deviceType: 'tv' | 'mobile';
  connectedAt: number;
  credentials?: {
    host: string;
    username: string;
    password: string;
    m3uUrl: string;
  };
  status: 'pending' | 'awaiting_credentials' | 'completed';
}

const sessions = new Map<string, PairingSession>();

// Criar servidor HTTP + Socket.io
const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

const PORT = 3003;

// Gerar ID de sessão curto e único
function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Limpar sessões antigas (mais de 30 minutos)
function cleanupOldSessions() {
  const now = Date.now();
  const MAX_AGE = 30 * 60 * 1000; // 30 minutos (era 10)

  sessions.forEach((session, sessionId) => {
    if (now - session.connectedAt > MAX_AGE) {
      console.log(`🧹 Limpando sessão antiga: ${sessionId}`);
      sessions.delete(sessionId);
    }
  });
}

// Rodar limpeza a cada minuto
setInterval(cleanupOldSessions, 60 * 1000);

io.on('connection', (socket) => {
  console.log(`📱 Cliente conectado: ${socket.id}`);

  // ============================================
  // MÉTODOS PARA TV (receptora de credenciais)
  // ============================================

  // TV solicita nova sessão de pareamento
  socket.on('tv:pair:request', (callback: (session: PairingSession) => void) => {
    const sessionId = generateSessionId();

    const session: PairingSession = {
      sessionId,
      deviceType: 'tv',
      connectedAt: Date.now(),
      status: 'pending',
    };

    sessions.set(sessionId, session);
    socket.data.sessionId = sessionId;
    socket.data.deviceType = 'tv';

    console.log(`📺 TV solicitou pareamento: ${sessionId}`);

    // TV entra numa room específica para esta sessão
    socket.join(`session:${sessionId}`);

    callback(session);
  });

  // TV pede status da sessão (polling)
  socket.on('tv:status:request', (callback: (status: PairingSession | null) => void) => {
    const sessionId = socket.data.sessionId;
    if (!sessionId) {
      callback(null);
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      console.log(`⚠️ Sessão não encontrada: ${sessionId}, TV precisa gerar nova`);
      callback(null);
      return;
    }

    console.log(`📺 TV ${sessionId} verificando status: ${session.status}`);
    callback(session);
  });

  // ============================================
  // MÉTODOS PARA CELULAR (autorização)
  // ============================================

  // Celular se conecta a uma sessão existente
  socket.on('mobile:pair:connect', (
    sessionId: string,
    callback: (success: boolean, message?: string) => void
  ) => {
    const session = sessions.get(sessionId);

    if (!session) {
      console.log(`❌ Sessão não encontrada: ${sessionId}`);
      callback(false, 'Sessão expirada. Gere novo QR Code na TV.');
      return;
    }

    // Verifica se já tem credenciais (pareamento já realizado)
    if (session.credentials) {
      console.log(`⚠️ Sessão já foi pareada: ${sessionId}`);
      callback(false, 'Esta TV já está configurada. Gere novo QR Code.');
      return;
    }

    console.log(`📱 Celular se conectou à sessão ${sessionId}`);

    socket.data.sessionId = sessionId;
    socket.data.deviceType = 'mobile';
    socket.join(`session:${sessionId}`);

    // Atualiza status
    session.status = 'awaiting_credentials';

    // Notifica TV que celular está conectado
    io.to(`session:${sessionId}`).emit('session:mobile_connected');

    callback(true);
  });

  // Celular envia credenciais
  socket.on('mobile:credentials:send', (
    credentials: { host: string; username: string; password: string; m3uUrl: string },
    callback: (success: boolean, message?: string) => void
  ) => {
    const sessionId = socket.data.sessionId;
    if (!sessionId) {
      callback(false, 'Sessão inválida');
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      callback(false, 'Sessão não encontrada');
      return;
    }

    console.log(`📱 Celular enviou credenciais para sessão ${sessionId}`);
    console.log(`   Host: ${credentials.host}`);
    console.log(`   Usuário: ${credentials.username}`);

    // Salva credenciais na sessão
    session.credentials = credentials;
    session.status = 'completed';

    // Notifica TV que recebeu credenciais
    io.to(`session:${sessionId}`).emit('tv:credentials:received', credentials);

    console.log(`✅ Credenciais enviadas para TV ${sessionId}`);

    callback(true, 'Pareamento concluído!');
  });

  // ============================================
  // HANDLERS GERAIS
  // ============================================

  socket.on('disconnect', () => {
    const sessionId = socket.data.sessionId;
    const deviceType = socket.data.deviceType;

    if (sessionId) {
      console.log(`📴 ${deviceType === 'tv' ? 'TV' : 'Celular'} desconectado da sessão ${sessionId}`);

      // Se foi o celular que desconectou, mantém a sessão aberta para TV
      // Se foi a TV, só marca como completed se já recebeu credenciais
      if (deviceType === 'tv') {
        const session = sessions.get(sessionId);
        if (session && session.status === 'completed') {
          // Só deleta se já foi completada (já recebeu credenciais)
          console.log(`✅ Sessão ${sessionId} completada, pode ser reutilizada`);
        }
        // Se está pending ou awaiting_credentials, mantém aberta para reconexão
      }
    }
  });

  socket.on('error', (err) => {
    console.error(`❌ Erro no socket ${socket.id}:`, err);
  });
});

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 Serviço de Pareamento IPTV');
  console.log('=================================');
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🔗 Socket.io: ws://localhost:${PORT}`);
  console.log(`📱 Gateway: /?XTransformPort=${PORT}`);
  console.log('=================================');
  console.log('✅ Aguardando conexões...');
  console.log('=================================');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, encerrando...');
  httpServer.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido, encerrando...');
  httpServer.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});
