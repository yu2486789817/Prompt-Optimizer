'use client';

// Prompt Optimizer Main Page

import { useState, useEffect, useCallback } from 'react';
import { History, LayoutTemplate, Star, PanelLeftClose, PanelLeft, Sparkles, Boxes, BookOpen, BookOpenText } from 'lucide-react';
import LoraManager from '@/components/LoraManager';
import LoraSidebar from '@/components/LoraSidebar';
import VocabPanel from '@/components/VocabPanel';
import PromptInput from '@/components/PromptInput';
import ModelSelector from '@/components/ModelSelector';
import OutputDisplay from '@/components/OutputDisplay';
import ImageGenerationPanel from '@/components/ImageGenerationPanel';
import SortButton from '@/components/SortButton';
import SettingsButton from '@/components/SettingsButton';
import TranslationPanel from '@/components/TranslationPanel';
import FineTunePanel from '@/components/FineTunePanel';
import HistoryPanel from '@/components/HistoryPanel';
import TemplateModal from '@/components/TemplateModal';
import FavoritesPanel from '@/components/FavoritesPanel';
import ThemeToggle from '@/components/ThemeToggle';
import TutorialModal from '@/components/TutorialModal';
import { defaultVocabulary, VocabItem } from '@/lib/vocab';
import { storage } from '@/lib/utils';
import { supportedModels, AIModel } from '@/lib/models';
import { historyStorage, HistoryItem } from '@/lib/history';
import { TemplateItem } from '@/lib/templates';
import { FavoriteItem } from '@/lib/favorites';
import { useToast } from '@/components/Toast';
import { enhancePrompt } from '@/lib/magicPrompts';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<AIModel>(supportedModels[0]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [outputPrompt, setOutputPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [translatedPositive, setTranslatedPositive] = useState('');
  const [translatedNegative, setTranslatedNegative] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [vocabulary, setVocabulary] = useState<VocabItem[]>(defaultVocabulary);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [showSettings, setShowSettings] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showFineTune, setShowFineTune] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showLora, setShowLora] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'vocab' | 'lora'>('vocab');
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [fineTunePrompt, setFineTunePrompt] = useState('');
  const [fineTuneTarget, setFineTuneTarget] = useState<'input' | 'output'>('output');
  const [activeTab, setActiveTab] = useState<'optimize' | 'image'>('optimize');
  const [imagePrompt, setImagePrompt] = useState('');

  const { addToast } = useToast();

  // 从 localStorage 加载用户自定义词汇
  useEffect(() => {
    const savedVocab = storage.getJSON('customVocabulary', defaultVocabulary);
    setVocabulary(savedVocab);

    const savedModel = storage.get('selectedModel');
    if (savedModel) {
      const model = supportedModels.find(m => m.id === savedModel);
      if (model) setSelectedModel(model);
    }
  }, []);

  // 保存选中的模型到 localStorage
  useEffect(() => {
    storage.set('selectedModel', selectedModel.id);
  }, [selectedModel]);

  // 监听翻译应用事件
  useEffect(() => {
    const handleApplyTranslation = (event: CustomEvent) => {
      const translatedText = event.detail;
      if (translatedText.trim()) {
        setInputPrompt(translatedText);
      }
    };

    window.addEventListener('applyTranslation', handleApplyTranslation as EventListener);
    return () => {
      window.removeEventListener('applyTranslation', handleApplyTranslation as EventListener);
    };
  }, []);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: 生成提示词
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (inputPrompt.trim() && !isLoading) {
          handleGenerate();
        }
      }

      // Ctrl/Cmd + Shift + E: 魔法增强
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        const enhanced = enhancePrompt(inputPrompt);
        setInputPrompt(enhanced);
        addToast('✨ 魔法增强已应用', 'success');
      }

      // Ctrl/Cmd + Shift + C: 复制输出
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (outputPrompt) {
          navigator.clipboard.writeText(outputPrompt);
          addToast('主提示词已复制', 'success');
        }
      }

      // Esc: 关闭所有弹窗
      if (e.key === 'Escape') {
        setShowSettings(false);
        setShowTranslation(false);
        setShowFineTune(false);
        setShowHistory(false);
        setShowTemplates(false);
        setShowFavorites(false);
        setShowLora(false);
        setShowTutorial(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputPrompt, outputPrompt, isLoading, addToast]);

  // 翻译文本
  const translateText = useCallback(async (text: string): Promise<string> => {
    try {
      // 检查是否在 Electron 环境中
      if (window.electron) {
        const data = await window.electron.translate({
          text,
          from: 'en',
          to: 'zh',
          service: 'proxy'
        });
        if (data.success) {
          return data.translatedText;
        }
      } else {
        // 开发模式：使用 fetch
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            from: 'en',
            to: 'zh',
            service: 'proxy'
          })
        });

        const data = await response.json();
        if (data.success) {
          return data.translatedText;
        }
      }
    } catch (error) {
      console.error('翻译失败:', error);
    }
    return '';
  }, []);

  // 生成提示词
  const handleGenerate = useCallback(async () => {
    if (!inputPrompt.trim()) {
      addToast('请输入提示词内容', 'warning');
      return;
    }

    // 获取 API Key
    const apiKeys: Record<string, string> = storage.getJSON('apiKeys', {});
    const apiKey = apiKeys[selectedModel.id];

    if (!apiKey || apiKey.trim() === '') {
      addToast(`请先在设置中配置 ${selectedModel.name} 的 API Key`, 'error');
      return;
    }

    setIsLoading(true);

    try {
      let data;
      
      // 检查是否在 Electron 环境中
      if (typeof window !== 'undefined' && window.electron) {
        // 使用 IPC 通信
        try {
          data = await window.electron.proxy({
            model: selectedModel.id,
            apiKey: apiKey,
            messages: [
              {
                role: 'system',
                content: `你是一个专业的AI绘画提示词优化专家。请根据用户的描述，生成高质量的英文AI绘画提示词。

要求：
1. 返回JSON格式：{"positive": "主提示词", "negative": "负面提示词"}
2. 主提示词要包含主体、风格、画质、光影、构图等要素
3. 负面提示词要包含需要避免的元素
4. 使用英文，用逗号分隔各个标签
5. 确保提示词结构清晰、逻辑合理`
              },
              {
                role: 'user',
                content: inputPrompt
              }
            ]
          });
        } catch (ipcError: any) {
          console.error('IPC call failed:', ipcError);
          throw new Error(`IPC 通信失败: ${ipcError.message || '未知错误'}`);
        }
      } else {
        // 开发模式：使用 fetch（仅在开发环境中可用）
        if (process.env.NODE_ENV === 'development') {
          const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: selectedModel.id,
              apiKey: apiKey,
              messages: [
                {
                  role: 'system',
                  content: `你是一个专业的AI绘画提示词优化专家。请根据用户的描述，生成高质量的英文AI绘画提示词。

要求：
1. 返回JSON格式：{"positive": "主提示词", "negative": "负面提示词"}
2. 主提示词要包含主体、风格、画质、光影、构图等要素
3. 负面提示词要包含需要避免的元素
4. 使用英文，用逗号分隔各个标签
5. 确保提示词结构清晰、逻辑合理`
                },
                {
                  role: 'user',
                  content: inputPrompt
                }
              ]
            }),
          });

          data = await response.json();
        } else {
          // 打包后的应用，但 window.electron 不存在
          throw new Error('Electron IPC 未正确加载。请重启应用或检查 preload.js 配置。');
        }
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.result) {
        try {
          // 清理可能的 markdown 代码块标记
          let jsonStr = data.result.trim();

          // 移除 ```json 或 ``` 开头
          if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.slice(7);
          } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.slice(3);
          }

          // 移除结尾的 ```
          if (jsonStr.endsWith('```')) {
            jsonStr = jsonStr.slice(0, -3);
          }

          jsonStr = jsonStr.trim();

          const parsed = JSON.parse(jsonStr);
          const positive = parsed.positive || '';
          const negative = parsed.negative || '';

          setOutputPrompt(positive);
          setNegativePrompt(negative);

          // 保存历史记录
          historyStorage.add({
            modelId: selectedModel.id,
            inputPrompt,
            positivePrompt: positive,
            negativePrompt: negative,
            translatedPositive: '',
            translatedNegative: '',
          });
          setHistoryRefreshTrigger(prev => prev + 1);

          // 自动翻译
          if (positive) {
            translateText(positive).then(setTranslatedPositive);
          }
          if (negative) {
            translateText(negative).then(setTranslatedNegative);
          }

        } catch (error) {
          console.error('处理结果时出错:', error);
          addToast('处理结果时出错，请重试', 'error');
        }
      }
    } catch (error: any) {
      addToast(`生成失败: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [inputPrompt, selectedModel, addToast, translateText]);

  // 整理提示词
  const handleSort = () => {
    const sorted = require('@/lib/utils').optimizePrompt(inputPrompt);
    setInputPrompt(sorted);
  };

  // 添加词汇到输入框
  const handleAddVocab = (english: string) => {
    if (inputPrompt.trim()) {
      setInputPrompt(prev => `${prev}, ${english}`);
    } else {
      setInputPrompt(english);
    }
  };

  // 处理微调
  const handleFineTune = (prompt: string, target: 'input' | 'output' = 'output') => {
    setFineTunePrompt(prompt);
    setFineTuneTarget(target);
    setShowFineTune(true);
  };

  // 应用微调结果
  const handleApplyFineTune = (newPrompt: string) => {
    if (fineTuneTarget === 'input') {
      setInputPrompt(newPrompt);
    } else {
      setOutputPrompt(newPrompt);
    }
    setShowFineTune(false);
    addToast('微调已应用', 'success');
  };

  // 历史记录选择
  const handleHistorySelect = (item: HistoryItem) => {
    setInputPrompt(item.inputPrompt);
    setOutputPrompt(item.positivePrompt);
    setNegativePrompt(item.negativePrompt);
    setShowHistory(false);
    addToast('已加载历史记录', 'success');
  };

  // 模版选择
  const handleTemplateSelect = (template: TemplateItem) => {
    const positive = template.positive ?? template.template;
    const negative = template.negative ?? '';
    
    if (inputPrompt.trim()) {
      if (confirm('是否替换当前输入内容？取消则追加到末尾。')) {
        setInputPrompt(positive);
      } else {
        setInputPrompt(prev => `${prev}, ${positive}`);
      }
    } else {
      setInputPrompt(positive);
    }
    if (negative.trim()) {
      setNegativePrompt(negative);
    }
    addToast('模版已加载到输入区域', 'success');
  };

  // 收藏选择
  const handleFavoriteSelect = (item: FavoriteItem) => {
    setOutputPrompt(item.positivePrompt);
    setNegativePrompt(item.negativePrompt);
    setShowFavorites(false);
    addToast('已加载收藏的提示词', 'success');
  };

  // LoRA 选择
  const handleLoraSelect = (triggerWords: string[]) => {
    const loraText = triggerWords.join(', ');
    if (inputPrompt.trim()) {
      setInputPrompt(prev => `${prev}, ${loraText}`);
    } else {
      setInputPrompt(loraText);
    }
    addToast('LoRA 触发词已添加', 'success');
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden font-sans selection:bg-violet-500/30">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.5]"></div>
        <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] bg-violet-200/25 dark:bg-violet-600/15 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-blob"></div>
        <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] bg-sky-200/25 dark:bg-sky-600/15 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/4 w-[550px] h-[550px] bg-rose-200/20 dark:bg-rose-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {showSplash && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 dark:bg-slate-950/90 animate-splash-screen"
          onAnimationEnd={() => setShowSplash(false)}
        >
          <div className="text-center px-6">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/10 border border-white/20 px-5 py-2 text-white/80 text-sm mb-4">
              <Sparkles size={16} className="text-violet-300" />
              多模型 AI 绘画提示词优化工具
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Prompt Optimizer
            </h2>
            <p className="text-sm sm:text-base text-white/70 mt-3">
              正在为你准备最佳创作体验...
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 flex h-screen">
        {/* 左侧面板 */}
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'}`}>
          <div className="h-full flex flex-col">
            {/* 标签切换栏 */}
            <div className="flex bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-white/20 dark:border-white/10">
              <button
                onClick={() => setSidebarTab('vocab')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${sidebarTab === 'vocab'
                  ? 'text-violet-600 dark:text-violet-400 bg-white/50 dark:bg-slate-800/50 border-b-2 border-violet-600 dark:border-violet-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                  }`}
              >
                <BookOpen size={18} />
                词汇
              </button>
              <button
                onClick={() => setSidebarTab('lora')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${sidebarTab === 'lora'
                  ? 'text-violet-600 dark:text-violet-400 bg-white/50 dark:bg-slate-800/50 border-b-2 border-violet-600 dark:border-violet-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                  }`}
              >
                <Boxes size={18} />
                LoRA
              </button>
            </div>

            {/* 面板内容 */}
            {sidebarTab === 'vocab' ? (
              <VocabPanel
                vocabulary={vocabulary}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                onAddVocab={handleAddVocab}
                setVocabulary={setVocabulary}
              />
            ) : (
              <LoraSidebar
                onAddLora={handleLoraSelect}
                onOpenManager={() => setShowLora(true)}
              />
            )}
          </div>
        </div>

        {/* 右侧主操作区 */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent">
          {/* 顶部标题和设置 */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-white/10 glass sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-gray-700 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
              >
                {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prompt Optimizer</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">多模型 AI 绘画提示词优化工具</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTutorial(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 bg-violet-100/70 dark:bg-violet-900/30 hover:bg-violet-200/70 dark:hover:bg-violet-900/50 rounded-lg transition-colors"
                title="新手教程"
              >
                <BookOpenText size={16} />
                新手教程
              </button>
              <button
                onClick={() => setShowTutorial(true)}
                className="sm:hidden p-2 text-violet-700 dark:text-violet-300 hover:bg-violet-100/60 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                title="新手教程"
              >
                <BookOpenText size={18} />
              </button>
              <button
                onClick={() => setShowFavorites(true)}
                className="p-2 text-yellow-600 hover:bg-yellow-100/50 dark:text-yellow-400 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
                title="我的收藏"
              >
                <Star size={20} />
              </button>
              <button
                onClick={() => setShowTemplates(true)}
                className="p-2 text-gray-700 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                title="提示词模版"
              >
                <LayoutTemplate size={20} />
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 text-gray-700 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                title="历史记录"
              >
                <History size={20} />
              </button>
              <ThemeToggle />
              <SettingsButton
                showSettings={showSettings}
                onToggle={setShowSettings}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            </div>
          </div>

          {/* 主内容区域 */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
              {/* 顶部分栏 */}
              <div className="glass rounded-2xl p-2 border border-white/40 dark:border-white/10 flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('optimize')}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'optimize'
                    ? 'bg-violet-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-slate-800/50'
                    }`}
                >
                  提示词优化
                </button>
                <button
                  onClick={() => setActiveTab('image')}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'image'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-slate-800/50'
                    }`}
                >
                  生图
                </button>
              </div>

              <div className={activeTab === 'optimize' ? 'space-y-6' : 'hidden'}>
              {/* 输入区域 */}
              <div className="glass rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl border border-white/40 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">
                    输入提示词
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowTranslation(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 8l6 6m0 0l6-6m-6 6V3m0 18l6-6m-6 6l-6-6" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      翻译
                    </button>
                    {inputPrompt.trim() && (
                      <button
                        onClick={() => handleFineTune(inputPrompt, 'input')}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        <Sparkles size={14} />
                        微调
                      </button>
                    )}
                    <SortButton onSort={handleSort} disabled={!inputPrompt.trim()} />
                  </div>
                </div>
                <PromptInput
                  value={inputPrompt}
                  onChange={setInputPrompt}
                  placeholder="请输入中文或英文描述，例如：一个白发蓝瞳的女孩，赛博朋克风格..."
                />
              </div>

              {/* 模型选择和生成按钮 */}
              <div className="glass rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl border border-white/40 dark:border-white/10">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  models={supportedModels}
                />

                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !inputPrompt.trim()}
                  className="mt-4 w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? '生成中...' : '生成优化提示词'}
                </button>
              </div>

              {/* 输出区域 */}
              <div className="glass rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl border border-white/40 dark:border-white/10">
                <OutputDisplay
                  positivePrompt={outputPrompt}
                  negativePrompt={negativePrompt}
                  translatedPositive={translatedPositive}
                  translatedNegative={translatedNegative}
                  isLoading={isLoading}
                  isTranslating={isTranslating}
                  onFineTune={(p) => handleFineTune(p, 'output')}
                  onSendToImage={(prompt) => {
                    setImagePrompt(prompt);
                    setActiveTab('image');
                  }}
                />
              </div>
              </div>

              <div className={activeTab === 'image' ? 'space-y-6' : 'hidden'}>
                <ImageGenerationPanel
                  initialPrompt={imagePrompt}
                  negativePrompt={negativePrompt}
                  className="border border-white/40 dark:border-white/10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 翻译面板 */}
      <TranslationPanel
        isOpen={showTranslation}
        onClose={() => setShowTranslation(false)}
      />

      {/* 微调面板 */}
      <FineTunePanel
        isOpen={showFineTune}
        onClose={() => setShowFineTune(false)}
        initialPrompt={fineTunePrompt}
        onApplyFineTune={handleApplyFineTune}
        selectedModel={selectedModel}
      />

      {/* 历史记录面板 */}
      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelect={handleHistorySelect}
        refreshTrigger={historyRefreshTrigger}
      />

      {/* 模版弹窗 */}
      <TemplateModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={handleTemplateSelect}
      />

      {/* 收藏面板 */}
      <FavoritesPanel
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        onSelect={handleFavoriteSelect}
        currentPositive={outputPrompt}
        currentNegative={negativePrompt}
      />

      {/* 新手教程 */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      {/* LoRA 管理 */}
      <LoraManager
        isOpen={showLora}
        onClose={() => setShowLora(false)}
        onSelectLora={handleLoraSelect}
      />
    </div>
  );
}
