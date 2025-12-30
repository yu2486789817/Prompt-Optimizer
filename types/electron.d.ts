// Electron IPC API 类型定义
export interface ElectronAPI {
  proxy: (data: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    apiKey: string;
  }) => Promise<{
    success?: boolean;
    result?: string;
    error?: string;
    model?: string;
    mock?: boolean;
  }>;

  translate: (data: {
    text: string;
    from: string;
    to: string;
    service: string;
    apiKey?: string;
    secretKey?: string;
  }) => Promise<{
    success: boolean;
    originalText: string;
    translatedText: string;
    from: string;
    to: string;
    service: string;
    error?: string;
  }>;

  generateImage: (data: {
    prompt: string;
    apiKey: string;
    aspectRatio?: string;
  }) => Promise<{
    success: boolean;
    imageBase64?: string;
    mimeType?: string;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

