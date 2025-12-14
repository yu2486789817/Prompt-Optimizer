# 多模型 AI 绘画提示词优化工具 - 项目计划书（正式版）

**项目名称**：Prompt Optimizer（多模型提示词优化器）  
**版本**：v1.0（MVP）  
**目标**：构建一个极简、高效、可扩展的网页工具，帮助用户快速生成和优化 AI 绘画（Stable Diffusion、MidJourney、Flux 等）所需的结构化英文提示词。  
**核心定位**：不造轮子、不堆功能、只解决“写不出好提示词”这一件事。

## 一、核心功能（仅保留三项，全部必须实现）

1. **智能提示词生成**  
   - 用户在主输入框输入中文或英文描述  
   - 选择目标模型（下拉菜单）  
   - 点击“生成”按钮 → 调用对应大模型 API → 返回优化后的完整英文提示词（含主提示词 + 负面提示词）  
   - 输出结果直接展示在只读文本框，支持一键复制

2. **自定义快捷词汇面板**  
   - 左侧固定面板，显示可点击的词汇标签（默认预置 30 个高频条目，如“灰毛”“赛博朋克”“8K”“超详细”“动态模糊”等）  
   - 点击标签后自动在主输入框末尾追加对应英文描述（逗号分隔）  
   - 支持用户自行增删、修改标签，所有数据使用 localStorage 持久化保存

3. **提示词一键整理**  
   - 用户将任意长度的提示词粘贴至输入框  
   - 点击“整理”按钮 → 前端自动完成：  
     - 去除重复词  
     - 质量修饰词前置（如 masterpiece, best quality 等）  
     - 合理添加权重语法 (( ))、[ ] 或 1.2::  
     - 按逻辑顺序重新排列（主体 → 细节 → 风格 → 质量 → 光影）  
   - 整理结果覆盖原输入框或输出至下方区域

## 二、支持的模型（可先实现gemini）

| 模型名称           | API 提供方 | 模型标识符                 | 备注         |
| ------------------ | ---------- | -------------------------- | ------------ |
| Grok-4 / Grok-3    | xAI        | grok-beta                  | 默认推荐     |
| Gemini 2.5         | Google     | gemini-1.5-pro             |              |
| Claude 3.5 Sonnet  | Anthropic  | claude-3-5-sonnet-20241022 |              |
| DeepSeek-V3 / Chat | DeepSeek   | deepseek-chat              | 高性价比     |
| Qwen-Max / Plus    | Alibaba    | qwen-max                   | 中文理解优秀 |

后续可通过配置文件扩展。

## 三、技术架构

- **前端框架**：Next.js 14（App Router）  
- **UI 组件**：Tailwind CSS + shadcn/ui（或原生实现）  
- **状态管理**：React hooks + Zustand（轻量）或仅 useState  
- **本地存储**：localStorage（保存用户自定义词汇与各模型 API Key）  
- **后端**：Vercel Serverless Function（/api/proxy）统一代理所有模型请求  
  - 目的：保护用户 API Key（建议后端代理方式），统一错误处理与返回格式  
  - 若用户担心代理，可提供“直连模式”开关（前端直接调用官方 API）  
- **部署平台**：Vercel（免费、一键部署、自动 HTTPS）

## 四、目录结构（建议）

```
app/
  ├─ page.tsx              # 主页面
  ├─ layout.tsx
  └─ api/
      └─ proxy/
          └─ route.ts      # 统一代理接口
components/
  ├─ PromptInput.tsx
  ├─ ModelSelector.tsx
  ├─ VocabPanel.tsx        # 快捷词汇面板
  ├─ OutputDisplay.tsx
  └─ SortButton.tsx
lib/
  ├─ vocab.ts              # 默认词汇库
  └─ utils.ts              # 整理提示词逻辑
```

## 五、交付要求（直接交给 Claude Code 的完整 Prompt）

```
请使用 Next.js 14（App Router） + Tailwind CSS 完整实现一个极简的多模型 AI 绘画提示词优化网页工具，仅包含以下功能：

1. 主界面布局：左侧固定宽度快捷词汇面板 + 右侧主操作区（输入框、模型选择、按钮区、输出框）
2. 支持 Grok、Gemini 1.5 Pro、Claude 3.5 Sonnet、DeepSeek-Chat、Qwen-Max 五种模型切换
3. 后端提供 /api/proxy/route.ts 统一代理接口，接收 {model, messages, apiKey}，转发至对应官方 API 并返回标准化结果
4. 快捷词汇面板：默认提供 30 个常用中文标签，点击追加对应英文描述，用户可在页面右上角设置中增删改，数据保存至 localStorage
5. “整理提示词”按钮：纯前端实现去重、质量词前置、合理加权、逻辑排序
6. 所有 API Key 由用户在设置面板自行填写，保存至 localStorage
7. 整体风格极简干净，配色灰白为主，参考 magicprompt.org 或 sillytavern 的提示词界面
8. 请一次性输出完整可运行的项目代码（包含所有必要文件），确保直接部署到 Vercel 即可正常运行。
```

## 六、后续可扩展方向（v2+，暂不实现）
- 风格预设模板一键加载
- 历史记录与收藏
- 社区分享与导入
- 批量生成变体
- i2v 专用运动描述模板

以上为最终确认的项目范围与技术方案，请严格按照此规范执行，不增加任何额外功能。  
如需立即获取完整可运行代码，我可现在提供；亦可直接将上述“交付要求”段落复制给 Claude Code 执行。