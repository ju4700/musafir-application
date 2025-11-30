/**
 * Default blocklist of harmful domains
 * Pre-populated with sample adult content and gambling sites
 */
export const DEFAULT_BLOCKLIST: string[] = [
  // Adult content sites
  'pornhub.com',
  'xvideos.com',
  'xnxx.com',
  'redtube.com',
  'youporn.com',
  'tube8.com',
  'porn.com',
  'xhamster.com',
  'spankbang.com',
  'eporner.com',
  'motherless.com',
  'keezmovies.com',
  'extremetube.com',
  'youjizz.com',
  'chaturbate.com',
  'livejasmin.com',
  'stripchat.com',
  'cam4.com',
  
  // Gambling sites
  'bet365.com',
  'betway.com',
  'poker.com',
  'pokerstars.com',
  'casino.com',
  '888casino.com',
  'unibet.com',
  'bwin.com',
  
  // Social media distractions (optional, can be removed)
  // 'facebook.com',
  // 'instagram.com',
  // 'tiktok.com',
  // 'twitter.com',
];

export const APP_NAME = 'HaramBlocker';
export const NOTIFICATION_CHANNEL_ID = 'haramBlocker_timer';
export const NOTIFICATION_CHANNEL_NAME = 'Timer Service';
export const VPN_NOTIFICATION_ID = 1001;
export const TIMER_NOTIFICATION_ID = 1002;
