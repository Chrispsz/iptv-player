'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirect to the universal player HTML
    window.location.href = '/universal-player.html';
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando player...</p>
        <p className="text-sm text-muted-foreground mt-2">
          Se não for redirecionado, <a href="/universal-player.html" className="text-primary hover:underline">clique aqui</a>
        </p>
      </div>
    </div>
  );
}
