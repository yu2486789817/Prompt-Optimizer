'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Upload, Trash2, Languages } from 'lucide-react';
import { VocabItem, storage } from '@/lib/utils';

interface AddVocabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVocab: (vocab: VocabItem[]) => void;
  categories: string[];
}

export default function AddVocabModal({ isOpen, onClose, onAddVocab, categories }: AddVocabModalProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [singleVocab, setSingleVocab] = useState({ english: '', chinese: '', category: '自定义' });
  const [batchInput, setBatchInput] = useState('');
  const [batchCategory, setBatchCategory] = useState('自定义');
  const [isTranslating, setIsTranslating] = useState(false);

  // 实时翻译中文输入
  const handleChineseInput = async (chineseText: string) => {
    setSingleVocab(prev => ({ ...prev, chinese: chineseText }));

    if (chineseText.trim() && detectLanguage(chineseText.trim()) === 'zh') {
      setIsTranslating(true);
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chineseText,
            from: 'zh',
            to: 'en',
            service: 'proxy'
          })
        });

        const data = await response.json();
        if (data.success && data.translatedText) {
          setSingleVocab(prev => ({ ...prev, english: data.translatedText }));
        }
      } catch (error) {
        console.error('翻译失败:', error);
      } finally {
        setIsTranslating(false);
      }
    }
  };

  // 语言检测
  const detectLanguage = (text: string): 'zh' | 'en' | 'unknown' => {
    const cleanText = text.trim();
    if (!cleanText) return 'unknown';

    const chineseRegex = /[\u4e00-\u9fff]/;
    const englishRegex = /^[a-zA-Z\s\d\W]+$/;

    if (chineseRegex.test(cleanText)) return 'zh';
    if (englishRegex.test(cleanText)) return 'en';
    return 'unknown';
  };

  // 添加单个词汇
  const handleAddSingle = () => {
    const { english, chinese, category } = singleVocab;
    if (english.trim() && chinese.trim()) {
      const newVocab: VocabItem = {
        english: english.trim(),
        chinese: chinese.trim(),
        category: category.trim()
      };
      onAddVocab([newVocab]);
      setSingleVocab({ english: '', chinese: '', category: '自定义' });
    }
  };

  // 批量导入
  const handleBatchImport = () => {
    if (!batchInput.trim()) return;

    const lines = batchInput.trim().split('\n');
    const newVocabs: VocabItem[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // 支持多种格式：
      // 1. english,chinese,category
      // 2. english,chinese
      // 3. chinese (自动翻译)
      const parts = trimmed.split(/[,，]/).map(p => p.trim());

      if (parts.length >= 2 && parts[0] && parts[1]) {
        newVocabs.push({
          english: parts[0],
          chinese: parts[1],
          category: parts[2] || batchCategory
        });
      } else if (parts.length === 1 && parts[0]) {
        // 单个中文，自动翻译
        const text = parts[0];
        const lang = detectLanguage(text);

        if (lang === 'zh') {
          // 这里应该调用翻译API，但为了简单起见，先作为中文处理
          newVocabs.push({
            english: `[待翻译] ${text}`,
            chinese: text,
            category: batchCategory
          });
        } else {
          newVocabs.push({
            english: text,
            chinese: `[待翻译] ${text}`,
            category: batchCategory
          });
        }
      }
    });

    if (newVocabs.length > 0) {
      onAddVocab(newVocabs);
      setBatchInput('');
    }
  };

  // 处理回车键
  const handleSingleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddSingle();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">添加新词汇</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'single'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Plus size={16} className="inline mr-2" />
            单个添加
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'batch'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Upload size={16} className="inline mr-2" />
            批量导入
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'single' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    中文 (支持自动翻译)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={singleVocab.chinese}
                      onChange={(e) => handleChineseInput(e.target.value)}
                      onKeyPress={handleSingleKeyPress}
                      placeholder="输入中文，自动翻译成英文..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {isTranslating && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">英文</label>
                  <input
                    type="text"
                    value={singleVocab.english}
                    onChange={(e) => setSingleVocab(prev => ({ ...prev, english: e.target.value }))}
                    onKeyPress={handleSingleKeyPress}
                    placeholder="英文翻译..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                <div className="flex gap-2">
                  <select
                    value={singleVocab.category}
                    onChange={(e) => setSingleVocab(prev => ({ ...prev, category: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddSingle}
                    disabled={!singleVocab.english.trim() || !singleVocab.chinese.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    添加
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  批量输入格式
                </label>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-3">
                  支持格式：<br />
                  • english,chinese,category<br />
                  • english,chinese<br />
                  • chinese (自动翻译)<br />
                  每行一个词汇
                </div>
                <textarea
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  placeholder="例如：&#10;girl,女孩,人物&#10;anime,动漫,风格&#10;美丽的风景"
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">默认分类</label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleBatchImport}
                disabled={!batchInput.trim()}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                批量导入
              </button>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}