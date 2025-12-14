import { NextRequest, NextResponse } from 'next/server';
import { TranslationRequest, TranslationResponse, languageMap } from '@/lib/translation';
import { http } from '@/lib/http';
import { AxiosError } from 'axios';
import crypto from 'crypto';

// 使用axios和代理进行免费Google翻译
async function translateWithProxy(text: string, from: string, to: string): Promise<string> {
  try {
    // 使用Google翻译的免费API
    const url = 'https://translate.googleapis.com/translate_a/single';

    const response = await http.get(url, {
      params: {
        client: 'gtx',
        sl: languageMap[from as keyof typeof languageMap].googleCode,
        tl: languageMap[to as keyof typeof languageMap].googleCode,
        dt: 't',
        q: text
      }
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
  } catch (error: any) {
    console.error('Google翻译API错误:', error);

    if (error instanceof AxiosError) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
        throw new Error('代理连接失败，请检查代理服务器是否运行在127.0.0.1:10808');
      }
      if (error.response?.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      }
      if (error.response?.status === 403) {
        throw new Error('访问被拒绝，请检查代理配置');
      }
    }

    throw new Error(`翻译失败: ${error.message}`);
  }
}

// 百度翻译 API
async function translateWithBaidu(text: string, from: string, to: string, appid: string, appkey: string): Promise<string> {
  try {
    const salt = Date.now().toString();
    // 百度翻译API签名格式：appid + q + salt + appkey
    const sign_str = appid + text + salt + appkey;
    const sign = crypto
      .createHash('md5')
      .update(sign_str)
      .digest('hex');

    // 构建请求参数
    const params = new URLSearchParams();
    params.append('q', text);
    params.append('from', languageMap[from as keyof typeof languageMap].baiduCode);
    params.append('to', languageMap[to as keyof typeof languageMap].baiduCode);
    params.append('appid', appid);
    params.append('salt', salt);
    params.append('sign', sign);

    const response = await http.post('https://fanyi-api.baidu.com/api/trans/vip/translate',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    const data = response.data;

    if (data.error_code) {
      const errorMessages: Record<string, string> = {
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
  } catch (error: any) {
    console.error('百度翻译API错误:', error);
    throw new Error(`百度翻译失败: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  let text = '';
  let from = '';
  let to = '';
  let service = '';

  try {
    const body: TranslationRequest = await request.json();
    text = body.text || '';
    from = body.from || '';
    to = body.to || '';
    service = body.service || '';
    const { apiKey, secretKey } = body;

    if (!text || !from || !to || !service) {
      return NextResponse.json(
        { error: 'Missing required parameters: text, from, to, service' },
        { status: 400 }
      );
    }

    let translatedText = '';

    // 根据服务类型选择翻译方法
    switch (service) {
      case 'proxy':
        // 使用免费Google翻译
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

    const response: TranslationResponse = {
      success: true,
      originalText: text,
      translatedText: translatedText,
      from: from,
      to: to,
      service: service
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Translation error:', error);

    const response: TranslationResponse = {
      success: false,
      originalText: text || '',
      translatedText: '',
      from: from || '',
      to: to || '',
      service: service || '',
      error: error.message || '翻译失败'
    };

    return NextResponse.json(response, { status: 500 });
  }
}