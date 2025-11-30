export interface TimerState {
  isActive: boolean;
  endTime: number | null;
  durationMinutes: number;
  remainingSeconds: number;
}

export interface AppState {
  timer: TimerState;
  blocklist: string[];
  isVPNActive: boolean;
  isAppHidden: boolean;
  isDeviceAdmin: boolean;
}

export interface BlocklistItem {
  domain: string;
  addedAt: number;
}

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

export interface VPNConfig {
  blocklist: string[];
  dnsServers?: string[];
}
