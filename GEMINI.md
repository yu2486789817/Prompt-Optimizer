# Prompt Optimizer (多模型 AI 绘画提示词优化工具)

## 项目概览

**Prompt Optimizer** 是一个基于 Web 的工具，旨在帮助用户生成和优化用于 AI 绘画模型（如 Stable Diffusion、MidJourney 和 Flux）的结构化英文提示词。它通过提供智能提示词生成、特定词汇管理和自动提示词整理功能，解决了“写不出好提示词”的痛点。

**核心功能：**
*   **智能提示词生成：** 基于用户描述，利用多种大语言模型（Gemini, Grok, Claude, DeepSeek, Qwen）生成高质量的英文提示词。
*   **自定义词汇面板：** 快速访问常用标签，支持用户自定义（保存于 `localStorage`）。
*   **提示词整理：** 自动执行去重、质量标签插入、权重语法调整和逻辑排序。
*   **翻译：** 集成翻译功能（中英互译）。
*   **微调：** 支持对生成的提示词进行微调。

## 技术栈

*   **框架：** Next.js 14 (App Router)
*   **语言：** TypeScript
*   **样式：** Tailwind CSS
*   **状态管理：** React Hooks
*   **存储：** `localStorage` (用于存储用户词汇表和 API 密钥)
*   **图标：** Lucide React

## 目录结构

*   `app/`: 主要应用路由和 API 端点。
    *   `app/page.tsx`: 主要入口点和 UI 布局。
    *   `app/api/proxy/route.ts`: LLM API 请求的代理。
    *   `app/api/translate/route.ts`: 翻译 API 端点。
*   `components/`: 可复用的 UI 组件（例如 `PromptInput`, `ModelSelector`, `VocabPanel`, `OutputDisplay`）。
*   `lib/`: 工具函数、类型定义和常量。
    *   `lib/vocab.ts`: 默认词汇定义。
    *   `lib/utils.ts`: 通用工具和提示词优化逻辑。
    *   `lib/translation.ts`: 翻译服务接口和辅助函数。
*   `public/`: 静态资源。

## 构建与运行

本项目使用 `npm` 进行依赖管理和脚本执行。

### 前置要求
*   Node.js (推荐 LTS 版本)
*   npm

### 常用命令

*   **安装依赖：**
    ```bash
    npm install
    ```

*   **启动开发服务器：**
    ```bash
    npm run dev
    # 或者使用特定的代理设置（如 package.json 中所定义）：
    npm run dev:no-proxy
    ```
    应用将在 `http://localhost:3000` 访问。

*   **构建生产版本：**
    ```bash
    npm run build
    ```

*   **启动生产服务器：**
    ```bash
    npm run start
    ```

*   **代码检查 (Linting)：**
    ```bash
    npm run lint
    ```

## 开发规范

*   **API 密钥：** 各种模型的 API 密钥存储在用户的浏览器 `localStorage` 中，不会保存到服务器上。
*   **代理：** 开发环境配置为使用本地代理（在 `package.json` 脚本中定义）来处理可能被阻止的 API 请求。
*   **样式：** 使用 Tailwind CSS 工具类来为组件设置样式。
*   **组件：** 在 `components/` 目录中创建小巧、可复用的组件。