const RECOVERY_STORAGE_KEY = 'blue-lock:chunk-recovery';
const RECOVERY_QUERY_KEY = '__recover';

const CHUNK_ERROR_PATTERNS = [
  'chunkloaderror',
  'loading chunk',
  'failed to load chunk',
  'failed to fetch dynamically imported module',
  'failed to fetch module',
  'importing a module script failed',
  '/_next/static/chunks/',
  'dynamically imported module',
];

function readMessage(candidate: unknown): string {
  if (!candidate) return '';

  if (typeof candidate === 'string') {
    return candidate;
  }

  if (candidate instanceof Error) {
    return candidate.message ?? '';
  }

  if (typeof candidate === 'object') {
    const record = candidate as Record<string, unknown>;

    if (typeof record.message === 'string') {
      return record.message;
    }

    if (typeof record.reason === 'string') {
      return record.reason;
    }

    if (record.reason instanceof Error) {
      return record.reason.message ?? '';
    }
  }

  return '';
}

function readScriptSource(candidate: unknown): string {
  if (!candidate || typeof candidate !== 'object') {
    return '';
  }

  const record = candidate as Record<string, unknown>;
  const target = record.target;

  if (!target || typeof target !== 'object') {
    return '';
  }

  const src = (target as { src?: unknown }).src;
  return typeof src === 'string' ? src : '';
}

export function isStaleChunkError(candidate: unknown): boolean {
  const message = readMessage(candidate).toLowerCase();
  const scriptSource = readScriptSource(candidate).toLowerCase();
  const combined = `${message} ${scriptSource}`;

  return CHUNK_ERROR_PATTERNS.some((pattern) => combined.includes(pattern));
}

export function attemptChunkRecovery(source: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    if (window.sessionStorage.getItem(RECOVERY_STORAGE_KEY)) {
      return false;
    }

    window.sessionStorage.setItem(
      RECOVERY_STORAGE_KEY,
      JSON.stringify({ source, at: Date.now() }),
    );
  } catch {
    return false;
  }

  const url = new URL(window.location.href);
  url.searchParams.set(RECOVERY_QUERY_KEY, Date.now().toString());
  window.location.replace(url.toString());
  return true;
}

export function cleanupChunkRecoveryUrl() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);

  if (!url.searchParams.has(RECOVERY_QUERY_KEY)) {
    return;
  }

  url.searchParams.delete(RECOVERY_QUERY_KEY);
  window.history.replaceState(window.history.state, '', url.toString());
}

export function resetChunkRecoveryState() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(RECOVERY_STORAGE_KEY);
  } catch {
    // Ignore storage failures and keep the app usable.
  }
}
