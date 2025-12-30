import { NextRequest, NextResponse } from 'next/server';
import { http } from '@/lib/http';
import { MODEL_IDS } from '@/lib/models';

type ModelConfig = {
  endpoint: string;
  headers: Record<string, string>;
};

// 模型配置（只作为模板，不在请求中直接修改）
const modelConfigs: Record<string, ModelConfig> = {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, messages, apiKey } = body;

    if (!model || !messages) {
      return NextResponse.json(
        { error: 'Missing required parameters: model and messages' },
        { status: 400 }
      );
    }

    // 获取模型配置
    const config = modelConfigs[model];
    if (!config) {
      return NextResponse.json(
        { error: `Unsupported model: ${model}` },
        { status: 400 }
      );
    }

    // 复制配置，避免跨请求污染
    const endpointUrl = new URL(config.endpoint);
    const headers = { ...config.headers };

    // API Key 校验
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { error: `API key is required for model: ${model}` },
        { status: 400 }
      );
    }

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
    let requestBody: any;

    switch (model) {
      case MODEL_IDS.GEMINI:
        requestBody = {
          contents: messages.map((msg: any) => ({
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

    // 发送请求到对应模型 API
    const response = await http.post(endpointUrl.toString(), requestBody, {
      headers
    });

    if (!response.data) {
      console.error('API Error: No data received');

      return NextResponse.json(
        {
          error: `API request failed with status ${response.status}`,
          status: response.status
        },
        { status: response.status }
      );
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

    return NextResponse.json({
      success: true,
      result: finalResult,
      model,
      mock: false
    });

  } catch (error: any) {
    console.error('Proxy error:', error);

    // 如果是axios错误，提取更详细的消息
    if (error.response) {
      return NextResponse.json(
        {
          error: `API Error: ${error.response.status} ${error.response.statusText}`,
          details: error.response.data
        },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      {
        error: `Internal server error: ${error.message}`,
        details: error.stack
      },
      { status: 500 }
    );
  }
}
