// Backend configuration
export const BACKEND_PORT = 8001;

export function getApiBaseUrl(): string {
  const host = window.location.hostname || 'localhost';
  const protocol = window.location.protocol;
  return `${protocol}//${host}:${BACKEND_PORT}`;
}

export function getWsBaseUrl(): string {
  const host = window.location.hostname || 'localhost';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${host}:${BACKEND_PORT}`;
}
