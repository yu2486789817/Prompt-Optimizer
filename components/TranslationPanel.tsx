'use client';

import { useState, useEffect } from 'react';
import { Languages, Copy, ArrowRightLeft, X } from 'lucide-react';
import { TranslationRequest, TranslationResponse, translationServices, languageMap, detectLanguage, getTargetLanguage } from '@/lib/translation';
import { storage } from '@/lib/utils';

interface TranslationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TranslationPanel({ isOpen, onClose }: TranslationPanelProps) {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [selectedService, setSelectedService] = useState('proxy');
  const [fromLang, setFromLang] = useState<'zh' | 'en'>('zh');
  const [toLang, setToLang] = useState<'zh' | 'en'>('en');
  const [isLoading, setIsLoading] = useState(false);

  // 从 localStorage 加载设置
  useEffect(() => {
    const savedService = storage.get('translationService');
    if (savedService) setSelectedService(savedService);
  }, []);

  // 保存服务选择
  useEffect(() => {
    storage.set('translationService', selectedService);
  }, [selectedService]);

  // 自动检测语言
  useEffect(() => {
    if (sourceText.trim()) {
      const detected = detectLanguage(sourceText);
      if (detected !== 'unknown' && detected !== fromLang) {
        setFromLang(detected);
        setToLang(getTargetLanguage(detected));
      }
    }
  }, [sourceText]);

  // 交换语言
  const handleSwapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  // 翻译文本
  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      alert('请输入要翻译的文本');
      return;
    }

    setIsLoading(true);

    try {
      const request: TranslationRequest = {
        text: sourceText,
        from: fromLang,
        to: toLang,
        service: selectedService,
        apiKey: storage.get(`${selectedService}TranslateApiKey`) || undefined,
        secretKey: storage.get(`${selectedService}TranslateSecretKey`) || undefined
      };

      let data: TranslationResponse;
      
      // 检查是否在 Electron 环境中
      if (window.electron) {
        // 使用 IPC 通信
        data = await window.electron.translate(request);
      } else {
        // 开发模式：使用 fetch
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        data = await response.json();
      }

      if (data.success) {
        setTranslatedText(data.translatedText);
      } else {
        throw new Error(data.error || '翻译失败');
      }
    } catch (error: any) {
      alert(`翻译失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 复制翻译结果
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
      alert('翻译结果已复制到剪贴板');
    } catch {
      alert('复制失败');
    }
  };

  // 应用翻译到提示词输入框（与父组件通信）
  const handleApplyToPrompt = () => {
    if (translatedText.trim()) {
      // 这里可以通过事件或者状态管理来通知父组件
      const event = new CustomEvent('applyTranslation', { detail: translatedText });
      window.dispatchEvent(event);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Languages className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">免费翻译工具</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 服务选择 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-900">翻译服务:</label>
            <div className="flex gap-3">
              {translationServices.map(service => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    selectedService === service.id
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {service.name}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {selectedService === 'proxy' && '通过代理免费使用Google翻译'}
            {selectedService === 'baidu' && '需要配置百度翻译API密钥'}
          </div>
        </div>

        {/* 翻译区域 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 源文本区域 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">
                  {languageMap[fromLang].name}
                </label>
                <span className="text-xs text-gray-500">
                  {sourceText.length} 字符
                </span>
              </div>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder={`请输入要翻译的${languageMap[fromLang].name}文本...`}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 翻译按钮和语言切换 */}
            <div className="lg:hidden flex justify-center my-4">
              <button
                onClick={handleSwapLanguages}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                <ArrowRightLeft size={20} />
              </button>
            </div>

            {/* 目标文本区域 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-900">
                    {languageMap[toLang].name}
                  </label>
                  {translatedText && (
                    <button
                      onClick={handleCopy}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Copy size={14} />
                      复制
                    </button>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {translatedText.length} 字符
                </span>
              </div>
              <textarea
                value={translatedText}
                readOnly
                placeholder="翻译结果将显示在这里..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 resize-none"
              />
            </div>
          </div>

          {/* 大屏语言切换按钮 */}
          <div className="hidden lg:flex justify-center my-6">
            <button
              onClick={handleSwapLanguages}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              <ArrowRightLeft size={24} />
            </button>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedService === 'proxy' && '免费服务，通过代理访问Google翻译'}
            {selectedService === 'baidu' && (!storage.get('baiduTranslateApiKey') || !storage.get('baiduTranslateSecretKey')) && (
              <span className="text-amber-600">请先在设置中配置百度翻译API Key</span>
            )}
            {selectedService === 'baidu' && storage.get('baiduTranslateApiKey') && storage.get('baiduTranslateSecretKey') && (
              <span className="text-green-600">百度翻译已配置</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleTranslate}
              disabled={isLoading || !sourceText.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '翻译中...' : '翻译'}
            </button>
            {translatedText && (
              <button
                onClick={handleApplyToPrompt}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                应用到提示词
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}