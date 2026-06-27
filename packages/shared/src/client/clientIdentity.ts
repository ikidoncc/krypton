/**
 * Returns the persistent client ID for the current device.
 * Generates and caches it in localStorage if not already present.
 */
export function getClientId(): string {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return 'ssr-client';
  }

  const KEY = 'krypton_client_id';
  let clientId = window.localStorage.getItem(KEY);

  if (!clientId) {
    clientId = crypto.randomUUID();
    window.localStorage.setItem(KEY, clientId);
  }

  return clientId;
}
