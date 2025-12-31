const { ipcMain } = require('electron');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const crypto = require('crypto');

// 模型 ID 常量（与 lib/models.ts 保持一致）
const MODEL_IDS = {
  GEMINI: 'gemini-2.5-flash',
  GROK: 'grok-4-latest',
  DEEPSEEK: 'deepseek-chat',
  QWEN: 'qwen-max',
};

// HTTP 客户端配置（支持代理）
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

// 增加超时时间，特别是对于慢速代理
const http = axios.create({
  httpAgent: agent,
  httpsAgent: agent,
  proxy: false,
  timeout: 60000, // 增加到 60 秒，适应慢速代理
  headers: {
    'Content-Type': 'application/json',
  }
});

// 语言映射
const languageMap = {
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

// 模型配置
const modelConfigs = {
  [MODEL_IDS.GEMINI]: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    headers: {
      'Content-Type': 'application/json',
    }
  },
  [MODEL_IDS.GROK]: {
    endpoint: 'https://api.x.ai/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
    }
  },
  [MODEL_IDS.DEEPSEEK]: {
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
    }
  },
  [MODEL_IDS.QWEN]: {
    endpoint: 'https://api-inference.modelscope.cn/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
    }
  }
};

// 处理代理请求（AI 模型调用）
async function handleProxyRequest(event, { model, messages, apiKey }) {
  try {
    if (!model || !messages) {
      return { error: 'Missing required parameters: model and messages' };
    }

    const config = modelConfigs[model];
    if (!config) {
      return { error: `Unsupported model: ${model}` };
    }

    if (!apiKey || apiKey.trim() === '') {
      return { error: `API key is required for model: ${model}` };
    }

    const endpointUrl = new URL(config.endpoint);
    const headers = { ...config.headers };

    // 根据不同模型添加认证信息
    switch (model) {
      case MODEL_IDS.GEMINI:
        endpointUrl.searchParams.set('key', apiKey);
        break;
      case MODEL_IDS.GROK:
      case MODEL_IDS.DEEPSEEK:
      case MODEL_IDS.QWEN:
        headers['Authorization'] = `Bearer ${apiKey}`;
        if (model === MODEL_IDS.QWEN) {
          headers['X-DashScope-SSE'] = 'disable';
        }
        break;
    }

    // 构建请求体
    let requestBody;

    switch (model) {
      case MODEL_IDS.GEMINI:
        requestBody = {
          contents: messages.map((msg) => ({
            parts: [{ text: msg.content }]
          })),
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.7,
          }
        };
        break;

      case MODEL_IDS.GROK:
        requestBody = {
          model: MODEL_IDS.GROK,
          messages,
          max_tokens: 2000,
          temperature: 0,
          stream: false
        };
        break;

      case MODEL_IDS.DEEPSEEK:
        requestBody = {
          model,
          messages,
          max_tokens: 2000,
          temperature: 0.7
        };
        break;

      case MODEL_IDS.QWEN:
        requestBody = {
          model: 'Qwen/Qwen3-235B-A22B-Thinking-2507',
          messages,
          max_tokens: 2000,
          temperature: 0.7,
          stream: false
        };
        break;

      default:
        requestBody = {
          model,
          messages,
          max_tokens: 2000,
          temperature: 0.7
        };
    }

    // 发送请求（使用更长的超时时间，适应慢速代理）
    const response = await http.post(endpointUrl.toString(), requestBody, { 
      headers,
      timeout: 60000 // 60 秒超时
    });

    if (!response.data) {
      return {
        error: `API request failed with status ${response.status}`,
        status: response.status
      };
    }

    const result = response.data;
    let finalResult = '';

    // 根据不同模型解析响应
    switch (model) {
      case MODEL_IDS.GEMINI:
        finalResult = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        break;

      case MODEL_IDS.GROK:
      case MODEL_IDS.DEEPSEEK:
      case MODEL_IDS.QWEN:
        finalResult = result.choices?.[0]?.message?.content || '';
        break;

      default:
        finalResult = JSON.stringify(result);
    }

    return {
      success: true,
      result: finalResult,
      model,
      mock: false
    };

  } catch (error) {
    console.error('Proxy error:', error);

    // 处理超时错误
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        error: '请求超时。可能是网络连接较慢或代理服务器响应延迟。请检查网络连接和代理设置，然后重试。',
        details: 'Timeout exceeded'
      };
    }

    if (error.response) {
      return {
        error: `API Error: ${error.response.status} ${error.response.statusText}`,
        details: error.response.data
      };
    }

    return {
      error: `Internal server error: ${error.message}`,
      details: error.stack
    };
  }
}

// 使用代理进行免费Google翻译
async function translateWithProxy(text, from, to) {
  try {
    const url = 'https://translate.googleapis.com/translate_a/single';

    const response = await http.get(url, {
      params: {
        client: 'gtx',
        sl: languageMap[from]?.googleCode || from,
        tl: languageMap[to]?.googleCode || to,
        dt: 't',
        q: text
      },
      timeout: 60000 // 60 秒超时
    });

    if (response.data && response.data[0]) {
      let translatedText = '';
      for (const item of response.data[0]) {
        if (item[0]) {
          translatedText += item[0];
        }
      }
      return translatedText;
    }

    throw new Error('翻译结果解析失败');
  } catch (error) {
    console.error('Google翻译API错误:', error);

    // 处理超时错误
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('翻译请求超时。请检查网络连接和代理设置，然后重试。');
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      throw new Error('代理连接失败，请检查代理服务器是否运行在127.0.0.1:10808');
    }
    if (error.response?.status === 429) {
      throw new Error('请求过于频繁，请稍后再试');
    }
    if (error.response?.status === 403) {
      throw new Error('访问被拒绝，请检查代理配置');
    }

    throw new Error(`翻译失败: ${error.message}`);
  }
}

// 百度翻译 API
async function translateWithBaidu(text, from, to, appid, appkey) {
  try {
    const salt = Date.now().toString();
    const sign_str = appid + text + salt + appkey;
    const sign = crypto
      .createHash('md5')
      .update(sign_str)
      .digest('hex');

    const params = new URLSearchParams();
    params.append('q', text);
    params.append('from', languageMap[from]?.baiduCode || from);
    params.append('to', languageMap[to]?.baiduCode || to);
    params.append('appid', appid);
    params.append('salt', salt);
    params.append('sign', sign);

    const response = await http.post('https://fanyi-api.baidu.com/api/trans/vip/translate',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 60000 // 60 秒超时
      }
    );

    const data = response.data;

    if (data.error_code) {
      const errorMessages = {
        '52001': 'API请求超时',
        '52002': '系统错误',
        '52003': '未授权用户',
        '54000': '必填参数为空',
        '54001': '签名错误',
        '54003': '访问频率受限',
        '54004': '账户余额不足',
        '54005': '长query请求频繁',
        '58000': '客户端IP非法',
        '58001': '译文语言方向不支持',
        '58002': '服务当前已关闭',
        '90107': '认证未通过或未生效'
      };
      throw new Error(errorMessages[data.error_code] || `百度翻译错误: ${data.error_code}`);
    }

    if (!data.trans_result || data.trans_result.length === 0) {
      throw new Error('百度翻译返回空结果');
    }

    return data.trans_result[0].dst;
  } catch (error) {
    console.error('百度翻译API错误:', error);
    throw new Error(`百度翻译失败: ${error.message}`);
  }
}

// 处理翻译请求
async function handleTranslateRequest(event, { text, from, to, service, apiKey, secretKey }) {
  try {
    if (!text || !from || !to || !service) {
      return {
        success: false,
        error: 'Missing required parameters: text, from, to, service'
      };
    }

    let translatedText = '';

    switch (service) {
      case 'proxy':
        translatedText = await translateWithProxy(text, from, to);
        break;

      case 'baidu':
        if (!apiKey || !secretKey) {
          throw new Error('百度翻译需要提供APP ID和密钥');
        }
        translatedText = await translateWithBaidu(text, from, to, apiKey, secretKey);
        break;

      default:
        throw new Error(`Unsupported translation service: ${service}`);
    }

    return {
      success: true,
      originalText: text,
      translatedText: translatedText,
      from: from,
      to: to,
      service: service
    };

  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      originalText: text || '',
      translatedText: '',
      from: from || '',
      to: to || '',
      service: service || '',
      error: error.message || '翻译失败'
    };
  }
}

// 生成图片
async function handleGenerateImageRequest(event, { prompt, apiKey, aspectRatio, images = [] }) {
  try {
    if (!prompt) {
      return { success: false, error: '请输入提示词' };
    }

    if (!apiKey) {
      return { success: false, error: '请先设置 API Key' };
    }

    if (!Array.isArray(images)) {
      return { success: false, error: '图片格式错误' };
    }

    if (images.length > 3) {
      return { success: false, error: '最多支持上传 3 张图片' };
    }

    const aspectRatioDesc = {
      '1:1': 'square format',
      '16:9': 'wide landscape format (16:9)',
      '9:16': 'tall portrait format (9:16)',
      '4:3': 'standard landscape format (4:3)',
      '3:4': 'standard portrait format (3:4)',
    };

    const ratio = aspectRatioDesc[aspectRatio] || 'square format';
    const target = images.length > 0 ? `the provided ${images.length === 1 ? 'image' : 'images'}` : 'the following description';
    const enhancedPrompt = `Generate 1 high-quality image in ${ratio} at 1024x1024 pixels resolution, high definition based on ${target}. Output only the image without any text.\n\nDescription: ${prompt}`;

    const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
    const MODEL_NAME = 'gemini-2.0-flash-exp';
    const parts = images.map((image) => ({
      inlineData: {
        data: image.base64,
        mimeType: image.mimeType || 'image/png',
      },
    }));

    parts.push({ text: enhancedPrompt });

    const response = await http.post(
      `${API_BASE}/${MODEL_NAME}:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: parts,
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000 // 图片生成需要更长时间，120 秒
      }
    );

    if (!response.data) {
      return { success: false, error: 'API 返回格式错误' };
    }

    const data = response.data;
    const images = [];

    if (data.candidates && Array.isArray(data.candidates)) {
      for (const candidate of data.candidates) {
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
              images.push({
                id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                base64: part.inlineData.data,
                mimeType: part.inlineData.mimeType || 'image/png',
              });
            }
          }
        }
      }
    }

    if (images.length === 0) {
      // 检查是否有文本响应
      for (const candidate of data.candidates || []) {
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              return { success: false, error: `模型返回了文本而非图像: "${part.text.substring(0, 100)}..."` };
            }
          }
        }
      }
      return { success: false, error: 'API 未返回任何图像，请尝试修改提示词' };
    }

    return {
      success: true,
      imageBase64: images[0].base64,
      mimeType: images[0].mimeType,
    };

  } catch (error) {
    console.error('Generate Image Error:', error);

    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      const errorMessage = errorData?.error?.message || '';

      let userMessage = '';
      switch (status) {
        case 400:
          if (errorMessage.includes('API key')) {
            userMessage = 'API Key 格式无效，请检查并重新输入';
          } else if (errorMessage.includes('safety')) {
            userMessage = '内容被安全过滤器拦截，请修改提示词后重试';
          } else {
            userMessage = `请求格式错误: ${errorMessage || '请检查输入内容'}`;
          }
          break;
        case 401:
        case 403:
          userMessage = 'API Key 无效或已过期，请检查并重新设置';
          break;
        case 404:
          userMessage = '模型不可用，请稍后重试';
          break;
        case 429:
          userMessage = 'API 调用频率超限，请稍后再试（建议等待 1 分钟）';
          break;
        case 500:
        case 502:
        case 503:
          userMessage = 'Gemini 服务暂时不可用，请稍后重试';
          break;
        default:
          userMessage = `请求失败 (${status}): ${errorMessage || '未知错误'}`;
      }

      return { success: false, error: userMessage };
    }

    return {
      success: false,
      error: error.message || '图像生成失败'
    };
  }
}

// 注册 IPC 处理器
function setupIpcHandlers() {
  try {
    ipcMain.handle('api:proxy', handleProxyRequest);
    ipcMain.handle('api:translate', handleTranslateRequest);
    ipcMain.handle('api:generate-image', handleGenerateImageRequest);
    console.log('IPC handlers registered successfully');
  } catch (error) {
    console.error('Failed to register IPC handlers:', error);
    throw error;
  }
}

module.exports = { setupIpcHandlers };
