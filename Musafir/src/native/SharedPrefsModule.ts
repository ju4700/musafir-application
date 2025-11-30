import { NativeModules } from 'react-native';

const { SharedPrefsModule } = NativeModules;

interface SharedPrefsInterface {
  saveTimerState(endTime: number, durationMinutes: number): Promise<void>;
  clearTimerState(): Promise<void>;
}

const SharedPrefsModuleSafe = SharedPrefsModule || {
  saveTimerState: async () => { console.warn('SharedPrefsModule not available - native module not linked'); },
  clearTimerState: async () => { console.warn('SharedPrefsModule not available - native module not linked'); },
};

export default SharedPrefsModuleSafe as SharedPrefsInterface;
