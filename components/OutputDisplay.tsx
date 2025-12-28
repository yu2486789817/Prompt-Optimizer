'use client';

import { useState } from 'react';
import { Copy, Download, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/Toast';
import CharCounter from '@/components/CharCounter';
import ImagePreviewModal from './ImagePreviewModal';

interface OutputDisplayProps {
  positivePrompt: string;
  negativePrompt: string;
  translatedPositive: string;
  translatedNegative: string;
  isLoading: boolean;
  isTranslating?: boolean;
  onFineTune?: (prompt: string) => void;
}

export default function OutputDisplay({
  positivePrompt,
  negativePrompt,
  translatedPositive,
  translatedNegative,
  isLoading,
  isTranslating = false,
  onFineTune
}: OutputDisplayProps) {
  const { addToast } = useToast();
  const [showPreview, setShowPreview] = useState(false);

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`${type}已复制到剪贴板`, 'success');
    } catch {
      addToast('复制失败', 'error');
    }
  };

  const handleDownload = () => {
    const content = `主提示词:\n${positivePrompt}\n\n负面提示词:\n${negativePrompt}\n\n中文翻译:\n主提示词: ${translatedPositive}\n负面提示词: ${translatedNegative}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading || isTranslating) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {isLoading ? '正在生成优化提示词...' : '正在翻译成中文...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 英文版本 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
          英文版本
        </h3>

        <div className="space-y-4">
          {/* 主提示词 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">
                主提示词
              </label>
              <div className="flex items-center gap-2">
                {positivePrompt && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 text-sm flex items-center gap-1 mr-1"
                    title="使用 Z-Image 快速预览"
                  >
                    <ImageIcon size={14} />
                    预览
                  </button>
                )}
                {positivePrompt && onFineTune && (
                  <button
                    onClick={() => onFineTune(positivePrompt)}
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm flex items-center gap-1"
                  >
                    <Sparkles size={14} />
                    微调
                  </button>
                )}
                {positivePrompt && (
                  <button
                    onClick={() => handleCopy(positivePrompt, '主提示词')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <Copy size={14} />
                    复制
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <textarea
                value={positivePrompt}
                readOnly
                rows={6}
                placeholder="生成的优化提示词将显示在这里..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 resize-none text-sm text-gray-900 dark:text-white"
              />
            </div>
            {/* 字数统计和操作栏 */}
            <div className="flex items-center justify-between mt-2 px-1">
              <CharCounter text={positivePrompt} />
            </div>
          </div>

          {/* 负面提示词 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">
                负面提示词
              </label>
              <div className="flex items-center gap-2">
                {negativePrompt && onFineTune && (
                  <button
                    onClick={() => onFineTune(negativePrompt)}
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm flex items-center gap-1"
                  >
                    <Sparkles size={14} />
                    微调
                  </button>
                )}
                {negativePrompt && (
                  <button
                    onClick={() => handleCopy(negativePrompt, '负面提示词')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <Copy size={14} />
                    复制
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <textarea
                value={negativePrompt}
                readOnly
                rows={4}
                placeholder="负面提示词将显示在这里..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm resize-none text-sm text-gray-900 dark:text-white"
              />
            </div>
            {/* 字数统计和操作栏 */}
            <div className="flex items-center justify-between mt-2 px-1">
              <CharCounter text={negativePrompt} />
            </div>
          </div>
        </div>
      </div>

      {/* 中文翻译 */}
      {(translatedPositive || translatedNegative) && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            中文翻译
          </h3>

          <div className="space-y-4">
            {/* 主提示词翻译 */}
            {translatedPositive && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">
                    主提示词翻译
                  </label>
                  <button
                    onClick={() => handleCopy(translatedPositive, '主提示词翻译')}
                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm flex items-center gap-1"
                  >
                    <Copy size={14} />
                    复制
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={translatedPositive}
                    readOnly
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-green-50 dark:bg-green-900/10 resize-none text-sm text-gray-900 dark:text-white"
                  />
                </div>
                {/* 字数统计和操作栏 */}
                <div className="flex items-center justify-between mt-2 px-1">
                  <CharCounter text={translatedPositive} />
                </div>
              </div>
            )}

            {/* 负面提示词翻译 */}
            {translatedNegative && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">
                    负面提示词翻译
                  </label>
                  <button
                    onClick={() => handleCopy(translatedNegative, '负面提示词翻译')}
                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm flex items-center gap-1"
                  >
                    <Copy size={14} />
                    复制
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={translatedNegative}
                    readOnly
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-green-50/50 dark:bg-green-900/10 backdrop-blur-sm resize-none text-sm text-gray-900 dark:text-white"
                  />
                </div>
                {/* 字数统计和操作栏 */}
                <div className="flex items-center justify-between mt-2 px-1">
                  <CharCounter text={translatedNegative} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 底部按钮 */}
      {(positivePrompt || negativePrompt) && (
        <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700 gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors flex items-center gap-2"
          >
            <ImageIcon size={16} />
            预览效果
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            下载提示词
          </button>
        </div>
      )}

      {/* 图片预览模态框 */}
      <ImagePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        prompt={positivePrompt}
        negativePrompt={negativePrompt}
      />
    </div>
  );
}
