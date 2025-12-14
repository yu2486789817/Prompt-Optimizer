export interface TranslationService {
  id: string;
  name: string;
  provider: string;
  apiEndpoint?: string;
  description?: string;
}

export const translationServices: TranslationService[] = [
  {
    id: 'proxy',
    name: '免费翻译',
    provider: 'Google',
    description: '通过代理免费使用Google翻译'
  },
  {
    id: 'baidu',
    name: '百度翻译',
    provider: 'Baidu',
    description: '百度翻译 API（需要APP ID和密钥）'
  }
];

export interface TranslationRequest {
  text: string;
  from: 'zh' | 'en';
  to: 'zh' | 'en';
  service: string;
  apiKey?: string; // 百度翻译的APP ID
  secretKey?: string; // 百度翻译的密钥
}

export interface TranslationResponse {
  success: boolean;
  originalText: string;
  translatedText: string;
  from: string;
  to: string;
  service: string;
  error?: string;
}

// 语言映射
export const languageMap = {
  'zh': {
    name: '中文',
    googleCode: 'zh-CN',
    baiduCode: 'zh'
  },
  'en': {
    name: '英文',
    googleCode: 'en',
    baiduCode: 'en'
  }
};

// 检测语言类型
export function detectLanguage(text: string): 'zh' | 'en' | 'unknown' {
  const cleanText = text.trim();
  if (!cleanText) return 'unknown';

  // 简单的语言检测：检查是否包含中文字符
  const chineseRegex = /[\u4e00-\u9fff]/;
  const englishRegex = /^[a-zA-Z\s\W\d]+$/;

  if (chineseRegex.test(cleanText)) {
    return 'zh';
  } else if (englishRegex.test(cleanText)) {
    return 'en';
  }

  return 'unknown';
}

// 获取目标语言（自动切换到另一种语言）
export function getTargetLanguage(currentLang: 'zh' | 'en'): 'zh' | 'en' {
  return currentLang === 'zh' ? 'en' : 'zh';
}