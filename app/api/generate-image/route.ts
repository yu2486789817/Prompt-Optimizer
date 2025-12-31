import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL_NAME = 'gemini-2.0-flash-exp';

interface GeneratedImage {
    id: string;
    base64: string;
    mimeType: string;
}

/**
 * Build enhanced prompt for image generation
 */
function buildImagePrompt(prompt: string, aspectRatio: string = '1:1', imageCount: number = 0): string {
    const aspectRatioDesc: Record<string, string> = {
        '1:1': 'square format',
        '16:9': 'wide landscape format (16:9)',
        '9:16': 'tall portrait format (9:16)',
        '4:3': 'standard landscape format (4:3)',
        '3:4': 'standard portrait format (3:4)',
    };

    const ratio = aspectRatioDesc[aspectRatio] || 'square format';
    const target = imageCount > 0 ? `the provided ${imageCount === 1 ? 'image' : 'images'}` : 'the following description';

    return `Generate 1 high-quality image in ${ratio} at 1024x1024 pixels resolution, high definition based on ${target}. Output only the image without any text.\n\nDescription: ${prompt}`;
}

/**
 * Extract images from Gemini API response
 */
function extractImages(data: any): GeneratedImage[] {
    const images: GeneratedImage[] = [];

    if (!data.candidates || !Array.isArray(data.candidates)) {
        throw new Error('API 返回格式错误，未找到有效内容');
    }

    for (const candidate of data.candidates) {
        if (!candidate.content?.parts) continue;

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

    if (images.length === 0) {
        // Check if there's a text response instead
        for (const candidate of data.candidates) {
            if (candidate.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (part.text) {
                        throw new Error(`模型返回了文本而非图像: "${part.text.substring(0, 100)}..."`);
                    }
                }
            }
        }
        throw new Error('API 未返回任何图像，请尝试修改提示词');
    }

    return images;
}

/**
 * Parse API error responses into user-friendly messages
 */
function parseApiError(status: number, error: any): string {
    const errorMessage = error?.error?.message || '';

    switch (status) {
        case 400:
            if (errorMessage.includes('API key')) {
                return 'API Key 格式无效，请检查并重新输入';
            }
            if (errorMessage.includes('safety')) {
                return '内容被安全过滤器拦截，请修改提示词后重试';
            }
            return `请求格式错误: ${errorMessage || '请检查输入内容'}`;

        case 401:
        case 403:
            return 'API Key 无效或已过期，请检查并重新设置';

        case 404:
            return '模型不可用，请稍后重试';

        case 429:
            return 'API 调用频率超限，请稍后再试（建议等待 1 分钟）';

        case 500:
        case 502:
        case 503:
            return 'Gemini 服务暂时不可用，请稍后重试';

        default:
            return `请求失败 (${status}): ${errorMessage || '未知错误'}`;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt, apiKey, aspectRatio, images = [] } = body;

        if (!prompt) {
            return NextResponse.json({ success: false, error: '请输入提示词' }, { status: 400 });
        }

        if (!apiKey) {
            return NextResponse.json({ success: false, error: '请先设置 API Key' }, { status: 401 });
        }

        if (!Array.isArray(images)) {
            return NextResponse.json({ success: false, error: '图片格式错误' }, { status: 400 });
        }

        if (images.length > 3) {
            return NextResponse.json({ success: false, error: '最多支持上传 3 张图片' }, { status: 400 });
        }

        const enhancedPrompt = buildImagePrompt(prompt, aspectRatio, images.length);
        const parts = images.map((image: { base64: string; mimeType?: string }) => ({
            inlineData: {
                data: image.base64,
                mimeType: image.mimeType || 'image/png',
            },
        }));

        parts.push({ text: enhancedPrompt });

        const response = await fetch(`${API_BASE}/${MODEL_NAME}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts,
                    },
                ],
                generationConfig: {
                    responseModalities: ['TEXT', 'IMAGE'],
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return NextResponse.json(
                { success: false, error: parseApiError(response.status, error) },
                { status: response.status }
            );
        }

        const data = await response.json();
        const images = extractImages(data);

        // 返回第一张图片
        return NextResponse.json({
            success: true,
            imageBase64: images[0].base64,
            mimeType: images[0].mimeType,
        });

    } catch (error: any) {
        console.error('Generate Image Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || '图像生成失败' },
            { status: 500 }
        );
    }
}
