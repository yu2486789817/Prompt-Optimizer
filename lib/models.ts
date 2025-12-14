export interface AIModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  description?: string;
}

export const MODEL_IDS = {
  GEMINI: 'gemini-2.5-flash',
  GROK: 'grok-4-latest',
  DEEPSEEK: 'deepseek-chat',
  QWEN: 'qwen-max',
} as const;

export const supportedModels: AIModel[] = [
  {
    id: MODEL_IDS.GEMINI,
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    modelId: MODEL_IDS.GEMINI,
    description: '默认推荐'
  },
  {
    id: MODEL_IDS.GROK,
    name: 'Grok-4',
    provider: 'xAI',
    modelId: MODEL_IDS.GROK,
    description: 'R18支持'
  },
  {
    id: MODEL_IDS.DEEPSEEK,
    name: 'DeepSeek-V3',
    provider: 'DeepSeek',
    modelId: MODEL_IDS.DEEPSEEK,
    description: '高性价比'
  },
  {
    id: MODEL_IDS.QWEN,
    name: 'Qwen3-235B-Thinking',
    provider: 'Alibaba',
    modelId: MODEL_IDS.QWEN,
    description: '思维链模型'
  }
];
