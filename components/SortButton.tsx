'use client';

import { ArrowUpDown } from 'lucide-react';

interface SortButtonProps {
  onSort: () => void;
  disabled: boolean;
}

export default function SortButton({ onSort, disabled }: SortButtonProps) {
  return (
    <button
      onClick={onSort}
      disabled={disabled}
      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      <ArrowUpDown size={14} />
      整理提示词
    </button>
  );
}