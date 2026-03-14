'use client';

import { useEffect } from 'react';
import {
  attemptChunkRecovery,
  cleanupChunkRecoveryUrl,
  isStaleChunkError,
  resetChunkRecoveryState,
} from '@lib/chunk-recovery';

export default function ChunkRecovery() {
  useEffect(() => {
    cleanupChunkRecoveryUrl();

    const healthyTimer = window.setTimeout(() => {
      resetChunkRecoveryState();
    }, 10000);

    const handleError = (event: ErrorEvent) => {
      if (isStaleChunkError(event.error ?? event.message ?? event)) {
        attemptChunkRecovery('window-error');
        return;
      }

      if (isStaleChunkError(event)) {
        attemptChunkRecovery('window-error-event');
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (!isStaleChunkError(event.reason ?? event)) {
        return;
      }

      event.preventDefault();
      attemptChunkRecovery('unhandled-rejection');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.clearTimeout(healthyTimer);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
