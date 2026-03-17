# 智聘评估系统 - 开发策略与分阶段实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将单文件 HTML demo 重构为 Svelte 5 + SvelteKit + Electron 桌面应用，接入多家 AI API

**Architecture:** SvelteKit 全栈框架 + Electron 桌面壳 + SQLite 本地存储 + 策略模式 AI 多厂商适配

**Tech Stack:** Svelte 5, SvelteKit, Electron, TypeScript, Tailwind CSS v4, better-sqlite3, Chart.js, OpenAI/Claude/DeepSeek SDK, pdf-parse, mammoth(docx解析)

**原始 Demo:** `recruitment-assessment.html` (1935 行单文件，含 5 个页面: dashboard/upload/requirements/analysis/report)

---

## 开发策略总则

### Agent Teams 角色定义

#### 开发团队

| 角色 | 模型 | 职责范围 | 文件权限 |
|------|------|---------|---------|
| **lead** | Opus | 任务拆解、Plan 审批、结果综合、质量把关 | 只读 + 审批 |
| **scaffolder** | Sonnet | 项目脚手架、配置文件、构建工具 | `package.json`, `svelte.config.*`, `electron/`, 配置文件 |
| **backend-dev** | Sonnet | 数据库、DAO、API 路由、AI 服务层、简历解析 | `src/lib/db/`, `src/lib/services/`, `src/lib/types/`, `src/routes/api/` |
| **frontend-dev** | Sonnet | UI 组件、页面、Store、样式 | `src/lib/components/`, `src/lib/stores/`, `src/routes/**/+page.svelte`, `src/app.css` |
| **tester** | Haiku | 运行测试、验证功能、检查构建 | 只读 + 运行命令 |

#### Opus 审核团队（每个 Phase 结束后启动）

| 角色 | 模型 | 职责 | 工具 |
|------|------|------|------|
| **reviewer-arch** | Opus | 架构审核：设计模式是否正确应用、分层是否清晰、是否符合 SOLID 原则 | 代码阅读 + WebSearch（搜索最佳实践对比） |
| **reviewer-security** | Opus | 安全审核：API Key 是否泄露、SQL 注入、XSS、依赖漏洞、Electron 安全配置 | 代码阅读 + WebSearch（搜索 CVE/安全公告） |
| **reviewer-ux** | Opus | 功能/缺陷审核：边界条件、错误处理、PDF/Word 解析兼容性、用户体验走查 | 运行应用 + 构造异常输入测试 |

#### Opus 审核流程（Phase Review Protocol）

```
Phase 开发完成
    |
    v
三人并行审核（各自独立，互不可见）
    |
    v
交叉验证：三人共享审核结果，互相补充遗漏
    |
    v
生成统一审核报告 → docs/reviews/phase-N-review.md
    |
    v
有缺陷？──是──→ 创建修复 Task → 开发团队修复 → 重新审核
    |
    否
    v
Phase 通过，写入检查点，进入下一 Phase
```

#### 审核报告模板

```markdown
# Phase N 审核报告

> 审核时间: YYYY-MM-DD
> 审核人: reviewer-arch / reviewer-security / reviewer-ux

## 架构审核 (reviewer-arch)
- [ ] 设计模式正确应用
- [ ] 分层清晰，无越层调用
- [ ] 类型安全，无 any 泛滥
- [ ] 参考资料: [搜索到的最佳实践链接]

## 安全审核 (reviewer-security)
- [ ] API Key 不在前端暴露
- [ ] SQL 参数化查询，无注入风险
- [ ] Electron nodeIntegration=false, contextIsolation=true
- [ ] 依赖无已知漏洞 (npm audit)
- [ ] 参考资料: [搜索到的安全公告链接]

## 功能/缺陷审核 (reviewer-ux)
- [ ] PDF 简历解析（中文/英文/扫描件）
- [ ] Word 简历解析（.docx/.doc）
- [ ] 空文件/损坏文件处理
- [ ] AI 调用超时/失败的降级处理
- [ ] 大文件上传（>10MB）
- [ ] 特殊字符/编码问题

## 交叉验证结论
- 通过 / 需修复

## 修复清单
1. [缺陷描述] → 分配给 [角色]
```

### 文件冲突规则（铁律）

- **同一文件不允许两个 teammate 同时编辑**
- 有依赖关系的任务用 `addBlockedBy` 串联
- 每个 Phase 结束前必须通过 tester 验证

### 上下文恢复机制

每个 Phase 完成后自动生成检查点文件 `docs/checkpoints/phase-N-checkpoint.md`，内容包括：
1. 已完成的文件清单
2. 当前项目状态（可运行/不可运行）
3. 下一步要做什么
4. 关键决策记录

**恢复方法**：新会话只需读取最新 checkpoint + 本文档即可继续。

### UI 设计规范（前端开发铁律）

所有前端开发必须严格遵循 `docs/plans/2026-03-17-ui-design-spec.md`，不得自行发挥。
- 色彩：从 demo 提取的完整色板（暖灰白背景 + 橙色强调 + 暗色侧边栏）
- 字体：Noto Sans SC + Playfair Display
- 圆角/阴影/间距：全部有精确数值
- 组件规范：按钮、卡片、输入框、徽章
- **10 条红线**：不得违反（如不得用纯黑文字、不得用蓝色主色等）

---

## Phase 0: 项目脚手架（基础设施）

**目标：** 创建可运行的空项目骨架，`npm run dev` 能看到空白页面

**验证标准：** `npm run dev` 启动成功，浏览器打开 localhost 看到 "智聘评估" 标题

**Agent Teams 分配：** scaffolder (Sonnet) 独立完成

### Task 0.1: 初始化 SvelteKit 项目

**Files:**
- Create: `package.json`
- Create: `svelte.config.js`
- Create: `tsconfig.json`
- Create: `vite.config.ts`

**Step 1:** 初始化项目
```bash
cd "D:/SZOMK-项目/招聘评估系统"
npm create svelte@latest app -- --template skeleton --types typescript
```

**Step 2:** 移动文件到项目根目录（或在 app/ 子目录下工作）

**Step 3:** 安装依赖
```bash
npm install
```

**Step 4:** 验证启动
```bash
npm run dev
```
Expected: 终端显示 localhost 地址，浏览器可访问

**Step 5:** Commit
```bash
git init && git add -A && git commit -m "chore: init SvelteKit skeleton project"
```

### Task 0.2: 配置 Tailwind CSS v4

**Files:**
- Create: `src/app.css`
- Modify: `svelte.config.js`

**Step 1:** 安装 Tailwind
```bash
npm install -D tailwindcss @tailwindcss/vite
```

**Step 2:** 在 `vite.config.ts` 中添加 Tailwind 插件
```typescript
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
})
```

**Step 3:** 在 `src/app.css` 中引入
```css
@import "tailwindcss";
```

**Step 4:** 验证 Tailwind 生效 — 在页面加一个带 Tailwind 类的元素，看样式是否正确

**Step 5:** Commit
```bash
git add -A && git commit -m "chore: add Tailwind CSS v4"
```

### Task 0.3: 配置 TypeScript 路径别名与基础类型

**Files:**
- Modify: `tsconfig.json`
- Create: `src/lib/types/candidate.ts`
- Create: `src/lib/types/assessment.ts`
- Create: `src/lib/types/ai.ts`

**Step 1:** 确认 SvelteKit 默认的 `$lib` 别名可用

**Step 2:** 创建类型定义文件

```typescript
// src/lib/types/candidate.ts
export interface Candidate {
  id: string
  name: string
  phone: string
  email: string
  position: string
  resumeText: string
  skills: string[]
  experience: number
  education: string
  createdAt: string
}

// src/lib/types/assessment.ts
export interface Assessment {
  id: string
  candidateId: string
  jobId: string
  scores: ScoreDimension[]
  totalScore: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  aiProvider: string
  createdAt: string
}

export interface ScoreDimension {
  name: string
  weight: number
  score: number
}

export interface Job {
  id: string
  title: string
  department: string
  description: string
  requirements: string[]
  skills: string[]
  weights: ScoreDimension[]
}

// src/lib/types/ai.ts
export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIConfig {
  provider: 'openai' | 'claude' | 'deepseek'
  apiKey: string
  model: string
  baseUrl?: string
}
```

**Step 3:** Commit
```bash
git add -A && git commit -m "feat: add TypeScript type definitions"
```

### Task 0.4: 目录结构骨架

**Files:**
- Create: 所有空目录下的 `.gitkeep` 或 `index.ts`

**Step 1:** 创建完整目录结构
```bash
mkdir -p src/lib/{components,services/ai,stores,db/migrations}
mkdir -p src/routes/{assessment,candidates,reports,chat,api/{ai,candidates,assessments}}
mkdir -p electron
mkdir -p docs/checkpoints
```

**Step 2:** Commit
```bash
git add -A && git commit -m "chore: create project directory structure"
```

**Phase 0 检查点 → `docs/checkpoints/phase-0-checkpoint.md`**

**>>> Phase 0 审核：Opus 审核团队验证脚手架配置 <<<**

**验证命令：**
```bash
npm run dev  # 必须成功启动
npm run check  # TypeScript 检查通过
```

---

## Phase 1: 数据层（SQLite + DAO）

**目标：** 数据库初始化、表结构、DAO 层完成，可通过代码增删改查

**验证标准：** 运行测试脚本，能创建/读取/更新/删除候选人和评估记录

**Agent Teams 分配：** backend-dev (Sonnet) 独立完成

**blockedBy:** Phase 0

### Task 1.1: SQLite 数据库连接（单例模式）

**Files:**
- Create: `src/lib/db/database.ts`

**Step 1:** 安装依赖
```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

**Step 2:** 实现数据库单例
```typescript
// src/lib/db/database.ts
import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = process.env.NODE_ENV === 'test'
      ? ':memory:'
      : path.join(app?.getPath('userData') ?? '.', 'recruitment.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    runMigrations(db)
  }
  return db
}

function runMigrations(db: Database.Database) {
  // 读取 migrations/ 目录下的 SQL 文件，按顺序执行
  // ...
}
```

**Step 3:** Commit

### Task 1.2: 数据库迁移脚本

**Files:**
- Create: `src/lib/db/migrations/001-init.sql`

**Step 1:** 编写初始化 SQL
```sql
-- 001-init.sql
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  position TEXT,
  resume_text TEXT,
  skills TEXT, -- JSON array
  experience INTEGER DEFAULT 0,
  education TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT,
  description TEXT,
  requirements TEXT, -- JSON array
  skills TEXT, -- JSON array
  weights TEXT, -- JSON array of {name, weight}
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id),
  job_id TEXT NOT NULL REFERENCES jobs(id),
  scores TEXT, -- JSON array of {name, weight, score}
  total_score REAL DEFAULT 0,
  strengths TEXT, -- JSON array
  weaknesses TEXT, -- JSON array
  suggestions TEXT, -- JSON array
  ai_provider TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_history (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

**Step 2:** Commit

### Task 1.3: Candidate DAO

**Files:**
- Create: `src/lib/db/candidate-dao.ts`

**Step 1:** 实现 DAO
```typescript
// src/lib/db/candidate-dao.ts
import { getDatabase } from './database'
import type { Candidate } from '$lib/types/candidate'
import { randomUUID } from 'crypto'

export class CandidateDAO {
  getAll(): Candidate[] { ... }
  getById(id: string): Candidate | undefined { ... }
  create(data: Omit<Candidate, 'id' | 'createdAt'>): Candidate { ... }
  update(id: string, data: Partial<Candidate>): void { ... }
  delete(id: string): void { ... }
  search(keyword: string): Candidate[] { ... }
}

export const candidateDAO = new CandidateDAO()
```

**Step 2:** Commit

### Task 1.4: Assessment DAO + Job DAO

**Files:**
- Create: `src/lib/db/assessment-dao.ts`
- Create: `src/lib/db/job-dao.ts`

**Step 1:** 按同样模式实现，每个 DAO 封装完整 CRUD

**Step 2:** Commit

### Task 1.5: 数据层验证

**Step 1:** 写一个简单测试脚本验证 CRUD 全流程

**Step 2:** 运行验证
```bash
npx tsx src/lib/db/__test__/dao-test.ts
```
Expected: 创建、查询、更新、删除均成功

**Phase 1 检查点 → `docs/checkpoints/phase-1-checkpoint.md`**

**>>> Phase 1 审核：启动 Opus 审核团队，审核数据层 <<<**

---

## Phase 1.5: 简历解析服务（PDF + Word）

**目标：** 支持 PDF 和 Word (.docx) 格式简历上传，自动提取文本内容

**验证标准：** 上传 PDF/Word 简历，能正确提取出纯文本

**Agent Teams 分配：** backend-dev (Sonnet) 独立完成

**blockedBy:** Phase 0

### Task 1.5.1: 安装简历解析依赖

```bash
npm install pdf-parse mammoth
npm install -D @types/pdf-parse
```

- `pdf-parse` — PDF 文本提取（支持中英文）
- `mammoth` — Word .docx 转文本/HTML

### Task 1.5.2: 简历解析服务（策略模式）

**Files:**
- Create: `src/lib/services/resume/resume-parser.ts`
- Create: `src/lib/services/resume/pdf-parser.ts`
- Create: `src/lib/services/resume/docx-parser.ts`
- Create: `src/lib/services/resume/text-parser.ts`

```typescript
// resume-parser.ts — 统一接口
export interface ResumeParser {
  readonly supportedExtensions: string[]
  parse(buffer: Buffer, filename: string): Promise<ParsedResume>
}

export interface ParsedResume {
  text: string           // 纯文本内容
  metadata: {
    filename: string
    fileType: string
    pageCount?: number
    fileSize: number
  }
}

// pdf-parser.ts
import pdfParse from 'pdf-parse'

export class PdfResumeParser implements ResumeParser {
  readonly supportedExtensions = ['.pdf']

  async parse(buffer: Buffer, filename: string): Promise<ParsedResume> {
    const result = await pdfParse(buffer)
    return {
      text: result.text,
      metadata: {
        filename,
        fileType: 'pdf',
        pageCount: result.numpages,
        fileSize: buffer.length
      }
    }
  }
}

// docx-parser.ts
import mammoth from 'mammoth'

export class DocxResumeParser implements ResumeParser {
  readonly supportedExtensions = ['.docx', '.doc']

  async parse(buffer: Buffer, filename: string): Promise<ParsedResume> {
    const result = await mammoth.extractRawText({ buffer })
    return {
      text: result.value,
      metadata: {
        filename,
        fileType: 'docx',
        fileSize: buffer.length
      }
    }
  }
}

// text-parser.ts — 纯文本 .txt 兜底
export class TextResumeParser implements ResumeParser {
  readonly supportedExtensions = ['.txt']

  async parse(buffer: Buffer, filename: string): Promise<ParsedResume> {
    return {
      text: buffer.toString('utf-8'),
      metadata: { filename, fileType: 'txt', fileSize: buffer.length }
    }
  }
}
```

### Task 1.5.3: 解析工厂（按文件扩展名路由）

**Files:**
- Create: `src/lib/services/resume/parser-factory.ts`

```typescript
import { PdfResumeParser } from './pdf-parser'
import { DocxResumeParser } from './docx-parser'
import { TextResumeParser } from './text-parser'
import type { ResumeParser } from './resume-parser'
import path from 'path'

const parsers: ResumeParser[] = [
  new PdfResumeParser(),
  new DocxResumeParser(),
  new TextResumeParser()
]

export function getParser(filename: string): ResumeParser {
  const ext = path.extname(filename).toLowerCase()
  const parser = parsers.find(p => p.supportedExtensions.includes(ext))
  if (!parser) {
    throw new Error(`不支持的文件格式: ${ext}，支持 PDF/Word/TXT`)
  }
  return parser
}
```

### Task 1.5.4: 简历上传 API

**Files:**
- Create: `src/routes/api/resume/upload/+server.ts`

```
POST /api/resume/upload  (multipart/form-data)
→ 接收文件 → 识别格式 → 调用对应解析器 → 返回提取文本 + 元数据
→ 可选: 自动创建 Candidate 记录
```

### Task 1.5.5: 解析验证

准备测试文件：
- 中文 PDF 简历
- 英文 PDF 简历
- .docx 简历
- 空文件 / 损坏文件（验证错误处理）

```bash
curl -F "file=@test-resume.pdf" http://localhost:5173/api/resume/upload
```
Expected: 返回 JSON，包含 text 和 metadata

**Phase 1.5 检查点 → `docs/checkpoints/phase-1.5-checkpoint.md`**

**>>> Phase 1.5 审核：Opus 审核团队验证解析兼容性 <<<**

---

## Phase 2: AI 服务层（策略模式 + 工厂模式）

**目标：** 多 AI 厂商统一接口，可切换调用 OpenAI/Claude/DeepSeek

**验证标准：** 调用任一 AI 厂商的 chat 接口，能返回有效响应

**Agent Teams 分配：** backend-dev (Sonnet) 独立完成

**blockedBy:** Phase 0 (只依赖类型定义)

### Task 2.1: AI 策略接口定义

**Files:**
- Create: `src/lib/services/ai/ai-strategy.ts`

```typescript
import type { Message, AIConfig } from '$lib/types/ai'
import type { Candidate, Assessment, Job } from '$lib/types'

export interface AIStrategy {
  readonly name: string
  chat(messages: Message[]): Promise<string>
  evaluate(candidate: Candidate, job: Job): Promise<Omit<Assessment, 'id' | 'createdAt'>>
  generateReport(assessment: Assessment, candidate: Candidate, job: Job): Promise<string>
}
```

### Task 2.2: OpenAI 实现

**Files:**
- Create: `src/lib/services/ai/openai.ts`

**Step 1:** 安装 SDK
```bash
npm install openai
```

**Step 2:** 实现 OpenAIStrategy（chat/evaluate/generateReport 三个方法）

### Task 2.3: Claude 实现

**Files:**
- Create: `src/lib/services/ai/claude.ts`

```bash
npm install @anthropic-ai/sdk
```

### Task 2.4: DeepSeek 实现

**Files:**
- Create: `src/lib/services/ai/deepseek.ts`

DeepSeek 兼容 OpenAI 接口，复用 OpenAI SDK 换 baseUrl 即可。

### Task 2.5: AI 工厂

**Files:**
- Create: `src/lib/services/ai/ai-factory.ts`

```typescript
export function createAI(config: AIConfig): AIStrategy {
  switch (config.provider) {
    case 'openai': return new OpenAIStrategy(config)
    case 'claude': return new ClaudeStrategy(config)
    case 'deepseek': return new DeepSeekStrategy(config)
    default: throw new Error(`Unknown AI provider: ${config.provider}`)
  }
}
```

### Task 2.6: AI 服务层验证

**Step 1:** 用测试脚本调用 chat 接口
```bash
AI_PROVIDER=openai AI_API_KEY=sk-xxx npx tsx src/lib/services/ai/__test__/ai-test.ts
```
Expected: 返回有效 AI 响应

**Phase 2 检查点 → `docs/checkpoints/phase-2-checkpoint.md`**

**>>> Phase 2 审核：Opus 审核团队验证 AI 接口 <<<**

---

## Phase 3: API 路由层

**目标：** SvelteKit server routes 提供 REST API，前端可通过 fetch 调用

**验证标准：** 用 curl 测试所有 API 端点，返回正确 JSON

**Agent Teams 分配：** backend-dev (Sonnet) 独立完成

**blockedBy:** Phase 1 + Phase 2

### Task 3.1: 候选人 API

**Files:**
- Create: `src/routes/api/candidates/+server.ts`

```
GET    /api/candidates      → 列表
POST   /api/candidates      → 创建
```

- Create: `src/routes/api/candidates/[id]/+server.ts`

```
GET    /api/candidates/:id  → 详情
PUT    /api/candidates/:id  → 更新
DELETE /api/candidates/:id  → 删除
```

### Task 3.2: 岗位 API

**Files:**
- Create: `src/routes/api/jobs/+server.ts`
- Create: `src/routes/api/jobs/[id]/+server.ts`

同上 CRUD 模式。

### Task 3.3: 评估 API

**Files:**
- Create: `src/routes/api/assessments/+server.ts`
- Create: `src/routes/api/assessments/[id]/+server.ts`

### Task 3.4: AI 统一代理 API

**Files:**
- Create: `src/routes/api/ai/+server.ts`
- Create: `src/routes/api/ai/chat/+server.ts`
- Create: `src/routes/api/ai/evaluate/+server.ts`
- Create: `src/routes/api/ai/report/+server.ts`

```
POST /api/ai/chat      → AI 对话
POST /api/ai/evaluate   → AI 评估打分
POST /api/ai/report     → AI 生成报告
```

### Task 3.5: 设置 API（AI 配置管理）

**Files:**
- Create: `src/routes/api/settings/+server.ts`

```
GET  /api/settings   → 获取配置（AI provider、API key 等）
PUT  /api/settings   → 更新配置
```

### Task 3.6: API 层验证

```bash
npm run dev &
curl http://localhost:5173/api/candidates
curl -X POST http://localhost:5173/api/candidates -H "Content-Type: application/json" -d '{"name":"张三"}'
```
Expected: 返回正确 JSON

**Phase 3 检查点 → `docs/checkpoints/phase-3-checkpoint.md`**

**>>> Phase 3 审核：Opus 审核团队验证全部 API 端点 <<<**

---

## Phase 4: 前端 UI 组件 + 页面

**目标：** 从 HTML demo 迁移所有 UI 到 Svelte 组件，连接 API

**验证标准：** 所有页面可交互，数据能增删改查

**Agent Teams 分配：** frontend-dev (Sonnet) 独立完成，可与 Phase 2/3 部分并行

**blockedBy:** Phase 0 + Phase 3 (API 就绪)

### Task 4.1: 全局布局 + 侧边栏

**Files:**
- Create: `src/routes/+layout.svelte`
- Create: `src/lib/components/Sidebar.svelte`
- Modify: `src/app.css`

从 demo 的 `.sidebar` 和 `.nav-item` 样式迁移。将 CSS 变量迁移到 Tailwind 的 `@theme` 配置。

### Task 4.2: 仪表盘页面

**Files:**
- Create: `src/routes/+page.svelte`
- Create: `src/lib/components/StatCard.svelte`
- Create: `src/lib/components/RadarChart.svelte`

从 demo 的 `#page-dashboard` 迁移。集成 Chart.js 图表。

### Task 4.3: 候选人管理页面（简历上传 + 列表）

**Files:**
- Create: `src/routes/candidates/+page.svelte`
- Create: `src/lib/components/ResumeUploader.svelte`
- Create: `src/lib/components/CandidateCard.svelte`
- Create: `src/lib/stores/candidates.ts`

从 demo 的 `#page-upload` 迁移。拖拽上传 + 简历解析。

### Task 4.4: 岗位需求页面

**Files:**
- Create: `src/routes/assessment/+page.svelte`
- Create: `src/lib/components/JobForm.svelte`
- Create: `src/lib/components/SkillTagInput.svelte`
- Create: `src/lib/components/WeightSlider.svelte`

从 demo 的 `#page-requirements` 迁移。权重配置 + 技能标签输入。

### Task 4.5: 分析评估页面

**Files:**
- Create: `src/routes/assessment/results/+page.svelte`
- Create: `src/lib/components/ScoreCard.svelte`
- Create: `src/lib/components/CandidateCompare.svelte`
- Create: `src/lib/stores/assessments.ts`

从 demo 的 `#page-analysis` 迁移。AI 评分 + 雷达图 + 候选人对比。

### Task 4.6: AI 对话页面

**Files:**
- Create: `src/routes/chat/+page.svelte`
- Create: `src/lib/components/ChatBubble.svelte`
- Create: `src/lib/components/ChatInput.svelte`
- Create: `src/lib/stores/chat.ts`

全新页面（demo 中无此功能）。流式响应。

### Task 4.7: 智能报告页面

**Files:**
- Create: `src/routes/reports/+page.svelte`
- Create: `src/lib/components/ReportSection.svelte`

从 demo 的 `#page-report` 迁移。AI 生成报告 + 导出。

### Task 4.8: 设置页面（AI 配置）

**Files:**
- Create: `src/routes/settings/+page.svelte`

配置 AI 厂商、API Key、模型选择。

### Task 4.9: 前端集成验证

启动 dev server，逐页测试：
1. 侧边栏导航切换正常
2. 候选人 CRUD 正常
3. 岗位创建正常
4. AI 评估能返回结果
5. 对话功能正常
6. 报告生成正常

**Phase 4 检查点 → `docs/checkpoints/phase-4-checkpoint.md`**

**>>> Phase 4 审核：Opus 审核团队全面 UI/UX + 功能测试 <<<**

---

## Phase 5: Electron 桌面打包

**目标：** 将 SvelteKit 应用打包为 .exe 桌面应用

**验证标准：** 双击 .exe 能打开完整应用，所有功能可用

**Agent Teams 分配：** scaffolder (Sonnet) 独立完成

**blockedBy:** Phase 4

### Task 5.1: Electron 主进程

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`

### Task 5.2: SvelteKit 适配 Electron

**Files:**
- Modify: `svelte.config.js` — 切换到 `adapter-static` 或 `adapter-node`
- Create: `electron-builder.yml`
- Modify: `package.json` — 添加 electron 相关脚本

### Task 5.3: 打包验证

```bash
npm run build
npm run electron:build
```
Expected: 在 `dist/` 目录生成 .exe 安装包

### Task 5.4: 安装测试

在干净目录解压/安装 .exe，双击启动，验证所有功能。

**Phase 5 检查点 → `docs/checkpoints/phase-5-checkpoint.md`**

**>>> Phase 5 审核：Opus 审核团队验证 Electron 打包安全性 + 安装测试 <<<**

---

## Phase 6: 打磨与交付

**目标：** UI 细节打磨、错误处理、用户引导

**验证标准：** HR 能独立使用，无需技术支持

**Agent Teams 分配：** frontend-dev (Sonnet) + tester (Haiku)

**blockedBy:** Phase 5

### Task 6.1: 首次使用引导

引导 HR 配置 AI API Key。

### Task 6.2: 错误处理与提示

网络错误、AI 调用失败、数据校验等场景的友好提示。

### Task 6.3: 数据备份/导出

一键导出数据为 JSON/Excel。

### Task 6.4: 最终全流程测试

完整用户旅程测试：安装 → 配置 → 上传简历 → 创建岗位 → AI 评估 → 查看报告 → 对话咨询。

---

## Agent Teams 并行策略

```
时间线 →

Phase 0:   [scaffolder]──→ [Opus审核x3] ──┐
                                            │
Phase 1:   [backend-dev]──→ [Opus审核x3]   │  (Phase 1/1.5/2 可并行)
Phase 1.5: [backend-dev]──→ [Opus审核x3]   │
Phase 2:   [backend-dev]──→ [Opus审核x3] ──┤
                                            │
Phase 3:   [backend-dev]──→ [Opus审核x3] ──┤  (依赖 Phase 1+1.5+2)
                                            │
Phase 4:   [frontend-dev]─→ [Opus审核x3] ──┤  (依赖 Phase 0+3)
                                            │
Phase 5:   [scaffolder]───→ [Opus审核x3] ──┤  (依赖 Phase 4)
                                            │
Phase 6:   [frontend-dev + tester] ────────┘  (依赖 Phase 5)
```

**审核团队运行模式：**
- 每个 Phase 开发完成后，启动 3 个 Opus reviewer **并行独立审核**
- 审核完成后 **交叉验证**：三人共享结果，互相补充
- 发现缺陷 → 创建修复 Task → 开发团队修复 → 重新审核
- 审核通过 → 写入检查点 → 进入下一 Phase

**最大并行度：Phase 1 + Phase 1.5 + Phase 2 可同时进行**（backend-dev 串行，或多个 backend-dev 并行）

---

## 上下文恢复 SOP

### 新会话恢复步骤

1. 读取本文档: `docs/plans/2026-03-17-development-strategy.md`
2. 读取最新检查点: `docs/checkpoints/phase-N-checkpoint.md`
3. 读取架构设计: `docs/plans/2026-03-17-architecture-design.md`
4. 运行 `npm run dev` 确认当前状态
5. 从检查点标注的"下一步"继续执行

### 检查点模板

```markdown
# Phase N 检查点

> 时间: YYYY-MM-DD HH:mm
> 状态: 可运行 / 不可运行

## 已完成文件
- [x] file1.ts
- [x] file2.svelte

## 未完成任务
- [ ] Task N.x: 描述

## 关键决策
- 决策1: 原因

## 下一步
继续执行 Phase N, Task N.x
```
