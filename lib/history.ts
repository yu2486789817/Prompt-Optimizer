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

// 生成 UUID（浏览器兼容）
function generateUUID(): string {
  // 优先使用浏览器原生 API
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // 降级方案：使用时间戳 + 随机数
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
}

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
      id: generateUUID(),
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
