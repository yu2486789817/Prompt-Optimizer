'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit, Save, Search, Upload, FolderOpen, CheckSquare, Square, Folder } from 'lucide-react';
import { loraStorage, LoraItem } from '@/lib/utils';

interface LoraManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLora: (triggerWords: string[]) => void;
}

export default function LoraManager({ isOpen, onClose, onSelectLora }: LoraManagerProps) {
  const [loras, setLoras] = useState<LoraItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    triggerWords: '',
    description: ''
  });
  const [categories, setCategories] = useState<string[]>([]);

  // 批量操作状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [showBatchCategoryModal, setShowBatchCategoryModal] = useState(false);
  const [batchCategory, setBatchCategory] = useState('');

  // 加载分类列表
  useEffect(() => {
    if (isOpen) {
      setCategories(loraStorage.getCategories());
    }
  }, [isOpen]);

  // 加载LoRA列表
  useEffect(() => {
    if (isOpen) {
      loadLoras();
    }
  }, [isOpen]);

  // 关闭时重置批量选择
  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set());
      setIsBatchMode(false);
    }
  }, [isOpen]);

  const loadLoras = () => {
    const allLoras = loraStorage.getAll();
    const filtered = searchQuery ? loraStorage.search(searchQuery) : allLoras;
    // 按分类和名称排序
    const sorted = filtered.sort((a, b) => {
      // 先按分类排序
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }

      // 同一分类内按名称排序
      return a.name.localeCompare(b.name);
    });
    setLoras(sorted);
  };

  useEffect(() => {
    loadLoras();
  }, [searchQuery]);

  // 批量操作函数
  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode);
    if (isBatchMode) {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === loras.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(loras.map(l => l.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) {
      alert('请先选择要删除的 LoRA');
      return;
    }

    if (confirm(`确定要删除选中的 ${selectedIds.size} 个 LoRA 吗？此操作不可恢复。`)) {
      const count = selectedIds.size;
      Array.from(selectedIds).forEach(id => {
        loraStorage.delete(id);
      });
      setSelectedIds(new Set());
      setCategories(loraStorage.getCategories());
      loadLoras();
      alert(`已删除 ${count} 个 LoRA`);
    }
  };

  const handleBatchCategoryChange = () => {
    if (selectedIds.size === 0) {
      alert('请先选择要修改分类的 LoRA');
      return;
    }
    setShowBatchCategoryModal(true);
  };

  const applyBatchCategory = () => {
    if (!batchCategory.trim()) {
      alert('请输入分类名称');
      return;
    }

    const count = selectedIds.size;
    Array.from(selectedIds).forEach(id => {
      loraStorage.update(id, { category: batchCategory.trim() });
    });

    setSelectedIds(new Set());
    setShowBatchCategoryModal(false);
    setBatchCategory('');
    setCategories(loraStorage.getCategories());
    loadLoras();
    alert(`已将 ${count} 个 LoRA 移动到 "${batchCategory}" 分类`);
  };

  const handleAddNew = () => {
    resetForm();
    setIsAddingNew(true);
  };

  const handleEdit = (lora: LoraItem) => {
    setFormData({
      name: lora.name,
      category: lora.category,
      triggerWords: lora.triggerWords.join(', '),
      description: lora.description || ''
    });
    setEditingId(lora.id);
    setIsAddingNew(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.category.trim() || !formData.triggerWords.trim()) {
      alert('请填写LoRA名称、分类和触发词');
      return;
    }

    const triggerWordsArray = formData.triggerWords
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0);

    if (editingId) {
      // 更新现有LoRA
      loraStorage.update(editingId, {
        name: formData.name.trim(),
        category: formData.category.trim(),
        triggerWords: triggerWordsArray,
        description: formData.description.trim()
      });
    } else {
      // 添加新LoRA
      loraStorage.add({
        name: formData.name.trim(),
        category: formData.category.trim(),
        triggerWords: triggerWordsArray,
        description: formData.description.trim()
      });
    }

    resetForm();
    setCategories(loraStorage.getCategories()); // 更新分类列表
    loadLoras();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`确定要删除LoRA "${name}" 吗？`)) {
      loraStorage.delete(id);
      setCategories(loraStorage.getCategories()); // 更新分类列表
      loadLoras();
    }
  };

  const handleSelect = (lora: LoraItem) => {
    onSelectLora(lora.triggerWords);
    onClose();
  };

  // 递归处理文件结构（模拟文件夹结构）
  const processFileStructure = (files: FileList): Omit<LoraItem, 'id' | 'createdAt'>[] => {
    const newLoras: Omit<LoraItem, 'id' | 'createdAt'>[] = [];
    const existingLoras = loraStorage.getAll();

    // 创建一个Map来按文件夹组织文件
    const folderMap = new Map<string, File[]>();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 只处理.safetensors文件
      if (file.name.toLowerCase().endsWith('.safetensors')) {
        // 尝试从文件路径中提取文件夹信息（webkitRelativePath）
        const relativePath = (file as any).webkitRelativePath || file.name;
        const folderName = relativePath.includes('/') ?
          relativePath.split('/')[0] : '未分类';

        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, []);
        }
        folderMap.get(folderName)!.push(file);
      }
    }

    // 处理每个文件夹
    folderMap.forEach((folderFiles, folderName) => {
      folderFiles.forEach(file => {
        // 从文件名中提取LoRA名称（移除.safetensors后缀）
        const baseName = file.name.replace(/\.safetensors$/i, '');

        // 检查是否已存在同名LoRA
        const exists = existingLoras.some(lora => lora.name === baseName && lora.category === folderName);

        if (!exists) {
          // 生成更好的触发词
          const triggerWords = generateTriggerWords(baseName, folderName);

          newLoras.push({
            name: baseName,
            category: folderName,
            triggerWords: triggerWords,
            description: folderName !== '未分类' ?
              `从 ${folderName} 文件夹导入` :
              `从文件导入`
          });
        }
      });
    });

    return newLoras;
  };

  // 生成更好的触发词
  const generateTriggerWords = (fileName: string, folderName: string): string[] => {
    const words: string[] = [];

    // 使用文件名作为主要触发词
    words.push(fileName);

    // 如果有文件夹名，也添加为触发词
    if (folderName !== '根目录') {
      words.push(folderName);
    }

    // 尝试从文件名中提取常见的关键词
    const commonKeywords = ['character', 'pose', 'style', 'concept', 'clothing', 'hair', 'eyes'];
    const lowerFileName = fileName.toLowerCase();

    commonKeywords.forEach(keyword => {
      if (lowerFileName.includes(keyword)) {
        words.push(keyword);
      }
    });

    return [...new Set(words)]; // 去重
  };

  // 批量导入处理函数
  const handleBatchImport = async () => {
    try {
      // 检查是否支持File System Access API
      if ('showDirectoryPicker' in window) {
        // 使用现代API选择文件夹
        await handleDirectoryImport();
      } else {
        // 使用传统文件选择
        await handleFileImport();
      }
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败，请重试');
      setIsImporting(false);
    }
  };

  // 检查LoRA是否需要更新
  const needsUpdate = (existingLora: LoraItem, fileName: string, category: string): boolean => {
    // 检查用户是否手动修改了触发词或描述
    const autoTriggerWords = generateTriggerWords(fileName, category);
    const autoDescription = category !== '未分类' ?
      `从 ${category} 文件夹导入` :
      `从文件导入`;

    // 如果触发词或描述与自动生成的不一致，说明用户可能修改过
    const triggerWordsChanged = !arraysEqual(existingLora.triggerWords, autoTriggerWords);
    const descriptionChanged = existingLora.description !== autoDescription;

    return triggerWordsChanged || descriptionChanged;
  };

  // 比较两个数组是否相等
  const arraysEqual = (a: string[], b: string[]): boolean => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  };

  // 使用File System Access API导入文件夹
  const handleDirectoryImport = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read'
      });

      setIsImporting(true);
      const newLoras: Omit<LoraItem, 'id' | 'createdAt'>[] = [];

      // 递归读取文件夹
      const processEntry = async (entry: any, path = '') => {
        if (entry.kind === 'file' && entry.name.endsWith('.safetensors')) {
          const file = await entry.getFile();
          const baseName = entry.name.replace(/\.safetensors$/i, '');

          const existingLoras = loraStorage.getAll();
          const category = path || '未分类';
          const exists = existingLoras.some(lora => lora.name === baseName && lora.category === category);

          if (!exists) {
            const triggerWords = generateTriggerWords(baseName, category);

            newLoras.push({
              name: baseName,
              category: category,
              triggerWords: triggerWords,
              description: path ? `从 ${path} 文件夹导入` : `从文件导入`
            });
          }
        } else if (entry.kind === 'directory') {
          // 递归处理子文件夹
          for await (const childEntry of entry.values()) {
            await processEntry(childEntry, path ? `${path}/${entry.name}` : entry.name);
          }
        }
      };

      // 处理目录中的所有条目
      for await (const entry of dirHandle.values()) {
        await processEntry(entry);
      }

      if (newLoras.length > 0) {
        for (const lora of newLoras) {
          loraStorage.add(lora);
        }
        loadLoras();
        alert(`成功从文件夹导入 ${newLoras.length} 个LoRA文件！`);
      } else {
        alert('文件夹中没有找到新的.safetensors文件');
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // 用户取消了选择
        return;
      }
      console.error('文件夹导入失败:', error);
      alert('文件夹导入失败，请重试');
    } finally {
      setIsImporting(false);
    }
  };

  // 使用传统文件选择
  const handleFileImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.safetensors';
    input.title = '选择.safetensors文件';

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      setIsImporting(true);

      try {
        const newLoras = processFileStructure(files);

        if (newLoras.length > 0) {
          for (const lora of newLoras) {
            loraStorage.add(lora);
          }
          loadLoras();
          alert(`成功导入 ${newLoras.length} 个LoRA文件！`);
        } else {
          alert('没有找到新的.safetensors文件');
        }
      } catch (error) {
        console.error('文件导入失败:', error);
        alert('导入失败，请重试');
      } finally {
        setIsImporting(false);
      }
    };

    input.click();
  };

  // 按分类分组LoRA
  const groupLorasByCategory = (loras: LoraItem[]) => {
    const groups: { [category: string]: LoraItem[] } = {};

    loras.forEach(lora => {
      const category = lora.category || '未分类';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(lora);
    });

    return groups;
  };

  // 重置表单时也重置导入状态
  const resetForm = () => {
    setFormData({ name: '', category: '', triggerWords: '', description: '' });
    setIsAddingNew(false);
    setIsImporting(false);
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">LoRA 管理</h2>
            {loras.length > 0 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                {loras.length} 个
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* 批量模式切换按钮 */}
            {loras.length > 0 && (
              <button
                onClick={toggleBatchMode}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${isBatchMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                title={isBatchMode ? '退出批量模式' : '批量管理'}
              >
                {isBatchMode ? <CheckSquare size={16} /> : <Square size={16} />}
                {isBatchMode ? '退出批量' : '批量管理'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 批量操作工具栏 */}
        {isBatchMode && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                >
                  {selectedIds.size === loras.length ? (
                    <>
                      <CheckSquare size={16} />
                      取消全选
                    </>
                  ) : (
                    <>
                      <Square size={16} />
                      全选 ({loras.length})
                    </>
                  )}
                </button>
                {selectedIds.size > 0 && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    已选择 <strong className="text-blue-600 dark:text-blue-400">{selectedIds.size}</strong> 个
                  </span>
                )}
              </div>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBatchCategoryChange}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
                  >
                    <Folder size={14} />
                    修改分类
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                    批量删除
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 搜索和添加栏 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索LoRA名称、触发词或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              添加LoRA
            </button>
          </div>

          {/* 批量导入区域 */}
          <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FolderOpen size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">批量导入LoRA文件</p>
                  <p className="text-xs text-gray-600 mt-1">智能识别.safetensors文件并自动创建LoRA条目</p>
                </div>
              </div>
              <button
                onClick={handleBatchImport}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
              >
                <Upload size={16} />
                {isImporting ? '导入中...' : '开始导入'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-700">支持的浏览器</p>
                  <p className="text-gray-500">Chrome/Edge支持文件夹选择，其他浏览器支持文件选择</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-700">智能命名</p>
                  <p className="text-gray-500">自动提取文件名和文件夹结构作为触发词</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-700">递归扫描</p>
                  <p className="text-gray-500">自动遍历所有子文件夹查找.safetensors文件</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-700">去重保护</p>
                  <p className="text-gray-500">自动跳过已存在的同名LoRA避免重复</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 主体内容 */}
        <div className="flex-1 overflow-auto p-4">
          {isAddingNew ? (
            // 添加/编辑表单
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">
                {editingId ? '编辑LoRA' : '添加新LoRA'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LoRA名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：人物姿势增强"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    分类 *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="例如：角色、风格、姿势、概念等"
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {categories.length > 0 && (
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">选择现有分类</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">支持自定义新分类或选择已有分类</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    触发词 *（用逗号分隔）
                  </label>
                  <textarea
                    value={formData.triggerWords}
                    onChange={(e) => setFormData(prev => ({ ...prev, triggerWords: e.target.value }))}
                    placeholder="例如：poseA, action standing, dynamic pose"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述（可选）
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="描述这个LoRA的作用和效果..."
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save size={18} />
                    保存
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // LoRA列表
            <div className="space-y-6">
              {loras.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">暂无LoRA</p>
                  <p className="text-sm">点击"添加LoRA"或使用批量导入功能开始管理你的LoRA触发词</p>
                </div>
              ) : (
                Object.entries(groupLorasByCategory(loras)).map(([categoryName, categoryLoras]) => (
                  <div key={categoryName}>
                    {/* 分类标题 */}
                    <div className="flex items-center gap-2 mb-3">
                      <FolderOpen size={18} className="text-orange-600" />
                      <h3 className="font-semibold text-gray-900 text-base">
                        {categoryName}
                      </h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {categoryLoras.length} 个LoRA
                      </span>
                    </div>

                    {/* 该分类下的LoRA列表 */}
                    <div className="space-y-2 ml-6">
                      {categoryLoras.map((lora) => (
                        <div
                          key={lora.id}
                          className={`bg-white dark:bg-gray-800 border rounded-lg p-4 transition-all ${isBatchMode && selectedIds.has(lora.id)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                              : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* 批量模式复选框 */}
                            {isBatchMode && (
                              <div className="pt-1">
                                <button
                                  onClick={() => toggleSelect(lora.id)}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                  {selectedIds.has(lora.id) ? (
                                    <CheckSquare size={20} className="text-blue-600" />
                                  ) : (
                                    <Square size={20} className="text-gray-400" />
                                  )}
                                </button>
                              </div>
                            )}

                            <div className="flex-1">
                              <h4 className="font-medium text-base mb-1 text-gray-900 dark:text-white">
                                {lora.name}
                              </h4>
                              {lora.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{lora.description}</p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {lora.triggerWords.map((word, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm rounded-full"
                                  >
                                    {word}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* 批量模式时隐藏操作按钮 */}
                            {!isBatchMode && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSelect(lora)}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  使用
                                </button>
                                <button
                                  onClick={() => handleEdit(lora)}
                                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                  title="编辑"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(lora.id, lora.name)}
                                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                  title="删除"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 批量修改分类模态框 */}
      {showBatchCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              批量修改分类
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              将选中的 {selectedIds.size} 个 LoRA 移动到指定分类
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                新分类名称
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  placeholder="输入分类名称"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && applyBatchCategory()}
                />
                {categories.length > 0 && (
                  <select
                    value={batchCategory}
                    onChange={(e) => setBatchCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择现有</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={applyBatchCategory}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                确定
              </button>
              <button
                onClick={() => {
                  setShowBatchCategoryModal(false);
                  setBatchCategory('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}