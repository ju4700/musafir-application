import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_BLOCKLIST } from '../constants/defaultBlocklist';

const BLOCKLIST_STORAGE_KEY = '@haramBlocker:blocklist';
const TIMER_STATE_STORAGE_KEY = '@haramBlocker:timerState';

export class BlocklistService {
  /**
   * Load blocklist from AsyncStorage
   * Returns default blocklist if none exists
   */
  static async loadBlocklist(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem(BLOCKLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : DEFAULT_BLOCKLIST;
      }
      return DEFAULT_BLOCKLIST;
    } catch (error) {
      console.error('Error loading blocklist:', error);
      return DEFAULT_BLOCKLIST;
    }
  }

  /**
   * Save blocklist to AsyncStorage
   */
  static async saveBlocklist(blocklist: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(BLOCKLIST_STORAGE_KEY, JSON.stringify(blocklist));
    } catch (error) {
      console.error('Error saving blocklist:', error);
      throw error;
    }
  }

  /**
   * Add a domain to the blocklist
   * Validates and normalizes the domain
   */
  static async addDomain(blocklist: string[], domain: string): Promise<string[]> {
    const normalized = BlocklistService.normalizeDomain(domain);
    
    if (!BlocklistService.isValidDomain(normalized)) {
      throw new Error('Invalid domain format');
    }

    if (blocklist.includes(normalized)) {
      throw new Error('Domain already in blocklist');
    }

    const updated = [...blocklist, normalized];
    await BlocklistService.saveBlocklist(updated);
    return updated;
  }

  /**
   * Remove a domain from the blocklist
   */
  static async removeDomain(blocklist: string[], domain: string): Promise<string[]> {
    const updated = blocklist.filter((d) => d !== domain);
    await BlocklistService.saveBlocklist(updated);
    return updated;
  }

  /**
   * Reset blocklist to default
   */
  static async resetToDefault(): Promise<string[]> {
    await BlocklistService.saveBlocklist(DEFAULT_BLOCKLIST);
    return DEFAULT_BLOCKLIST;
  }

  /**
   * Normalize domain (remove protocol, www, trailing slash)
   */
  private static normalizeDomain(domain: string): string {
    let normalized = domain.toLowerCase().trim();
    
    // Remove protocol
    normalized = normalized.replace(/^https?:\/\//, '');
    
    // Remove www
    normalized = normalized.replace(/^www\./, '');
    
    // Remove trailing slash and path
    normalized = normalized.split('/')[0];
    
    return normalized;
  }

  /**
   * Validate domain format
   */
  private static isValidDomain(domain: string): boolean {
    // Basic domain validation
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    return domainRegex.test(domain);
  }

  /**
   * Save timer state for persistence across app restarts
   */
  static async saveTimerState(endTime: number, durationMinutes: number): Promise<void> {
    try {
      await AsyncStorage.setItem(
        TIMER_STATE_STORAGE_KEY,
        JSON.stringify({ endTime, durationMinutes })
      );
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }

  /**
   * Load timer state
   */
  static async loadTimerState(): Promise<{ endTime: number; durationMinutes: number } | null> {
    try {
      const stored = await AsyncStorage.getItem(TIMER_STATE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error loading timer state:', error);
      return null;
    }
  }

  /**
   * Clear timer state
   */
  static async clearTimerState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TIMER_STATE_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing timer state:', error);
    }
  }
}
