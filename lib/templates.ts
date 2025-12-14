import { storage } from '@/lib/utils'; // Assuming this exists, based on other files

export interface TemplateItem {
  id: string;
  name: string;
  template: string; // 使用 {{prompt}} 作为占位符
  category: string;
  description?: string;
  isCustom?: boolean; // 标记是否为用户自定义
}

export const templateCategories = ['全部', '人像', '风景', '二次元', '3D', '艺术', '摄影', '自定义'];

export const defaultTemplates: TemplateItem[] = [
  {
    id: 'portrait-1',
    name: '大师级人像',
    category: '人像',
    template: 'masterpiece, best quality, ultra-detailed, 8k, realistic portrait of {{prompt}}, dramatic lighting, detailed skin texture, canon eos r3, 85mm lens, f/1.8, bokeh',
    description: '高质量写实人像摄影风格'
  },
  {
    id: 'portrait-2',
    name: '赛博朋克人像',
    category: '人像',
    template: 'masterpiece, best quality, cyberpunk style, {{prompt}}, neon lights, futuristic city background, highly detailed, chromatic aberration, ray tracing',
    description: '未来科技感赛博朋克风格'
  },
  {
    id: 'landscape-1',
    name: '史诗风景',
    category: '风景',
    template: 'masterpiece, best quality, breathtaking landscape of {{prompt}}, epic scale, cinematic lighting, 8k resolution, highly detailed, matte painting, concept art',
    description: '宏大的影视级概念场景'
  },
  {
    id: 'anime-1',
    name: '精美二次元',
    category: '二次元',
    template: 'masterpiece, best quality, anime style, {{prompt}}, vibrant colors, detailed illustration, makoto shinkai style, beautiful lighting',
    description: '新海诚风格的高质量插画'
  },
  {
    id: '3d-1',
    name: '3D 渲染',
    category: '3D',
    template: 'masterpiece, best quality, 3d render of {{prompt}}, c4d, octane render, 8k, ray tracing, unreal engine 5, highly detailed, realistic textures',
    description: 'C4D/Octane 渲染风格'
  },
  {
    id: 'photo-1',
    name: '电影质感',
    category: '摄影',
    template: 'cinematic shot of {{prompt}}, 35mm film, grain, color graded, wes anderson style, symmetrical composition, detailed',
    description: '具有胶片感和电影构图的摄影风格'
  },
  {
    id: 'art-1',
    name: '油画风格',
    category: '艺术',
    template: 'oil painting of {{prompt}}, impasto, brush strokes, claude monet style, impressionism, vibrant colors, detailed',
    description: '印象派油画风格'
  }
];

const CUSTOM_TEMPLATES_KEY = 'custom_templates';

export const customTemplatesStorage = {
  getAll: (): TemplateItem[] => {
    return storage.getJSON(CUSTOM_TEMPLATES_KEY, []);
  },

  add: (item: Omit<TemplateItem, 'id' | 'isCustom'>) => {
    const templates = customTemplatesStorage.getAll();
    const newItem: TemplateItem = {
      ...item,
      id: `custom-${Date.now()}`,
      isCustom: true
    };
    storage.setJSON(CUSTOM_TEMPLATES_KEY, [...templates, newItem]);
    return newItem;
  },

  delete: (id: string) => {
    const templates = customTemplatesStorage.getAll();
    const updated = templates.filter(t => t.id !== id);
    storage.setJSON(CUSTOM_TEMPLATES_KEY, updated);
  },

  // 获取所有模版（默认+自定义）
  getAllTemplates: (): TemplateItem[] => {
    const custom = customTemplatesStorage.getAll();
    // 自定义模版排在前面
    return [...custom, ...defaultTemplates];
  }
};
