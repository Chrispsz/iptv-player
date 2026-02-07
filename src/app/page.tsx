'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [isTV, setIsTV] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Detect if on TV
    const ua = navigator.userAgent.toLowerCase();
    const tvDetected = /smart.tv|android.tv|googletv|web0s|appletv/.test(ua) ||
                        !/mobile|android|iphone|ipad/.test(ua) &&
                        (screen.width >= 1920 && screen.height >= 1080);

    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => setIsTV(tvDetected), 0);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstall(false);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col safe-area-top">
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="text-7xl">📺</div>
            <h1 className="text-4xl font-bold text-white">
              IPTV Player
            </h1>
            {isTV && (
              <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Modo TV Detectado</span>
              </div>
            )}
          </div>

          {/* Install PWA Button */}
          {showInstall && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">📱</div>
              <h2 className="text-xl font-bold text-white mb-2">
                Instalar na TV
              </h2>
              <p className="text-slate-400 mb-4">
                Instale como app para acesso rápido sem precisar digitar URL
              </p>
              <button
                onClick={handleInstall}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-colors"
              >
                📲 Instalar Aplicativo
              </button>
            </div>
          )}

          {/* Main Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pairing Option - Simple */}
            <a
              href="/tv.html"
              className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 hover:border-green-500 rounded-2xl p-8 transition-all hover:scale-105 hover:shadow-2xl group cursor-pointer"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📺</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Parear TV
              </h2>
              <p className="text-slate-400">
                Use código de 6 dígitos - Funciona em qualquer plataforma!
              </p>
              {isTV && (
                <div className="mt-4 text-green-400 font-medium text-sm">
                  ⭐ Recomendado para TV
                </div>
              )}
            </a>

            {/* Connect Normally */}
            <a
              href="/tv.html"
              className="bg-slate-800/50 border-2 border-slate-700 hover:border-blue-500 rounded-2xl p-8 transition-all hover:scale-105 hover:shadow-2xl group cursor-pointer"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📺</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Conectar Direto
              </h2>
              <p className="text-slate-400">
                Digite suas credenciais IPTV na TV
              </p>
            </a>

            {/* Player Option */}
            <a
              href="/universal-player.html"
              className="bg-slate-800/50 border-2 border-slate-700 hover:border-blue-500 rounded-2x2 p-8 transition-all hover:scale-105 hover:shadow-2xl group cursor-pointer"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">▶️</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Player Universal
              </h2>
              <p className="text-slate-400">
                Acesse diretamente com suas credenciais
              </p>
            </a>
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>IPTV Player - Pareamento simplificado e funcional</p>
      </footer>
    </div>
  );
}
