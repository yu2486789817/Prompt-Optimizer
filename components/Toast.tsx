'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now().toString() + Math.random().toString().slice(2, 5);
        setToasts((prev) => [...prev, { id, message, type }]);

        // 自动移除
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md transform transition-all duration-300 animate-in slide-in-from-right
              ${toast.type === 'success' ? 'bg-green-50/90 dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-100' : ''}
              ${toast.type === 'error' ? 'bg-red-50/90 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-100' : ''}
              ${toast.type === 'warning' ? 'bg-amber-50/90 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-100' : ''}
              ${toast.type === 'info' ? 'bg-blue-50/90 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-100' : ''}
            `}
                    >
                        {/* 图标 */}
                        <div className="flex-shrink-0">
                            {toast.type === 'success' && <CheckCircle size={18} />}
                            {toast.type === 'error' && <AlertCircle size={18} />}
                            {toast.type === 'warning' && <AlertTriangle size={18} />}
                            {toast.type === 'info' && <Info size={18} />}
                        </div>

                        {/* 消息 */}
                        <p className="text-sm font-medium">{toast.message}</p>

                        {/* 关闭按钮 */}
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 hover:opacity-70 transition-opacity"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
