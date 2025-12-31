import { useState, useEffect, type ChangeEvent } from 'react';
import { X, Download, RefreshCw, AlertCircle, Image as ImageIcon, Settings, Save } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface ImageGenerationPanelProps {
    initialPrompt: string;
    negativePrompt: string;
    showClose?: boolean;
    onClose?: () => void;
    className?: string;
}

export default function ImageGenerationPanel({
    initialPrompt,
    negativePrompt,
    showClose = false,
    onClose,
    className = '',
}: ImageGenerationPanelProps) {
    const [image, setImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState(initialPrompt);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [referenceImages, setReferenceImages] = useState<
        Array<{ id: string; name: string; dataUrl: string; base64: string; mimeType: string }>
    >([]);

    // 配置状态
    const [apiKey, setApiKey] = useState('');
    const [showSettings, setShowSettings] = useState(true);

    const { addToast } = useToast();

    // 加载配置
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('google_api_key');

        if (storedKey) {
            setApiKey(storedKey);
            setShowSettings(false);
        }
    }, []);

    // 保存配置
    const handleSaveConfig = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        setShowSettings(false);
        addToast('API Key 已保存', 'success');
    };

    // 更新 prompt
    useEffect(() => {
        setPrompt(initialPrompt);
    }, [initialPrompt]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        if (!apiKey) {
            setShowSettings(true);
            setError('请先设置 API Key');
            return;
        }

        setIsLoading(true);
        setError(null);
        setImage(null);

        try {
            let data;
            
            // 检查是否在 Electron 环境中
            if (window.electron) {
                // 使用 IPC 通信
                data = await window.electron.generateImage({
                    prompt,
                    apiKey,
                    aspectRatio,
                    images: referenceImages.map(({ base64, mimeType }) => ({ base64, mimeType })),
                });
            } else {
                // 开发模式：使用 fetch
                const response = await fetch('/api/generate-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt,
                        apiKey,
                        aspectRatio,
                        images: referenceImages.map(({ base64, mimeType }) => ({ base64, mimeType })),
                    }),
                });

                data = await response.json();
            }

            if (!data.success) {
                if (data.error.includes('安全过滤器')) {
                    throw new Error('生成失败：内容被安全策略拦截 (400 Safety). 请尝试修改提示词。');
                }
                throw new Error(data.error || '生成失败');
            }

            if (data.imageBase64) {
                setImage(data.imageBase64);
            } else {
                throw new Error('未收到图片数据');
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || '系统错误');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        if (referenceImages.length + files.length > 3) {
            setError('最多支持上传 3 张图片');
            event.target.value = '';
            return;
        }

        try {
            const newImages = await Promise.all(
                files.map(async (file) => {
                    if (!file.type.startsWith('image/')) {
                        throw new Error('仅支持上传图片文件');
                    }

                    const dataUrl = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = () => reject(new Error('读取图片失败'));
                        reader.readAsDataURL(file);
                    });

                    const base64 = dataUrl.split(',')[1] || '';

                    return {
                        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        name: file.name,
                        dataUrl,
                        base64,
                        mimeType: file.type || 'image/png',
                    };
                })
            );

            setReferenceImages((prev) => [...prev, ...newImages]);
        } catch (err: any) {
            setError(err.message || '图片上传失败');
        } finally {
            event.target.value = '';
        }
    };

    const handleRemoveImage = (id: string) => {
        setReferenceImages((prev) => prev.filter((item) => item.id !== id));
    };

    const handleDownload = () => {
        if (!image) return;
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${image}`;
        link.download = `gemini-gen-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('开始下载', 'success');
    };

    return (
        <div className={`relative w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ImageIcon className="text-blue-500" />
                    Gemini 2.0 Flash 图像编辑
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        title="API 设置"
                    >
                        <Settings size={20} />
                    </button>
                    {showClose && (
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Settings & Prompt */}
                <div className="w-[320px] flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">

                        {/* Settings Section */}
                        {showSettings && (
                            <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <Settings size={14} />
                                        配置
                                    </h4>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Google API Key</label>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="AIza..."
                                        className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <button
                                    onClick={handleSaveConfig}
                                    className="w-full py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg hover:bg-black dark:hover:bg-gray-600 flex items-center justify-center gap-2"
                                >
                                    <Save size={14} />
                                    保存配置
                                </button>
                            </div>
                        )}

                        {/* Prompt Editing */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    编辑图片 (最多 3 张)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 dark:text-gray-400 dark:file:bg-slate-800 dark:file:text-gray-200"
                                />
                                {referenceImages.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {referenceImages.map((item) => (
                                            <div key={item.id} className="relative group">
                                                <img
                                                    src={item.dataUrl}
                                                    alt={item.name}
                                                    className="h-16 w-full rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                                                />
                                                <button
                                                    onClick={() => handleRemoveImage(item.id)}
                                                    className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-200 rounded-full shadow p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    上传后将基于图片进行编辑，不上传则执行文生图。
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">比例</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
                                        <button
                                            key={ratio}
                                            onClick={() => setAspectRatio(ratio)}
                                            className={`px-2 py-2 text-xs rounded-lg border transition-all ${aspectRatio === ratio
                                                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                                    : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            {ratio}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">提示词 (Prompt)</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    rows={10}
                                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    生成中...
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={18} />
                                    生成预览
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Preview */}
                <div className="flex-1 bg-gray-100/50 dark:bg-black/20 flex items-center justify-center relative p-8">
                    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden relative group">
                        {image ? (
                            <>
                                <img
                                    src={`data:image/png;base64,${image}`}
                                    alt="Preview"
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                />
                                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={handleDownload}
                                        className="px-4 py-2 bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-white rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-sm font-medium backdrop-blur"
                                    >
                                        <Download size={16} />
                                        保存图片
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-gray-300 dark:text-gray-600">
                                    <ImageIcon size={40} />
                                </div>
                                <div className="text-gray-400 dark:text-gray-500">
                                    <p className="font-medium">准备生成</p>
                                    <p className="text-sm mt-1">配置 API Key 后点击生成 (gemini-2.0-flash-exp)</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-50 dark:bg-red-900/90 text-red-600 dark:text-red-200 px-4 py-3 rounded-xl flex items-center gap-3 shadow-xl backdrop-blur border border-red-100 dark:border-red-800/50 max-w-[90%]">
                                <AlertCircle size={20} className="shrink-0" />
                                <span className="text-sm font-medium">{error}</span>
                                <button onClick={() => setError(null)} className="ml-2 hover:bg-black/5 p-1 rounded-full"><X size={14} /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
