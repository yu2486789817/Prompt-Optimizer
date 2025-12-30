'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import { storage } from '@/lib/utils';
import { supportedModels, AIModel } from '@/lib/models';

interface FineTunePanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt: string;
  onApplyFineTune: (fineTunedPrompt: string) => void;
  selectedModel: AIModel;
}

export default function FineTunePanel({
  isOpen,
  onClose,
  initialPrompt,
  onApplyFineTune,
  selectedModel
}: FineTunePanelProps) {
  const [fineTuneRequest, setFineTuneRequest] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fineTunedPrompt, setFineTunedPrompt] = useState('');

  // 当面板打开且有初始提示词时，预填充一些常见的微调选项
  useEffect(() => {
    if (isOpen && initialPrompt) {
      setFineTunedPrompt('');
      setFineTuneRequest('');
    }
  }, [isOpen, initialPrompt]);

  const handleFineTune = async () => {
    if (!fineTuneRequest.trim() || !initialPrompt.trim()) {
      alert('请输入微调要求');
      return;
    }

    setIsProcessing(true);
    try {
      // 获取 API Key
      const apiKeys: Record<string, string> = storage.getJSON('apiKeys', {});
      const apiKey = apiKeys[selectedModel.modelId];

      let data;
      
      // 检查是否在 Electron 环境中
      if (window.electron) {
        // 使用 IPC 通信
        data = await window.electron.proxy({
          model: selectedModel.modelId,
          messages: [
            {
              role: 'system',
              content: `你是一个AI绘画提示词优化专家。用户会提供原始提示词和微调要求，你需要根据要求对提示词进行精细调整。

要求：
1. 保持提示词的核心要素和结构
2. 根据用户的具体要求进行调整
3. 确保调整后的提示词更加符合用户需求
4. 保持英文，使用逗号分隔各个标签
5. 返回优化后的提示词，不要额外解释

如果用户提供的是JSON格式的正负提示词，请分别进行优化并返回相同的JSON格式。`
            },
            {
              role: 'user',
              content: `原始提示词：${initialPrompt}

微调要求：${fineTuneRequest}`
            }
          ],
          apiKey: apiKey
        });
      } else {
        // 开发模式：使用 fetch
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel.modelId,
            messages: [
              {
                role: 'system',
                content: `你是一个AI绘画提示词优化专家。用户会提供原始提示词和微调要求，你需要根据要求对提示词进行精细调整。

要求：
1. 保持提示词的核心要素和结构
2. 根据用户的具体要求进行调整
3. 确保调整后的提示词更加符合用户需求
4. 保持英文，使用逗号分隔各个标签
5. 返回优化后的提示词，不要额外解释

如果用户提供的是JSON格式的正负提示词，请分别进行优化并返回相同的JSON格式。`
              },
              {
                role: 'user',
                content: `原始提示词：${initialPrompt}

微调要求：${fineTuneRequest}`
              }
            ],
            apiKey: apiKey
          }),
        });

        data = await response.json();
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.result) {
        setFineTunedPrompt(data.result);
      }
    } catch (error: any) {
      alert(`微调失败: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (fineTunedPrompt.trim()) {
      onApplyFineTune(fineTunedPrompt);
      onClose();
    }
  };

  const presetOptions = [
    { label: '增强细节', value: '请增强提示词的细节描述，让画面更加精细' },
    { label: '调整风格', value: '请调整提示词的风格，使其更符合艺术创作要求' },
    { label: '优化构图', value: '请优化提示词的构图描述，提升画面布局' },
    { label: '增强光影', value: '请增强提示词的光影效果描述' },
    { label: '简化提示', value: '请简化提示词，保留核心要素' },
    { label: '增加权重', value: '请为重要元素添加权重语法' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">提示词微调</h3>
                <p className="text-sm text-gray-600">根据你的要求精细调整提示词</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 原始提示词 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              原始提示词
            </label>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {initialPrompt || '无提示词'}
              </p>
            </div>
          </div>

          {/* 快速选项 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              快速微调选项
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presetOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setFineTuneRequest(option.value)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 微调要求输入 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              微调要求
            </label>
            <textarea
              value={fineTuneRequest}
              onChange={(e) => setFineTuneRequest(e.target.value)}
              placeholder="请输入你的微调要求，例如：增强人物的细节描述，调整画面色调为冷色调..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* 微调按钮 */}
          <div className="mb-6">
            <button
              onClick={handleFineTune}
              disabled={isProcessing || !fineTuneRequest.trim()}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {isProcessing ? '正在微调...' : '开始微调'}
            </button>
          </div>

          {/* 微调结果 */}
          {fineTunedPrompt && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                微调结果
              </label>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
                  {fineTunedPrompt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {fineTunedPrompt.length} 字符
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(fineTunedPrompt)}
                    className="text-purple-600 hover:text-purple-700 text-sm"
                  >
                    复制
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 应用按钮 */}
          {fineTunedPrompt && (
            <div className="flex gap-3">
              <button
                onClick={handleApply}
                className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                应用微调结果
              </button>
              <button
                onClick={() => setFineTunedPrompt('')}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                重新微调
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}