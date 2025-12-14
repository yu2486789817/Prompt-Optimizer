'use client';

import { Copy, Sparkles } from 'lucide-react';
import { enhancePrompt } from '@/lib/magicPrompts';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import CharCounter from '@/components/CharCounter';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

export default function PromptInput({
  value,
  onChange,
  placeholder,
  disabled = false
}: PromptInputProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { addToast } = useToast();

  const handleMagicEnhance = () => {
    setIsEnhancing(true);
    // 模拟一个小延迟以展示动画效果
    setTimeout(() => {
      const enhanced = enhancePrompt(value);
      onChange(enhanced);
      setIsEnhancing(false);
    }, 600);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      addToast('已复制到剪贴板', 'success');
    } catch {
      addToast('复制失败', 'error');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
      addToast('已粘贴', 'success');
    } catch {
      addToast('粘贴失败', 'error');
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={6}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
      />

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between mt-2 px-1">
        {/* 字数和Token统计 */}
        <CharCounter text={value} />

        {/* 操作按钮 */}
        <div className="flex items-center gap-1">
          {/* 魔法增强按钮 */}
          <button
            onClick={handleMagicEnhance}
            disabled={isEnhancing}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${isEnhancing
              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'
              : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-md hover:scale-105'
              }`}
            title="魔法增强：随机注入高质量提示词"
          >
            <Sparkles size={12} className={isEnhancing ? 'animate-spin' : ''} />
            {isEnhancing ? '增强中...' : 'Magic Enhance'}
          </button>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          {value && (
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="复制"
            >
              <Copy size={14} />
            </button>
          )}

          <button
            onClick={handlePaste}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
            title="粘贴"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>

          {value && (
            <button
              onClick={handleClear}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="清空"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}