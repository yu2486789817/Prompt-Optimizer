'use client';

import { X, BookOpenText, ExternalLink, Sparkles } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const apiLinks = [
  {
    name: 'Google AI Studio（Gemini）',
    url: 'https://aistudio.google.com/app/apikey',
    description: '获取 Gemini API Key'
  },
  {
    name: 'xAI Console（Grok）',
    url: 'https://console.x.ai/',
    description: '创建 Grok API Key'
  },
  {
    name: 'DeepSeek 开放平台',
    url: 'https://platform.deepseek.com/api_keys',
    description: '获取 DeepSeek API Key'
  },
  {
    name: '阿里云 DashScope（通义千问）',
    url: 'https://dashscope.console.aliyun.com/apiKey',
    description: '获取 Qwen API Key'
  }
];

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] border border-white/20 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpenText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              新手教程
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold">
              <Sparkles size={18} className="text-violet-500" />
              快速上手
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>点击右上角「设置」并选择模型，粘贴对应的 API Key。</li>
              <li>在「输入提示词」中写下中文或英文描述。</li>
              <li>点击「生成优化提示词」，等待主/负面提示词输出。</li>
              <li>使用「翻译」「微调」或右侧词汇/LoRA 面板进一步优化。</li>
              <li>满意后可复制输出并保存到收藏或历史记录。</li>
            </ol>
          </section>

          <section className="space-y-3">
            <div className="font-semibold text-gray-900 dark:text-gray-100">常用快捷键</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                <span>生成提示词</span>
                <span className="font-mono text-xs">Ctrl/Cmd + Enter</span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                <span>魔法增强</span>
                <span className="font-mono text-xs">Ctrl/Cmd + Shift + E</span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                <span>复制输出</span>
                <span className="font-mono text-xs">Ctrl/Cmd + Shift + C</span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                <span>关闭弹窗</span>
                <span className="font-mono text-xs">Esc</span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="font-semibold text-gray-900 dark:text-gray-100">API 获取链接</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {apiLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-400 dark:hover:border-violet-600 hover:bg-white dark:hover:bg-gray-800 transition-all"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                      {link.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {link.description}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-violet-500 mt-1" />
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              提示：部分平台需要先创建项目或开通计费后才能生成 API Key。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
