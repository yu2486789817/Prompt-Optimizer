'use client';

import { useState, useEffect } from 'react';
import { X, Search, Star, Trash2, Tag, Plus, Edit2, Save } from 'lucide-react';
import { favoritesStorage, FavoriteItem } from '@/lib/favorites';
import { useToast } from '@/components/Toast';

interface FavoritesPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: FavoriteItem) => void;
    currentPositive?: string; // 当前正向提示词
    currentNegative?: string; // 当前负向提示词
}

export default function FavoritesPanel({ isOpen, onClose, onSelect, currentPositive, currentNegative }: FavoritesPanelProps) {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [allTags, setAllTags] = useState<string[]>([]);
    const { addToast } = useToast();

    // 添加模式状态
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [addingName, setAddingName] = useState('');
    const [addingTags, setAddingTags] = useState('');

    // 编辑模式状态
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editTags, setEditTags] = useState('');

    // 加载数据
    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = () => {
        setFavorites(favoritesStorage.getAll());
        setAllTags(favoritesStorage.getTags());
    };

    // 过滤逻辑
    const filteredFavorites = favorites.filter(item => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.positivePrompt.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTag = selectedTag ? item.tags.includes(selectedTag) : true;

        return matchesSearch && matchesTag;
    });

    // 处理添加收藏
    const handleAddFavorite = () => {
        if (!currentPositive) return;

        const tagsArray = addingTags.split(/[,，\s]+/).filter(t => t.trim().length > 0);
        favoritesStorage.add(currentPositive, currentNegative || '', addingName || undefined, tagsArray);

        addToast('已添加到收藏夹', 'success');
        loadFavorites();
        setIsAddingMode(false);
        setAddingName('');
        setAddingTags('');
    };

    if (!isOpen) return null;

    // 处理删除
    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('确定要删除这条收藏吗？')) {
            favoritesStorage.remove(id);
            addToast('已删除收藏', 'success');
            loadFavorites();
        }
    };

    // 处理保存编辑
    const handleSaveEdit = (id: string) => {
        const tagsArray = editTags.split(/[,，\s]+/).filter(t => t.trim().length > 0);
        favoritesStorage.update(id, {
            name: editName,
            tags: tagsArray
        });
        setEditingId(null);
        loadFavorites();
        addToast('收藏已更新', 'success');
    };

    // 开启编辑
    const startEditing = (item: FavoriteItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(item.id);
        setEditName(item.name);
        setEditTags(item.tags.join(', '));
    };

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-2xl border-l border-white/20 dark:border-white/10 z-50 flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">

            {/* 头部 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-current" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">收藏夹</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500"
                >
                    <X size={20} />
                </button>
            </div>

            {/* 搜索和筛选栏 */}
            <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-800">

                {/* 快速添加当前Prompt */}
                {currentPositive && !isAddingMode && (
                    <button
                        onClick={() => setIsAddingMode(true)}
                        className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                        <Plus size={16} />
                        收藏当前提示词
                    </button>
                )}

                {/* 添加模式表单 */}
                {isAddingMode && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 space-y-2 animate-in fade-in slide-in-from-top-2">
                        <input
                            type="text"
                            placeholder="命名 (可选)"
                            value={addingName}
                            onChange={e => setAddingName(e.target.value)}
                            className="w-full text-sm px-3 py-1.5 rounded border border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-800 focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                        <input
                            type="text"
                            placeholder="标签 (用逗号分隔)"
                            value={addingTags}
                            onChange={e => setAddingTags(e.target.value)}
                            className="w-full text-sm px-3 py-1.5 rounded border border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-800 focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                        <div className="flex gap-2 text-xs">
                            <button onClick={handleAddFavorite} className="flex-1 bg-amber-500 text-white py-1 rounded hover:bg-amber-600">确定</button>
                            <button onClick={() => setIsAddingMode(false)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1 rounded hover:bg-gray-300">取消</button>
                        </div>
                    </div>
                )}

                {/* 搜索框 */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="搜索收藏..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white"
                    />
                </div>

                {/* 标签列表 */}
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setSelectedTag(null)}
                            className={`px-2 py-0.5 text-xs rounded-full transition-colors ${selectedTag === null
                                ? 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 font-medium'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            全部
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                className={`px-2 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${selectedTag === tag
                                    ? 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 font-medium'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                <Tag size={10} />
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 列表区域 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {filteredFavorites.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        <Star className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>没有找到相关收藏</p>
                    </div>
                ) : (
                    filteredFavorites.map(item => (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className="group bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 transition-all cursor-pointer relative"
                        >
                            {editingId === item.id ? (
                                // 编辑状态
                                <div onClick={e => e.stopPropagation()} className="space-y-2">
                                    <input
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="w-full text-sm font-medium p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                                        placeholder="名称"
                                    />
                                    <input
                                        value={editTags}
                                        onChange={e => setEditTags(e.target.value)}
                                        className="w-full text-xs p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                                        placeholder="标签"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => handleSaveEdit(item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={14} /></button>
                                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-100 rounded"><X size={14} /></button>
                                    </div>
                                </div>
                            ) : (
                                // 展示状态
                                <>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate pr-6">{item.name}</h3>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3">
                                            <button
                                                onClick={(e) => startEditing(item, e)}
                                                className="p-1 hover:bg-violet-50 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-violet-600"
                                                title="编辑"
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(item.id, e)}
                                                className="p-1 hover:bg-red-50 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-red-500"
                                                title="删除"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 font-mono bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded border border-gray-100 dark:border-gray-800/50">
                                        {item.positivePrompt}
                                    </p>

                                    <div className="flex items-center gap-2 mt-2">
                                        {item.tags.length > 0 && (
                                            <div className="flex gap-1 flex-wrap">
                                                {item.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <span className="text-[10px] text-gray-300 ml-auto">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
