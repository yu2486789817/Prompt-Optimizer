'use client';

import { useState, useMemo } from 'react';
import { Plus, X, Edit2, Save, Search, Tag, Sparkles } from 'lucide-react';
import { VocabItem, vocabularyCategories } from '@/lib/vocab';
import { storage } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { useDebounce } from '@/hooks/useDebounce';

interface VocabPanelProps {
  vocabulary: VocabItem[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onAddVocab: (english: string) => void;
  setVocabulary: (vocab: VocabItem[]) => void;
}

export default function VocabPanel({
  vocabulary,
  selectedCategory,
  onCategoryChange,
  onAddVocab,
  setVocabulary
}: VocabPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVocab, setNewVocab] = useState({ chinese: '', english: '', category: '风格' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVocab, setEditVocab] = useState({ chinese: '', english: '', category: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  // 使用防抖优化搜索
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 使用 useMemo 优化过滤
  const filteredVocabulary = useMemo(() => {
    return vocabulary
      .filter(item => selectedCategory === '全部' || item.category === selectedCategory)
      .filter(item => {
        if (!debouncedSearchTerm) return true;
        const term = debouncedSearchTerm.toLowerCase();
        return item.chinese.toLowerCase().includes(term) ||
          item.english.toLowerCase().includes(term);
      });
  }, [vocabulary, selectedCategory, debouncedSearchTerm]);

  // 添加新词汇
  const handleAdd = () => {
    if (newVocab.chinese.trim() && newVocab.english.trim()) {
      const newItem: VocabItem = {
        id: Date.now().toString(),
        ...newVocab
      };
      setVocabulary([...vocabulary, newItem]);
      storage.setJSON('customVocabulary', [...vocabulary, newItem]);
      setNewVocab({ chinese: '', english: '', category: '风格' });
      setShowAddForm(false);
      addToast('词汇添加成功', 'success');
    } else {
      addToast('请填写完整的中文和英文词汇', 'warning');
    }
  };

  // 删除词汇
  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个词汇吗？')) {
      const updated = vocabulary.filter(item => item.id !== id);
      setVocabulary(updated);
      storage.setJSON('customVocabulary', updated);
      addToast('词汇已删除', 'success');
    }
  };

  // 开始编辑
  const handleEdit = (item: VocabItem) => {
    setEditingId(item.id);
    setEditVocab({ chinese: item.chinese, english: item.english, category: item.category });
  };

  // 保存编辑
  const handleSave = (id: string) => {
    if (editVocab.chinese.trim() && editVocab.english.trim()) {
      const updated = vocabulary.map(item =>
        item.id === id ? { ...item, ...editVocab } : item
      );
      setVocabulary(updated);
      storage.setJSON('customVocabulary', updated);
      setEditingId(null);
      addToast('词汇更新成功', 'success');
    } else {
      addToast('请填写完整的中文和英文词汇', 'warning');
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setEditingId(null);
    setEditVocab({ chinese: '', english: '', category: '' });
  };

  // 双击添加词汇
  const handleDoubleClick = (english: string) => {
    onAddVocab(english);
    addToast(`已添加: ${english}`, 'success');
  };

  return (
    <div className="h-full flex flex-col bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-r border-white/20 dark:border-white/10">
      {/* 头部 */}
      <div className="p-4 border-b border-white/20 dark:border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">快捷词汇</h2>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>

        {/* 搜索框 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索词汇..."
            className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-gray-700/50 border border-white/20 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {/* 分类选择 */}
        <div className="flex flex-wrap gap-1 mb-3">
          {vocabularyCategories.map(category => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${selectedCategory === category
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 添加按钮 */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full py-2 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Plus size={16} />
          添加新词汇
        </button>
      </div>

      {/* 添加表单 */}
      {showAddForm && (
        <div className="p-4 bg-gradient-to-br from-violet-50/50 to-indigo-50/50 dark:from-violet-900/20 dark:to-indigo-900/20 border-b border-white/20 dark:border-white/10">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="中文"
              value={newVocab.chinese}
              onChange={(e) => setNewVocab({ ...newVocab, chinese: e.target.value })}
              className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 border border-white/20 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="英文"
              value={newVocab.english}
              onChange={(e) => setNewVocab({ ...newVocab, english: e.target.value })}
              className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 border border-white/20 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
            />
            <select
              value={newVocab.category}
              onChange={(e) => setNewVocab({ ...newVocab, category: e.target.value })}
              className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 border border-white/20 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 dark:text-white"
            >
              {vocabularyCategories.filter(cat => cat !== '全部').map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewVocab({ chinese: '', english: '', category: '风格' });
                }}
                className="flex-1 py-2 px-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 词汇列表 */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {filteredVocabulary.length === 0 ? (
          <div className="text-center py-8">
            <Tag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? '没有找到匹配的词汇' : '该分类下暂无词汇'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredVocabulary.map(item => (
              <div
                key={item.id}
                className="group relative bg-white/50 dark:bg-gray-700/50 rounded-lg p-3 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-200 border border-white/20 dark:border-white/10 hover:border-violet-200 dark:hover:border-violet-800 cursor-pointer"
                onDoubleClick={() => handleDoubleClick(item.english)}
                title="双击添加到输入框"
              >
                {editingId === item.id ? (
                  // 编辑模式
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editVocab.chinese}
                      onChange={(e) => setEditVocab({ ...editVocab, chinese: e.target.value })}
                      className="w-full px-2 py-1 bg-white dark:bg-gray-600 border border-violet-200 dark:border-violet-800 rounded text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={editVocab.english}
                      onChange={(e) => setEditVocab({ ...editVocab, english: e.target.value })}
                      className="w-full px-2 py-1 bg-white dark:bg-gray-600 border border-violet-200 dark:border-violet-800 rounded text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 text-gray-900 dark:text-white"
                    />
                    <select
                      value={editVocab.category}
                      onChange={(e) => setEditVocab({ ...editVocab, category: e.target.value })}
                      className="w-full px-2 py-1 bg-white dark:bg-gray-600 border border-violet-200 dark:border-violet-800 rounded text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 text-gray-900 dark:text-white"
                    >
                      {vocabularyCategories.filter(cat => cat !== '全部').map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSave(item.id)}
                        className="flex-1 py-1 px-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded text-xs hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-1"
                      >
                        <Save size={10} />
                        保存
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 py-1 px-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  // 显示模式
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                      {item.chinese}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 text-xs mb-1">
                      {item.english}
                    </div>
                    <div className="text-gray-500 dark:text-gray-500 text-xs">
                      {item.category}
                    </div>

                    {/* 操作按钮 */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        className="p-1.5 bg-white dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors shadow-sm"
                        title="编辑"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="p-1.5 bg-white dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                        title="删除"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="p-3 border-t border-white/20 dark:border-white/10">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          共 {filteredVocabulary.length} 个词汇
          {searchTerm && ` (搜索: ${searchTerm})`}
        </div>
      </div>
    </div>
  );
}