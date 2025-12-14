import { storage } from './utils';

export interface FavoriteItem {
    id: string;
    name: string; // 用户给收藏起的别名，默认为提示词前几个词
    positivePrompt: string; // 正向提示词
    negativePrompt: string; // 负向提示词
    tags: string[]; // 比如 "风格", "人像", "风景"
    createdAt: number;
}

const FAVORITES_KEY = 'prompt_favorites';

export const favoritesStorage = {
    getAll: (): FavoriteItem[] => {
        return storage.getJSON(FAVORITES_KEY, []);
    },

    add: (positivePrompt: string, negativePrompt: string = '', name?: string, tags: string[] = []): FavoriteItem => {
        const favorites = favoritesStorage.getAll();
        const displayName = name || positivePrompt.slice(0, 20) + (positivePrompt.length > 20 ? '...' : '');
        const newItem: FavoriteItem = {
            id: Date.now().toString(),
            name: displayName,
            positivePrompt,
            negativePrompt,
            tags,
            createdAt: Date.now(),
        };

        // 默认按照时间倒序
        const updated = [newItem, ...favorites];
        storage.setJSON(FAVORITES_KEY, updated);
        return newItem;
    },

    remove: (id: string) => {
        const favorites = favoritesStorage.getAll();
        const updated = favorites.filter(item => item.id !== id);
        storage.setJSON(FAVORITES_KEY, updated);
    },

    update: (id: string, updates: Partial<Omit<FavoriteItem, 'id' | 'createdAt'>>) => {
        const favorites = favoritesStorage.getAll();
        const updated = favorites.map(item =>
            item.id === id ? { ...item, ...updates } : item
        );
        storage.setJSON(FAVORITES_KEY, updated);
    },

    search: (query: string): FavoriteItem[] => {
        const favorites = favoritesStorage.getAll();
        const lowerQuery = query.toLowerCase();
        return favorites.filter(item =>
            item.name.toLowerCase().includes(lowerQuery) ||
            item.positivePrompt.toLowerCase().includes(lowerQuery) ||
            item.negativePrompt.toLowerCase().includes(lowerQuery) ||
            item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    },

    getTags: (): string[] => {
        const favorites = favoritesStorage.getAll();
        const allTags = new Set<string>();
        favorites.forEach(item => {
            item.tags.forEach(tag => allTags.add(tag));
        });
        return Array.from(allTags).sort();
    }
};
