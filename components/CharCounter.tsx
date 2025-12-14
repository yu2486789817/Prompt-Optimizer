'use client';

import { useMemo } from 'react';
import { estimateTokens } from '@/lib/tokenCounter';

interface CharCounterProps {
    text: string;
    maxChars?: number;
    maxTokens?: number;
    className?: string;
}

export default function CharCounter({
    text,
    maxChars,
    maxTokens,
    className = ''
}: CharCounterProps) {
    const charCount = text.length;
    const tokenCount = useMemo(() => estimateTokens(text), [text]);

    const isCharOverLimit = maxChars && charCount > maxChars;
    const isTokenOverLimit = maxTokens && tokenCount > maxTokens;
    const hasWarning = isCharOverLimit || isTokenOverLimit;

    return (
        <div className={`flex items-center gap-3 text-xs ${className}`}>
            {/* 字符计数 */}
            <div className={`flex items-center gap-1 ${isCharOverLimit
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
                <span className="font-medium">
                    {charCount.toLocaleString()}
                    {maxChars && ` / ${maxChars.toLocaleString()}`}
                </span>
                <span className="opacity-75">字符</span>
            </div>

            {/* 分隔线 */}
            <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />

            {/* Token 计数 */}
            <div className={`flex items-center gap-1 ${isTokenOverLimit
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span className="font-medium">
                    ~{tokenCount.toLocaleString()}
                    {maxTokens && ` / ${maxTokens.toLocaleString()}`}
                </span>
                <span className="opacity-75">tokens</span>
            </div>

            {/* 警告提示 */}
            {hasWarning && (
                <>
                    <div className="w-px h-3 bg-red-300 dark:bg-red-600" />
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span className="font-medium">超出限制</span>
                    </div>
                </>
            )}
        </div>
    );
}
