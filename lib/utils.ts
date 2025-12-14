export interface LoraItem {
  id: string;
  name: string;
  category: string;
  triggerWords: string[];
  description?: string;
  createdAt: string;
}

// 提示词整理功能
export function organizePrompt(prompt: string): string {
  if (!prompt.trim()) return '';

  // 分割提示词为数组
  let tags = prompt
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);

  // 去重
  const uniqueTags = Array.from(new Set(tags));

  // 质量词优先级列表
  const qualityWords = [
    'masterpiece', 'best quality', 'ultra high resolution', '8k', '4k', 'highly detailed',
    'ultra-detailed', 'photorealistic', 'professional', 'high quality', 'insanely detailed'
  ];

  // 主体词优先级列表
  const subjectWords = [
    'girl', 'woman', 'man', 'boy', 'person', 'character', 'portrait', 'full body'
  ];

  // 风格词列表
  const styleWords = [
    'anime', 'realistic', 'oil painting', 'watercolor', 'digital art', 'concept art',
    'cyberpunk', 'steampunk', 'fantasy', 'sci-fi', 'gothic', 'vaporwave', 'pixel art'
  ];

  // 分类存储
  const quality: string[] = [];
  const subjects: string[] = [];
  const styles: string[] = [];
  const details: string[] = [];
  const lighting: string[] = [];
  const composition: string[] = [];
  const others: string[] = [];

  uniqueTags.forEach(tag => {
    const lowerTag = tag.toLowerCase();

    if (qualityWords.some(word => lowerTag.includes(word))) {
      quality.push(tag);
    } else if (subjectWords.some(word => lowerTag.includes(word))) {
      subjects.push(tag);
    } else if (styleWords.some(word => lowerTag.includes(word))) {
      styles.push(tag);
    } else if (lowerTag.includes('light') || lowerTag.includes('shadow') || lowerTag.includes('glow')) {
      lighting.push(tag);
    } else if (lowerTag.includes('shot') || lowerTag.includes('angle') || lowerTag.includes('view')) {
      composition.push(tag);
    } else if (tag.length > 10) {
      details.push(tag);
    } else {
      others.push(tag);
    }
  });

  // 重新组合，按照逻辑顺序
  const organized = [
    ...quality,
    ...subjects,
    ...details,
    ...styles,
    ...lighting,
    ...composition,
    ...others
  ];

  return organized.join(', ');
}

// 权重语法处理
export function addWeightSyntax(prompt: string): string {
  if (!prompt.trim()) return '';

  return prompt
    .split(',')
    .map(tag => {
      const trimmed = tag.trim();
      if (!trimmed) return '';

      // 检查是否已经有权重语法，如果有则不再添加
      if (trimmed.startsWith('(') && trimmed.includes(':')) {
        return trimmed;
      }

      // 提取纯文本（去除可能的现有权重）
      const cleanTag = trimmed.replace(/^\(|\):[\d.]+$/g, '');
      const lowerTag = cleanTag.toLowerCase();

      // 为重要词汇添加权重
      const importantWords = ['masterpiece', 'best quality', 'highly detailed', '8k'];
      if (importantWords.some(word => lowerTag.includes(word))) {
        return `(${cleanTag}:1.2)`;
      }

      // 为风格词添加中等权重
      const styleWords = ['anime', 'realistic', 'cyberpunk', 'fantasy'];
      if (styleWords.some(word => lowerTag.includes(word))) {
        return `(${cleanTag}:1.1)`;
      }

      return trimmed;
    })
    .filter(tag => tag.length > 0)
    .join(', ');
}

// 生成完整的优化提示词
export function optimizePrompt(prompt: string): string {
  let organized = organizePrompt(prompt);
  organized = addWeightSyntax(organized);
  return organized;
}

// localStorage 工具函数
export const storage = {
  get: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },

  set: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },

  remove: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },

  getJSON: <T = any>(key: string, defaultValue: T): T => {
    try {
      const item = storage.get(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  setJSON: (key: string, value: any): void => {
    storage.set(key, JSON.stringify(value));
  }
};

// LoRA 管理工具函数
export const loraStorage = {
  // 获取所有LoRA
  getAll: (): LoraItem[] => {
    return storage.getJSON('loras', []);
  },

  // 添加LoRA
  add: (lora: Omit<LoraItem, 'id' | 'createdAt'>): LoraItem => {
    const loras = loraStorage.getAll();
    const newLora: LoraItem = {
      ...lora,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    loras.push(newLora);
    storage.setJSON('loras', loras);
    return newLora;
  },

  // 更新LoRA
  update: (id: string, updates: Partial<LoraItem>): boolean => {
    const loras = loraStorage.getAll();
    const index = loras.findIndex(l => l.id === id);
    if (index >= 0) {
      loras[index] = { ...loras[index], ...updates };
      storage.setJSON('loras', loras);
      return true;
    }
    return false;
  },

  // 删除LoRA
  delete: (id: string): boolean => {
    const loras = loraStorage.getAll();
    const filtered = loras.filter(l => l.id !== id);
    if (filtered.length < loras.length) {
      storage.setJSON('loras', filtered);
      return true;
    }
    return false;
  },

  // 搜索LoRA
  search: (query: string): LoraItem[] => {
    const loras = loraStorage.getAll();
    const lowerQuery = query.toLowerCase();
    return loras.filter(lora =>
      lora.name.toLowerCase().includes(lowerQuery) ||
      lora.category.toLowerCase().includes(lowerQuery) ||
      lora.triggerWords.some(word => word.toLowerCase().includes(lowerQuery)) ||
      (lora.description && lora.description.toLowerCase().includes(lowerQuery))
    );
  },

  // 获取所有分类
  getCategories: (): string[] => {
    const loras = loraStorage.getAll();
    const categories = new Set(loras.map(lora => lora.category));
    return Array.from(categories).filter(Boolean).sort();
  },

  // 按分类获取LoRA
  getByCategory: (category: string): LoraItem[] => {
    const loras = loraStorage.getAll();
    return loras.filter(lora => lora.category === category);
  }
};