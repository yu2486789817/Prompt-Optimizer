import { storage } from './utils';

export interface HistoryItem {
  id: string;
  timestamp: number;
  inputPrompt: string;
  positivePrompt: string;
  negativePrompt: string;
  translatedPositive: string;
  translatedNegative: string;
  modelId: string;
}

const HISTORY_KEY = 'prompt_history';
const MAX_HISTORY_ITEMS = 50;

export const historyStorage = {
  // Get all history items
  getAll: (): HistoryItem[] => {
    return storage.getJSON(HISTORY_KEY, []);
  },

  // Add a new item
  add: (item: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem => {
    const history = historyStorage.getAll();
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    // Add to beginning and limit size
    const newHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    storage.setJSON(HISTORY_KEY, newHistory);
    
    return newItem;
  },

  // Delete an item
  delete: (id: string): void => {
    const history = historyStorage.getAll();
    const newHistory = history.filter(item => item.id !== id);
    storage.setJSON(HISTORY_KEY, newHistory);
  },

  // Clear all history
  clear: (): void => {
    storage.remove(HISTORY_KEY);
  }
};