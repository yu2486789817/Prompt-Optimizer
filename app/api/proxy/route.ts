import { NextRequest, NextResponse } from 'next/server';
import { http } from '@/lib/http';
import { MODEL_IDS } from '@/lib/models';

// 模型配置
const modelConfigs: Record<string, { endpoint: string; headers: Record<string, string> }> = {
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

    // 如果没有提供 API Key，返回错误
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { error: `API key is required for model: ${model}` },
        { status: 400 }
      );
    }

    // 准备请求头
    const headers = { ...config.headers };

    // 根据不同模型添加认证头
    switch (model) {
      case MODEL_IDS.GEMINI:
        config.endpoint += `?key=${apiKey}`;
        break;
      case MODEL_IDS.GROK:
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      case MODEL_IDS.DEEPSEEK:
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      case MODEL_IDS.QWEN:
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['X-DashScope-SSE'] = 'disable';
        break;
    }

    // 准备请求体
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
          messages: messages,
          max_tokens: 2000,
          temperature: 0,
          stream: false
        };
        break;

      case MODEL_IDS.DEEPSEEK:
        requestBody = {
          model: model,
          messages: messages,
          max_tokens: 2000,
          temperature: 0.7
        };
        break;

      case MODEL_IDS.QWEN:
        requestBody = {
          model: 'Qwen/Qwen3-235B-A22B-Thinking-2507',
          messages: messages,
          max_tokens: 2000,
          temperature: 0.7,
          stream: false
        };
        break;

      default:
        requestBody = {
          model: model,
          messages: messages,
          max_tokens: 2000,
          temperature: 0.7
        };
    }

    // 发送请求到对应模型 API
    const response = await http.post(config.endpoint, requestBody, {
      headers: headers
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
      model: model,
      mock: false
    });

  } catch (error: any) {
    console.error('Proxy error:', error);

    // 如果是axios错误，提取更详细的信息
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