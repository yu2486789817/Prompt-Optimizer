'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Boxes, Plus, Search, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { loraStorage, LoraItem } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface LoraSidebarProps {
    onAddLora: (triggerWords: string[]) => void;
    onOpenManager: () => void;
}

export default function LoraSidebar({ onAddLora, onOpenManager }: LoraSidebarProps) {
    const [loras, setLoras] = useState<LoraItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    // 使用防抖优化搜索
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // 加载LoRA列表
    useEffect(() => {
        loadLoras();

        // 监听LoRA更新事件
        const handleLoraUpdate = () => {
            loadLoras();
        };

        window.addEventListener('loraUpdated', handleLoraUpdate);
        return () => window.removeEventListener('loraUpdated', handleLoraUpdate);
    }, []);

    const loadLoras = () => {
        const allLoras = loraStorage.getAll();
        setLoras(allLoras);
    };

    // 使用 useMemo 优化过滤和分组
    const filteredLoras = useMemo(() => {
        if (!debouncedSearchQuery) return loras;

        const query = debouncedSearchQuery.toLowerCase();
        return loras.filter(lora =>
            lora.name.toLowerCase().includes(query) ||
            lora.triggerWords.some(word => word.toLowerCase().includes(query)) ||
            (lora.description && lora.description.toLowerCase().includes(query))
        );
    }, [loras, debouncedSearchQuery]);

    // 按分类分组
    const groupedLoras = filteredLoras.reduce((acc, lora) => {
        const category = lora.category || '未分类';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(lora);
        return acc;
    }, {} as Record<string, LoraItem[]>);

    // 切换分类折叠状态
    const toggleCategory = (category: string) => {
        setCollapsedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    // 处理LoRA点击
    const handleLoraClick = (lora: LoraItem) => {
        onAddLora(lora.triggerWords);
    };

    return (
        <div className="h-full flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-r border-white/20 dark:border-white/10">
            {/* 头部 */}
            <div className="p-4 border-b border-white/20 dark:border-white/10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Boxes size={20} className="text-violet-600 dark:text-violet-400" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">LoRA 快捷</h3>
                    </div>
                    <button
                        onClick={onOpenManager}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                        title="LoRA 管理"
                    >
                        <Settings size={16} />
                    </button>
                </div>

                {/* 搜索框 */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="搜索 LoRA..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
            </div>

            {/* LoRA列表 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                {Object.keys(groupedLoras).length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <Boxes size={32} className="mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {searchQuery ? '未找到匹配的 LoRA' : '暂无 LoRA'}
                        </p>
                        <button
                            onClick={onOpenManager}
                            className="flex items-center gap-2 mx-auto px-3 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                        >
                            <Plus size={16} />
                            添加 LoRA
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(groupedLoras)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([category, categoryLoras]) => {
                                const isCollapsed = collapsedCategories.has(category);

                                return (
                                    <div key={category} className="space-y-1">
                                        {/* 分类标题 */}
                                        <button
                                            onClick={() => toggleCategory(category)}
                                            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {isCollapsed ? (
                                                    <ChevronRight size={14} className="text-gray-400" />
                                                ) : (
                                                    <ChevronDown size={14} className="text-gray-400" />
                                                )}
                                                <span>{category}</span>
                                                <span className="text-gray-400 dark:text-gray-500">
                                                    ({categoryLoras.length})
                                                </span>
                                            </div>
                                        </button>

                                        {/* LoRA列表 */}
                                        {!isCollapsed && (
                                            <div className="pl-3 space-y-1">
                                                {categoryLoras.map((lora) => (
                                                    <button
                                                        key={lora.id}
                                                        onClick={() => handleLoraClick(lora)}
                                                        className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 group"
                                                        title={lora.description || lora.triggerWords.join(', ')}
                                                    >
                                                        <div className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                                                            {lora.name}
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {lora.triggerWords.slice(0, 3).map((word, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="px-1.5 py-0.5 text-xs bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded"
                                                                >
                                                                    {word}
                                                                </span>
                                                            ))}
                                                            {lora.triggerWords.length > 3 && (
                                                                <span className="px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                                    +{lora.triggerWords.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* 底部操作 */}
            <div className="p-3 border-t border-white/20 dark:border-white/10">
                <button
                    onClick={onOpenManager}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                    <Settings size={16} />
                    管理 LoRA
                </button>
            </div>
        </div>
    );
}
