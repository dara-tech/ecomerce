const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

type GoogleCredentialResponse = { credential?: string };
type GoogleCredentialCallback = (response: GoogleCredentialResponse) => void;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: GoogleCredentialCallback;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>
          ) => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;
let initializedClientId: string | null = null;
let credentialCallback: GoogleCredentialCallback | null = null;

export function setGoogleCredentialCallback(callback: GoogleCredentialCallback | null) {
  credentialCallback = callback;
}

export function loadGoogleSignInScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Sign-In script failed')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Sign-In script failed'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/** Initialize GIS once per page load (safe across React Strict Mode remounts). */
export async function ensureGoogleSignInInitialized(clientId: string): Promise<void> {
  if (!clientId) return;
  await loadGoogleSignInScript();
  if (initializedClientId === clientId) return;

  window.google!.accounts!.id!.initialize({
    client_id: clientId,
    callback: (response) => credentialCallback?.(response),
  });

  initializedClientId = clientId;
}

export function renderGoogleSignInButton(
  parent: HTMLElement,
  options?: { width?: number }
): void {
  window.google!.accounts!.id!.renderButton(parent, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    width: options?.width ?? 400,
  });
}
