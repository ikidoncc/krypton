import type { ClientManager, HostManager } from '@krypton/network';
import { create } from 'zustand';

type ConnectionRole = 'host' | 'client';

interface PeerStore {
  role: ConnectionRole | null;
  hostManager: HostManager | null;
  clientManager: ClientManager | null;

  setHostManager: (manager: HostManager) => void;
  setClientManager: (manager: ClientManager) => void;
  reset: () => void;
}

export const usePeerStore = create<PeerStore>((set, get) => ({
  role: null,
  hostManager: null,
  clientManager: null,

  setHostManager: (manager) => set({ role: 'host', hostManager: manager }),
  setClientManager: (manager) => set({ role: 'client', clientManager: manager }),

  reset: () => {
    // Destroy active connections before clearing
    get().hostManager?.destroy();
    get().clientManager?.destroy();
    set({ role: null, hostManager: null, clientManager: null });
  },
}));
