import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export interface AppUpdateState {
  updateAvailable: boolean;
  offlineReady: boolean;
  updating: boolean;
  applyUpdate: () => Promise<void>;
  dismissOfflineReady: () => void;
}

let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined;
let registered = false;
const listeners = new Set<(value: { updateAvailable: boolean; offlineReady: boolean }) => void>();
let shared = { updateAvailable: false, offlineReady: false };

function publish(next: Partial<typeof shared>) {
  shared = { ...shared, ...next };
  listeners.forEach(listener => listener(shared));
}

function ensureRegistered() {
  if (registered) return;
  registered = true;
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      publish({ updateAvailable: true });
    },
    onOfflineReady() {
      publish({ offlineReady: true });
    }
  });
}

export function useAppUpdate(): AppUpdateState {
  const [state, setState] = useState(shared);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    ensureRegistered();
    listeners.add(setState);
    return () => { listeners.delete(setState); };
  }, []);

  async function applyUpdate() {
    if (!updateServiceWorker) return;
    setUpdating(true);
    try {
      await updateServiceWorker(true);
    } finally {
      setUpdating(false);
    }
  }

  return {
    ...state,
    updating,
    applyUpdate,
    dismissOfflineReady: () => publish({ offlineReady: false })
  };
}
