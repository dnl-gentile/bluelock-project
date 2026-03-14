'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { attemptChunkRecovery, isStaleChunkError } from '@lib/chunk-recovery';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkIssue = isStaleChunkError(error);

  useEffect(() => {
    if (isChunkIssue) {
      attemptChunkRecovery('error-boundary');
    }
  }, [isChunkIssue]);

  const handleRetry = () => {
    if (isChunkIssue && attemptChunkRecovery('manual-retry')) {
      return;
    }

    reset();
  };

  return (
    <main className="min-h-screen bg-[#050505] text-slate-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[28px] border border-[rgba(29,78,216,0.28)] bg-[rgba(9,14,24,0.92)] p-8 text-center shadow-[0_0_60px_rgba(29,78,216,0.12)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(29,78,216,0.28)] bg-[rgba(29,78,216,0.08)] text-[#3b82f6]">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-black tracking-[0.2em] text-[#3b82f6] uppercase">
          Falha de Carregamento
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-300">
          {isChunkIssue
            ? 'Detectei uma versao antiga do app presa no cache. Vou tentar sincronizar com o deploy mais recente.'
            : 'A tela encontrou um erro inesperado. Podemos tentar carregar de novo sem perder o foco do treino.'}
        </p>

        <button
          type="button"
          onClick={handleRetry}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(29,78,216,0.32)] bg-[#0f172a] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-[#3b82f6] hover:text-[#60a5fa]"
        >
          <RotateCcw className="h-4 w-4" />
          Tentar novamente
        </button>

        {error?.message ? (
          <p className="mt-4 text-xs text-slate-500">{error.message}</p>
        ) : null}
      </div>
    </main>
  );
}
