'use client';

import { useState, useEffect } from 'react';
import { X, Search, Sparkles, Plus, Trash2, LayoutTemplate, Save } from 'lucide-react';
import { defaultTemplates, templateCategories, TemplateItem, customTemplatesStorage } from '@/lib/templates';
import { useToast } from '@/components/Toast';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: TemplateItem) => void;
}

export default function TemplateModal({ isOpen, onClose, onSelect }: TemplateModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const { addToast } = useToast();

  // 添加新模版的状态
  const [isAdding, setIsAdding] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', template: '', category: '自定义', description: '' });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    setTemplates(customTemplatesStorage.getAllTemplates());
  };

  const filteredTemplates = templates
    .filter(t => selectedCategory === '全部' || t.category === selectedCategory)
    .filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.template) {
      addToast('请填写模版名称和内容', 'warning');
      return;
    }
    // 确保包含占位符
    if (!newTemplate.template.includes('{{prompt}}')) {
      addToast('模版内容必须包含 {{prompt}} 占位符', 'warning');
      return;
    }

    customTemplatesStorage.add(newTemplate);
    addToast('自定义模版已创建', 'success');
    loadTemplates();
    setIsAdding(false);
    setNewTemplate({ name: '', template: '', category: '自定义', description: '' });
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个自定义模版吗？')) {
      customTemplatesStorage.delete(id);
      addToast('模版已删除', 'success');
      loadTemplates();
    }
  };

  // 不显示时返回 null
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] border border-white/20 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >

        {/* 标题栏 */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              选择模版
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* 顶部工具栏 */}
        <div className="pb-2 pt-4 px-4 space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索模版..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-violet-500 text-sm"
            />
          </div>

          {/* 分类按钮 */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {templateCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === cat
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 只有在"自定义"或"全部"分类下显示添加按钮 */}
          {(selectedCategory === '全部' || selectedCategory === '自定义') && !isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 text-sm hover:border-violet-500 hover:text-violet-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              创建自定义模版
            </button>
          )}

          {/* 添加模版表单 */}
          {isAdding && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-violet-100 dark:border-violet-900/30 space-y-3 animate-in slide-in-from-top-2">
              <div className="flex gap-2">
                <input
                  placeholder="模版名称"
                  value={newTemplate.name}
                  onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
                <input
                  placeholder="描述 (可选)"
                  value={newTemplate.description}
                  onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
              <textarea
                placeholder="模版内容，请使用 {{prompt}} 表示输入的提示词位置"
                value={newTemplate.template}
                onChange={e => setNewTemplate({ ...newTemplate, template: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-20 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCreateTemplate}
                  className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs hover:bg-violet-700 flex items-center gap-1"
                >
                  <Save size={12} /> 保存
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 模版列表 */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 custom-scrollbar">
          {filteredTemplates.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="group relative flex flex-col p-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {item.name}
                  {item.isCustom && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 rounded-full">
                      自定义
                    </span>
                  )}
                </h3>
                <Sparkles className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors" />

                {/* 删除按钮 */}
                {item.isCustom && (
                  <button
                    onClick={(e) => handleDeleteTemplate(item.id, e)}
                    className="absolute top-3 right-3 p-1.5 bg-white dark:bg-gray-800 rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    title="删除模版"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                {item.description}
              </p>

              <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700/50">
                <code className="text-[10px] text-gray-400 dark:text-gray-500 font-mono bg-white dark:bg-gray-800 px-1 py-0.5 rounded block truncate">
                  {item.template}
                </code>
              </div>
            </div>
          ))}
          {filteredTemplates.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-400">
              未找到匹配的模版
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
