'use client';

import './globals.css';
import { ToastProvider } from '@/components/Toast';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-CN" suppressHydrationWarning>
            <head>
                <title>Prompt Optimizer - AI 绘画提示词优化工具</title>
                <meta name="description" content="多模型 AI 绘画提示词优化工具，支持 Gemini、Grok、Claude、DeepSeek、Qwen 等模型" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body className="antialiased">
                <ToastProvider>
                    {children}
                </ToastProvider>
            </body>
        </html>
    );
}
