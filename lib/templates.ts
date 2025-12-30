import { storage } from '@/lib/utils';

export interface TemplateItem {
  id: string;
  name: string;
  template: string; // 使用 {{prompt}} 作为占位符
  category: string;
  description?: string;
  positive?: string;
  negative?: string;
  isCustom?: boolean; // 是否为自定义模版
}

export const templateCategories = ['人物', '风格', '场景', '动漫', '3D', '摄影', '艺术', '自定义'];

export const defaultTemplates: TemplateItem[] = [
  {
    id: 'portrait-1',
    name: '电影级人像',
    category: '人物',
    template: 'masterpiece, best quality, ultra-detailed, 8k, realistic portrait of {{prompt}}, dramatic lighting, detailed skin texture, canon eos r3, 85mm lens, f/1.8, bokeh',
    positive: 'masterpiece, best quality, ultra-detailed, 8k, realistic portrait of {{prompt}}, dramatic lighting, detailed skin texture, canon eos r3, 85mm lens, f/1.8, bokeh',
    negative: '',
    description: '高质量真实人物肖像'
  },
  {
    id: 'portrait-2',
    name: '赛博朋克人像',
    category: '人物',
    template: 'masterpiece, best quality, cyberpunk style, {{prompt}}, neon lights, futuristic city background, highly detailed, chromatic aberration, ray tracing',
    positive: 'masterpiece, best quality, cyberpunk style, {{prompt}}, neon lights, futuristic city background, highly detailed, chromatic aberration, ray tracing',
    negative: '',
    description: '赛博朋克风格人物肖像'
  },
  {
    id: 'landscape-1',
    name: '史诗风景',
    category: '场景',
    template: 'masterpiece, best quality, breathtaking landscape of {{prompt}}, epic scale, cinematic lighting, 8k resolution, highly detailed, matte painting, concept art',
    positive: 'masterpiece, best quality, breathtaking landscape of {{prompt}}, epic scale, cinematic lighting, 8k resolution, highly detailed, matte painting, concept art',
    negative: '',
    description: '宏大史诗级自然风景'
  },
  {
    id: 'anime-1',
    name: '日系动漫',
    category: '动漫',
    template: 'masterpiece, best quality, anime style, {{prompt}}, vibrant colors, detailed illustration, makoto shinkai style, beautiful lighting',
    positive: 'masterpiece, best quality, anime style, {{prompt}}, vibrant colors, detailed illustration, makoto shinkai style, beautiful lighting',
    negative: '',
    description: '新海诚风格动漫插画'
  },
  {
    id: '3d-1',
    name: '3D 渲染',
    category: '3D',
    template: 'masterpiece, best quality, 3d render of {{prompt}}, c4d, octane render, 8k, ray tracing, unreal engine 5, highly detailed, realistic textures',
    positive: 'masterpiece, best quality, 3d render of {{prompt}}, c4d, octane render, 8k, ray tracing, unreal engine 5, highly detailed, realistic textures',
    negative: '',
    description: 'C4D/Octane 渲染风格'
  },
  {
    id: 'photo-1',
    name: '电影感摄影',
    category: '摄影',
    template: 'cinematic shot of {{prompt}}, 35mm film, grain, color graded, wes anderson style, symmetrical composition, detailed',
    positive: 'cinematic shot of {{prompt}}, 35mm film, grain, color graded, wes anderson style, symmetrical composition, detailed',
    negative: '',
    description: '35mm 胶片感电影级画面'
  },
  {
    id: 'art-1',
    name: '印象派油画',
    category: '艺术',
    template: 'oil painting of {{prompt}}, impasto, brush strokes, claude monet style, impressionism, vibrant colors, detailed',
    positive: 'oil painting of {{prompt}}, impasto, brush strokes, claude monet style, impressionism, vibrant colors, detailed',
    negative: '',
    description: '莫奈风格印象派油画'
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
      positive: item.positive || item.template,
      negative: item.negative || '',
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

  // 合并自定义模版与内置模版
  getAllTemplates: (): TemplateItem[] => {
    const custom = customTemplatesStorage.getAll();
    // 自定义模版在前
    return [...custom, ...defaultTemplates];
  }
};
