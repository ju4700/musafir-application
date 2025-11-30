import { create } from 'zustand';
import type { AppState, TimerState } from '../types';
import { DEFAULT_BLOCKLIST } from '../constants/defaultBlocklist';

interface AppStore extends AppState {
  // Timer actions
  setTimerActive: (isActive: boolean) => void;
  setTimerEndTime: (endTime: number | null) => void;
  setDurationMinutes: (minutes: number) => void;
  setRemainingSeconds: (seconds: number) => void;
  
  // Blocklist actions
  addBlockedDomain: (domain: string) => void;
  removeBlockedDomain: (domain: string) => void;
  setBlocklist: (blocklist: string[]) => void;
  resetBlocklist: () => void;
  
  // VPN status
  setVPNActive: (isActive: boolean) => void;
  
  // App visibility
  setAppHidden: (isHidden: boolean) => void;
  
  // Device admin
  setDeviceAdmin: (isAdmin: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  timer: {
    isActive: false,
    endTime: null,
    durationMinutes: 60, // Default 1 hour
    remainingSeconds: 0,
  },
  blocklist: DEFAULT_BLOCKLIST,
  isVPNActive: false,
  isAppHidden: false,
  isDeviceAdmin: false,

  // Timer actions
  setTimerActive: (isActive) =>
    set((state) => ({
      timer: { ...state.timer, isActive },
    })),
  
  setTimerEndTime: (endTime) =>
    set((state) => ({
      timer: { ...state.timer, endTime },
    })),
  
  setDurationMinutes: (durationMinutes) =>
    set((state) => ({
      timer: { ...state.timer, durationMinutes },
    })),
  
  setRemainingSeconds: (remainingSeconds) =>
    set((state) => ({
      timer: { ...state.timer, remainingSeconds },
    })),

  // Blocklist actions
  addBlockedDomain: (domain) =>
    set((state) => ({
      blocklist: [...state.blocklist, domain],
    })),
  
  removeBlockedDomain: (domain) =>
    set((state) => ({
      blocklist: state.blocklist.filter((d) => d !== domain),
    })),
  
  setBlocklist: (blocklist) => set({ blocklist }),
  
  resetBlocklist: () => set({ blocklist: DEFAULT_BLOCKLIST }),

  // VPN status
  setVPNActive: (isVPNActive) => set({ isVPNActive }),

  // App visibility
  setAppHidden: (isAppHidden) => set({ isAppHidden }),

  // Device admin
  setDeviceAdmin: (isDeviceAdmin) => set({ isDeviceAdmin }),
}));
