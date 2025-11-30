import { NativeModules } from 'react-native';

const { AppIconManagerModule } = NativeModules;

interface AppIconManager {
  hideIcon: () => Promise<void>;
  showIcon: () => Promise<void>;
  isIconVisible: () => Promise<boolean>;
}

if (!AppIconManagerModule) {
  throw new Error('AppIconManagerModule native module is not available');
}

export const hideAppIcon = (): Promise<void> => {
  return AppIconManagerModule.hideIcon();
};

export const showAppIcon = (): Promise<void> => {
  return AppIconManagerModule.showIcon();
};

export const isIconVisible = (): Promise<boolean> => {
  return AppIconManagerModule.isIconVisible();
};

export default AppIconManagerModule as AppIconManager;
