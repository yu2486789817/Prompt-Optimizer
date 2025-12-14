export interface VocabItem {
  id: string;
  chinese: string;
  english: string;
  category: string;
}

export const defaultVocabulary: VocabItem[] = [
  // 风格
  { id: '1', chinese: '赛博朋克', english: 'cyberpunk', category: '风格' },
  { id: '2', chinese: '蒸汽波', english: 'vaporwave', category: '风格' },
  { id: '3', chinese: '哥特', english: 'gothic', category: '风格' },
  { id: '4', chinese: '像素风', english: 'pixel art', category: '风格' },
  { id: '5', chinese: '水彩画', english: 'watercolor painting', category: '风格' },

  // 角色特征
  { id: '6', chinese: '灰毛', english: 'gray hair', category: '角色' },
  { id: '7', chinese: '蓝瞳', english: 'blue eyes', category: '角色' },
  { id: '8', chinese: '白发', english: 'white hair', category: '角色' },
  { id: '9', chinese: '红发', english: 'red hair', category: '角色' },
  { id: '10', chinese: '猫耳', english: 'cat ears', category: '角色' },

  // 画质
  { id: '11', chinese: '8K', english: '8k', category: '画质' },
  { id: '12', chinese: '超详细', english: 'highly detailed', category: '画质' },
  { id: '13', chinese: '杰作', english: 'masterpiece', category: '画质' },
  { id: '14', chinese: '最佳画质', english: 'best quality', category: '画质' },
  { id: '15', chinese: '超高清', english: 'ultra high resolution', category: '画质' },

  // 光影
  { id: '16', chinese: '动态模糊', english: 'motion blur', category: '光影' },
  { id: '17', chinese: '伦勃朗光', english: 'rembrandt lighting', category: '光影' },
  { id: '18', chinese: '体积光', english: 'volumetric lighting', category: '光影' },
  { id: '19', chinese: '边缘光', english: 'rim lighting', category: '光影' },
  { id: '20', chinese: '电影光', english: 'cinematic lighting', category: '光影' },

  // 构图
  { id: '21', chinese: '全身像', english: 'full body shot', category: '构图' },
  { id: '22', chinese: '特写', english: 'close-up', category: '构图' },
  { id: '23', chinese: '广角', english: 'wide angle', category: '构图' },
  { id: '24', chinese: '对称构图', english: 'symmetrical composition', category: '构图' },
  { id: '25', chinese: '动态构图', english: 'dynamic composition', category: '构图' },

  // 环境背景
  { id: '26', chinese: '未来都市', english: 'futuristic city', category: '背景' },
  { id: '27', chinese: '樱花', english: 'sakura petals', category: '背景' },
  { id: '28', chinese: '星空', english: 'starry sky', category: '背景' },
  { id: '29', chinese: '废墟', english: 'ruins', category: '背景' },
  { id: '30', chinese: '森林', english: 'enchanted forest', category: '背景' }
];

export const vocabularyCategories = [
  '全部',
  '风格',
  '角色',
  '画质',
  '光影',
  '构图',
  '背景'
];