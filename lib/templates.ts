import { storage } from '@/lib/utils';

export interface TemplateItem {
  id: string;
  name: string;
  template: string; // ?? {{prompt}} ?????
  category: string;
  description?: string;
  positive?: string;
  negative?: string;
  isCustom?: boolean; // ??????????
}

export const templateCategories = ['??', '??', '??', '???', '3D', '??', '??', '???'];

export const defaultTemplates: TemplateItem[] = [
  {
    id: 'portrait-1',
    name: '?????',
    category: '??',
    template: 'masterpiece, best quality, ultra-detailed, 8k, realistic portrait of {{prompt}}, dramatic lighting, detailed skin texture, canon eos r3, 85mm lens, f/1.8, bokeh',
    positive: 'masterpiece, best quality, ultra-detailed, 8k, realistic portrait of {{prompt}}, dramatic lighting, detailed skin texture, canon eos r3, 85mm lens, f/1.8, bokeh',
    negative: '',
    description: '???????????'
  },
  {
    id: 'portrait-2',
    name: '??????',
    category: '??',
    template: 'masterpiece, best quality, cyberpunk style, {{prompt}}, neon lights, futuristic city background, highly detailed, chromatic aberration, ray tracing',
    positive: 'masterpiece, best quality, cyberpunk style, {{prompt}}, neon lights, futuristic city background, highly detailed, chromatic aberration, ray tracing',
    negative: '',
    description: '???????????'
  },
  {
    id: 'landscape-1',
    name: '????',
    category: '??',
    template: 'masterpiece, best quality, breathtaking landscape of {{prompt}}, epic scale, cinematic lighting, 8k resolution, highly detailed, matte painting, concept art',
    positive: 'masterpiece, best quality, breathtaking landscape of {{prompt}}, epic scale, cinematic lighting, 8k resolution, highly detailed, matte painting, concept art',
    negative: '',
    description: '??????????'
  },
  {
    id: 'anime-1',
    name: '?????',
    category: '???',
    template: 'masterpiece, best quality, anime style, {{prompt}}, vibrant colors, detailed illustration, makoto shinkai style, beautiful lighting',
    positive: 'masterpiece, best quality, anime style, {{prompt}}, vibrant colors, detailed illustration, makoto shinkai style, beautiful lighting',
    negative: '',
    description: '???????????'
  },
  {
    id: '3d-1',
    name: '3D ??',
    category: '3D',
    template: 'masterpiece, best quality, 3d render of {{prompt}}, c4d, octane render, 8k, ray tracing, unreal engine 5, highly detailed, realistic textures',
    positive: 'masterpiece, best quality, 3d render of {{prompt}}, c4d, octane render, 8k, ray tracing, unreal engine 5, highly detailed, realistic textures',
    negative: '',
    description: 'C4D/Octane ????'
  },
  {
    id: 'photo-1',
    name: '????',
    category: '??',
    template: 'cinematic shot of {{prompt}}, 35mm film, grain, color graded, wes anderson style, symmetrical composition, detailed',
    positive: 'cinematic shot of {{prompt}}, 35mm film, grain, color graded, wes anderson style, symmetrical composition, detailed',
    negative: '',
    description: '???????????????'
  },
  {
    id: 'art-1',
    name: '????',
    category: '??',
    template: 'oil painting of {{prompt}}, impasto, brush strokes, claude monet style, impressionism, vibrant colors, detailed',
    positive: 'oil painting of {{prompt}}, impasto, brush strokes, claude monet style, impressionism, vibrant colors, detailed',
    negative: '',
    description: '???????'
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

  // ?????????+????
  getAllTemplates: (): TemplateItem[] => {
    const custom = customTemplatesStorage.getAll();
    // ?????????
    return [...custom, ...defaultTemplates];
  }
};
