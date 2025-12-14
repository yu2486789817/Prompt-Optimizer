'use client';

import { X, Clock, Trash2, RotateCcw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { HistoryItem, historyStorage } from '@/lib/history';
import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
  refreshTrigger: number; // Used to trigger refresh from parent
}

const ITEMS_PER_PAGE = 10;

export default function HistoryPanel({ isOpen, onClose, onSelect, refreshTrigger }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 使用防抖优化搜索
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, refreshTrigger]);

  // 搜索时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const loadHistory = () => {
    setHistory(historyStorage.getAll());
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这条记录吗？')) {
      historyStorage.delete(id);
      loadHistory();
    }
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
      historyStorage.clear();
      loadHistory();
      setCurrentPage(1);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 使用 useMemo 优化过滤和分页
  const { filteredHistory, totalPages, paginatedHistory } = useMemo(() => {
    const filtered = history.filter(item => {
      if (!debouncedSearchTerm) return true;
      const term = debouncedSearchTerm.toLowerCase();
      return item.inputPrompt.toLowerCase().includes(term) ||
        item.positivePrompt.toLowerCase().includes(term);
    });

    const total = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return {
      filteredHistory: filtered,
      totalPages: total,
      paginatedHistory: paginated
    };
  }, [history, debouncedSearchTerm, currentPage]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Clock className="text-blue-600 dark:text-blue-400" size={20} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">历史记录</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {filteredHistory.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg transition-colors"
              title="清空历史"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="搜索历史记录..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {paginatedHistory.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <p>{searchTerm ? '未找到匹配的记录' : '暂无历史记录'}</p>
          </div>
        ) : (
          paginatedHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md cursor-pointer transition-all hover:border-blue-300 dark:hover:border-blue-700"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {item.modelId}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(item.timestamp)}
                </span>
              </div>

              <div className="mb-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {item.inputPrompt}
                </p>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                {item.positivePrompt}
              </div>

              <button
                onClick={(e) => handleDelete(e, item.id)}
                className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200 dark:border-gray-700"
                title="删除"
              >
                <Trash2 size={14} />
              </button>

              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                  <RotateCcw size={12} />
                  恢复
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              上一页
            </button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}