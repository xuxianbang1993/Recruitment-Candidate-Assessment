# 智聘评估系统 - 架构设计文档

> 创建日期: 2026-03-17
> 状态: 已批准

## 1. 项目概述

将现有单文件 HTML demo (`recruitment-assessment.html`) 重构为模块化桌面应用，接入多家 AI API，实现招聘评估智能化。

### 1.1 核心功能

| 功能 | 说明 |
|------|------|
| AI 辅助生成评估报告 | 输入候选人信息/面试记录，AI 生成结构化评估报告 |
| AI 对话式交互 | HR 与 AI 对话，咨询候选人匹配度等问题 |
| AI 自动打分/排名 | AI 根据简历和岗位要求自动评分排序 |
| 仪表盘 | 招聘数据总览、图表可视化 |
| 岗位管理 | 岗位需求录入与管理 |
| 候选人管理 | 候选人信息 CRUD |
| 智能报告 | 自动生成多维度评估报告 |

### 1.2 使用场景

- 内部工具，1 名 HR 使用
- 零技术门槛，双击 .exe 即用
- 数据存本地 SQLite

## 2. 技术栈

| 层面 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Svelte 5 + SvelteKit | latest |
| 样式 | Tailwind CSS | v4 |
| 桌面打包 | Electron | latest |
| 后端 | SvelteKit server routes | 内置 |
| 数据库 | SQLite (better-sqlite3) | latest |
| AI 接口 | OpenAI / Claude / DeepSeek | 多厂商 |
| 图表 | Chart.js | v4 |
| 语言 | TypeScript | v5 |

## 3. 目录结构

```
recruitment-assessment/
├── src/
│   ├── routes/                    # 页面路由（SvelteKit 约定）
│   │   ├── +layout.svelte         #   全局布局（侧边栏 + 主区域）
│   │   ├── +page.svelte           #   仪表盘首页
│   │   ├── assessment/            #   岗位评估模块
│   │   │   └── +page.svelte
│   │   ├── candidates/            #   候选人管理模块
│   │   │   └── +page.svelte
│   │   ├── reports/               #   智能报告模块
│   │   │   └── +page.svelte
│   │   ├── chat/                  #   AI 对话模块
│   │   │   └── +page.svelte
│   │   └── api/                   #   后端 API 路由
│   │       ├── ai/
│   │       │   └── +server.ts     #     AI 统一代理接口
│   │       ├── candidates/
│   │       │   └── +server.ts     #     候选人 CRUD
│   │       └── assessments/
│   │           └── +server.ts     #     评估 CRUD
│   │
│   ├── lib/                       # 可复用积木库
│   │   ├── components/            #   UI 组件（纯展示）
│   │   │   ├── Sidebar.svelte
│   │   │   ├── ScoreCard.svelte
│   │   │   ├── ChatBubble.svelte
│   │   │   └── RadarChart.svelte
│   │   │
│   │   ├── services/              #   业务服务层（核心逻辑）
│   │   │   ├── ai/                #     AI 服务（策略模式）
│   │   │   │   ├── ai-factory.ts  #       工厂：按配置创建 AI 实例
│   │   │   │   ├── ai-strategy.ts #       策略接口定义
│   │   │   │   ├── openai.ts      #       OpenAI 实现
│   │   │   │   ├── claude.ts      #       Claude 实现
│   │   │   │   └── deepseek.ts    #       DeepSeek 实现
│   │   │   ├── resume/            #     简历解析服务（策略模式）
│   │   │   │   ├── resume-parser.ts #      解析接口定义
│   │   │   │   ├── pdf-parser.ts  #       PDF 解析 (pdf-parse)
│   │   │   │   ├── docx-parser.ts #       Word 解析 (mammoth)
│   │   │   │   ├── text-parser.ts #       纯文本兜底
│   │   │   │   └── parser-factory.ts #    工厂：按扩展名路由
│   │   │   ├── assessment.ts      #     评估业务逻辑
│   │   │   ├── candidate.ts       #     候选人业务逻辑
│   │   │   └── report.ts          #     报告生成逻辑
│   │   │
│   │   ├── stores/                #   状态管理（Svelte Store）
│   │   │   ├── candidates.ts
│   │   │   ├── assessments.ts
│   │   │   └── chat.ts
│   │   │
│   │   ├── db/                    #   数据层（DAO 模式）
│   │   │   ├── database.ts        #       SQLite 连接（单例）
│   │   │   ├── migrations/        #       数据库迁移脚本
│   │   │   │   └── 001-init.sql
│   │   │   ├── candidate-dao.ts   #       候选人数据访问
│   │   │   └── assessment-dao.ts  #       评估数据访问
│   │   │
│   │   └── types/                 #   类型定义
│   │       ├── candidate.ts
│   │       ├── assessment.ts
│   │       └── ai.ts
│   │
│   └── app.css                    # 全局样式（Tailwind）
│
├── electron/                      # Electron 桌面壳
│   ├── main.ts                    #   主进程
│   └── preload.ts                 #   预加载脚本
│
├── static/                        # 静态资源
├── docs/                          # 文档
│   └── plans/                     #   设计与计划文档
├── svelte.config.js
├── tailwind.config.js
├── electron-builder.yml           # Electron 打包配置
└── package.json
```

## 4. 设计模式应用

### 4.1 策略模式（Strategy） — AI 多厂商切换

```typescript
// ai-strategy.ts
interface AIStrategy {
  chat(messages: Message[]): Promise<string>
  evaluate(candidate: Candidate, job: Job): Promise<Score>
  generateReport(data: AssessmentData): Promise<Report>
}
```

每个 AI 厂商实现此接口，通过工厂模式按配置创建实例。新增厂商只需添加一个文件。

### 4.2 工厂模式（Factory） — 按配置创建

```typescript
// ai-factory.ts
function createAI(provider: 'openai' | 'claude' | 'deepseek'): AIStrategy
```

### 4.3 DAO 模式 — 数据访问隔离

每个数据实体一个 DAO 类，封装所有 SQL 操作。业务层不直接接触数据库。

### 4.4 外观模式（Facade） — 业务服务封装

Service 层封装复杂的多步骤流程（取数据 -> 调 AI -> 存结果），页面只需调一个方法。

### 4.5 单例模式（Singleton） — 数据库连接

SQLite 连接全局唯一，避免重复打开。

## 5. 数据流

```
HR 双击 .exe 打开
    |
Electron 启动内嵌 SvelteKit 应用
    |
前端页面 <-> SvelteKit API 路由（后端）
                |              |
           SQLite 本地存储    AI API 代理
                              |
                    OpenAI / Claude / DeepSeek
```

## 6. 设计原则

1. **开闭原则** — 新增 AI 厂商/新页面不改已有代码
2. **迪米特法则** — 每层只知道相邻层，routes -> services -> db
3. **接口隔离** — AI/数据/UI 三层独立，互不干涉
4. **单一职责** — 每个文件只做一件事
5. **合成复用** — 组合优于继承，用 Svelte 组件组合 UI
