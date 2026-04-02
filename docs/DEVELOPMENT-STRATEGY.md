# 智聘评估 — 开发策略文档 (Development Strategy)

> **版本**: v2.0  
> **生效日期**: 2026-04-02  
> **适用范围**: 本项目所有后续迭代开发  
> **强制性**: 所有代码变更必须通过本文档合规检查

---

## 目录

1. [核心原则](#1-核心原则)
2. [国际规范对标](#2-国际规范对标)
3. [架构分层规范](#3-架构分层规范)
4. [设计模式规范](#4-设计模式规范)
5. [代码质量标准](#5-代码质量标准)
6. [UI/前端统一设计系统](#6-ui前端统一设计系统)
7. [TypeScript 编码规范](#7-typescript-编码规范)
8. [数据库与数据访问规范](#8-数据库与数据访问规范)
9. [测试策略](#9-测试策略)
10. [安全规范](#10-安全规范)
11. [Git 工作流与版本管理](#11-git-工作流与版本管理)
12. [文档与可维护性](#12-文档与可维护性)
13. [迭代开发检查清单](#13-迭代开发检查清单)

---

## 1. 核心原则

本项目遵循 **"积木化"（Composable Architecture）** 设计哲学 — 每个模块像积木一样可独立替换、自由组装。

| 原则 | 说明 | 检验标准 |
|------|------|----------|
| **模块化** | 每个文件/模块只做一件事 | 单文件 < 300 行，单函数 < 50 行 |
| **松耦合** | 模块间通过接口（Interface）交互，不直接依赖实现 | 可独立 mock 测试 |
| **高内聚** | 相关逻辑集中在同一模块内 | 修改某功能只需改 1-2 个文件 |
| **开闭原则** | 对扩展开放，对修改关闭 | 新增 AI 提供商无需改动已有代码 |
| **单一数据源** | 配置、模板、类型定义各只有一个权威来源 | 无重复定义 |

---

## 2. 国际规范对标

本项目参照以下国际标准体系，确保工程质量达到行业水准：

### 2.1 ISO/IEC 25010 — 软件产品质量模型

| 质量特性 | 本项目落地方式 |
|----------|---------------|
| **功能适合性** | 需求→类型定义→实现→测试 全链路追溯 |
| **性能效率** | SQLite WAL 模式、懒加载、Electron 主/渲染进程分离 |
| **兼容性** | Electron 跨平台（Windows/macOS），AI 策略模式多提供商兼容 |
| **可用性** | 统一设计系统、WCAG 2.1 AA 无障碍基线 |
| **可靠性** | 错误边界（+error.svelte）、输入校验、数据库事务 |
| **安全性** | Context Isolation、CSP、输入消毒、路径遍历防护 |
| **可维护性** | 分层架构、设计模式、TypeScript 严格模式 |
| **可移植性** | SvelteKit adapter 机制、环境变量配置化 |

### 2.2 IEEE 830 — 软件需求规格

- 每个迭代版本必须在 `docs/specs/` 中维护需求规格文件
- 需求条目格式：`[REQ-XXX] 需求描述 | 优先级 | 验收标准`

### 2.3 OWASP Top 10 (2025) — 安全基线

- 所有用户输入必须消毒（sanitize）
- 文件上传必须校验类型 + 大小限制（已有 MAX_FILE_SIZE）
- API 端点必须有错误处理，禁止泄露内部堆栈

### 2.4 CISQ — 代码质量标准

遵循 CISQ 四维质量模型：可靠性、安全性、性能效率、可维护性。

---

## 3. 架构分层规范

### 3.1 分层架构图

```
┌─────────────────────────────────────────────────────┐
│                   Electron Shell                     │
│  electron/main.js  (主进程 — 窗口管理、系统 API)      │
├─────────────────────────────────────────────────────┤
│                   Presentation Layer                 │
│  src/routes/        页面路由 (+page.svelte)           │
│  src/lib/components/ UI 组件 (纯展示 + 交互)          │
├─────────────────────────────────────────────────────┤
│                   API Layer                          │
│  src/routes/api/    REST 端点 (+server.ts)           │
│  src/routes/api/utils.ts  请求/响应工具               │
├─────────────────────────────────────────────────────┤
│                   Service Layer                      │
│  src/lib/server/services/  业务逻辑                  │
│    ai/       AI 评估服务 (策略模式)                    │
│    resume/   简历解析服务 (工厂模式)                   │
├─────────────────────────────────────────────────────┤
│                   Data Access Layer                  │
│  src/lib/server/db/  DAO + 数据库管理                 │
│    *-dao.ts          数据访问对象                     │
│    database.ts       连接管理 (单例模式)               │
│    migrations/       数据库迁移脚本                    │
├─────────────────────────────────────────────────────┤
│                   Foundation Layer                   │
│  src/lib/types/      TypeScript 类型定义              │
│  src/lib/config/     配置与模板                       │
│  src/lib/utils/      纯工具函数                       │
│  src/app.css         设计令牌 (Design Tokens)         │
└─────────────────────────────────────────────────────┘
```

### 3.2 层间依赖规则

```
严格单向依赖：上层 → 下层（禁止反向引用）

Presentation → API → Service → DAO → Foundation
                                       ↑
                                  所有层均可引用
```

| 规则 | 说明 |
|------|------|
| **禁止跨层调用** | 组件不能直接调用 DAO，必须经过 API 层 |
| **禁止反向依赖** | Service 不能 import 组件，DAO 不能 import Service |
| **Foundation 层公共** | types/config/utils 可被任意层引用 |
| **Server-only 隔离** | `$lib/server/` 下的代码禁止在客户端引用（SvelteKit 强制） |

---

## 4. 设计模式规范

> 参考: [菜鸟教程 — 设计模式](https://www.runoob.com/design-pattern/design-pattern-intro.html)

### 4.1 项目已采用的设计模式

| 模式 | 分类 | 当前应用 | 文件位置 |
|------|------|----------|----------|
| **策略模式** (Strategy) | 行为型 | AI 服务多提供商切换 | `ai-strategy.ts`, `openai.ts`, `claude.ts`, `deepseek.ts` |
| **工厂模式** (Factory) | 创建型 | AI 实例创建、简历解析器分发 | `ai-factory.ts`, `parser-factory.ts` |
| **单例模式** (Singleton) | 创建型 | 数据库连接管理 | `database.ts` |
| **模板方法** (Template Method) | 行为型 | 简历解析器基类 | `resume-parser.ts` |
| **数据访问对象** (DAO) | J2EE | 数据库 CRUD 封装 | `*-dao.ts` |

### 4.2 后续迭代应采用的设计模式

| 模式 | 分类 | 适用场景 | 何时引入 |
|------|------|----------|----------|
| **观察者模式** (Observer) | 行为型 | 评估状态变更通知 UI 更新 | Svelte 5 Runes ($state/$derived) 天然支持 |
| **装饰器模式** (Decorator) | 结构型 | AI prompt 增强（加入岗位上下文、行为锚点） | prompt 组装流程 |
| **责任链模式** (Chain of Responsibility) | 行为型 | 简历预处理管道（清洗→提取→格式化） | 简历解析增强时 |
| **建造者模式** (Builder) | 创建型 | 复杂报告/Word文档组装 | 报告导出功能 |
| **外观模式** (Facade) | 结构型 | 对外统一 API 入口，屏蔽内部复杂度 | API 路由重构时 |
| **适配器模式** (Adapter) | 结构型 | 不同 AI 响应格式标准化 | 新 AI 提供商接入时 |
| **组合模式** (Composite) | 结构型 | 评估维度树形结构（维度→子维度→指标） | 评估体系升级时 |
| **命令模式** (Command) | 行为型 | 用户操作撤销/重做 | 表单编辑增强时 |

### 4.3 设计模式选用原则

```
❶ 不为模式而模式 — 只在解决实际复杂性时引入
❷ 优先使用语言/框架原生能力（Svelte Runes > 手写 Observer）
❸ 新增模式必须在 PR 描述中说明：解决什么问题、为什么选这个模式
❹ 模式实现必须有对应的类型定义（Interface/Type）
```

---

## 5. 代码质量标准

### 5.1 SOLID 原则落地

| 原则 | 缩写 | 本项目检验方式 |
|------|------|---------------|
| 单一职责 | **S** | 每个文件只有一个导出的核心概念 |
| 开闭原则 | **O** | 新增功能通过新文件/类实现，不修改已有接口 |
| 里氏替换 | **L** | 所有 AI 策略实现可互相替换，行为一致 |
| 接口隔离 | **I** | 接口精简，不强迫实现不需要的方法 |
| 依赖倒置 | **D** | 上层依赖抽象接口（AIStrategy），不依赖具体类 |

### 5.2 代码度量红线

| 指标 | 阈值 | 工具 |
|------|------|------|
| 单文件行数 | ≤ 300 行 | 人工审查 |
| 单函数行数 | ≤ 50 行 | 人工审查 |
| 圈复杂度 | ≤ 10 | svelte-check + 审查 |
| 类耦合度 | ≤ 5 个直接依赖 | import 分析 |
| 重复代码 | 0 容忍（≥3处相同逻辑必须抽取） | 审查 |
| TypeScript any | 0 容忍（禁止使用 any） | tsconfig strict |

### 5.3 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `ai-factory.ts`, `parser-factory.ts` |
| 类/接口/类型 | PascalCase | `AIStrategy`, `Candidate`, `ResumeParser` |
| 函数/变量 | camelCase | `createAI()`, `getParser()` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Svelte 组件 | PascalCase | `ReportHero.svelte`, `ScoreCard.svelte` |
| CSS 变量 | kebab-case + 语义前缀 | `--color-accent`, `--font-sans` |
| 数据库字段 | snake_case | `created_at`, `job_category` |
| 路由文件 | SvelteKit 约定 | `+page.svelte`, `+server.ts` |

---

## 6. UI/前端统一设计系统

### 6.1 设计令牌 (Design Tokens)

所有视觉参数**只能**通过 `app.css` 中的 `@theme` 和 `:root` 变量定义，禁止在组件中硬编码颜色/字号/间距。

```
权威来源: src/app.css

@theme { ... }    → Tailwind v4 主题令牌（颜色、字体）
:root  { ... }    → 全局 CSS 变量（阴影、圆角、过渡）
```

#### 6.1.1 颜色体系

| 令牌 | 用途 | 值 |
|------|------|-----|
| `--color-bg-primary` | 页面背景 | `#F7F5F2` |
| `--color-bg-card` | 卡片背景 | `#FFFFFF` |
| `--color-bg-sidebar` | 侧边栏背景 | `#1A1D23` |
| `--color-accent` | 主强调色 | `#D4763C` |
| `--color-success` | 成功/通过 | `#3B9B6D` |
| `--color-warning` | 警告/中等 | `#D4963C` |
| `--color-danger` | 危险/不通过 | `#C75450` |
| `--color-info` | 信息/提示 | `#4A7FC7` |

#### 6.1.2 排版体系

| 令牌 | 用途 |
|------|------|
| `--font-sans` | 正文（Noto Sans SC + 系统字体回退） |
| `--font-display` | 标题/装饰（Playfair Display） |

#### 6.1.3 空间体系

| 变量 | 用途 |
|------|------|
| `--radius` | 标准圆角 `10px` |
| `--radius-lg` | 大圆角 `16px` |
| `--shadow-sm/md/lg` | 三级阴影 |
| `--transition` | 标准过渡动画 |

### 6.2 组件设计规范

#### 6.2.1 组件分层

```
src/lib/components/
├── ui/           ← 原子组件（Button, Input, Badge, Modal）
├── report/       ← 报告领域组件
├── assessment/   ← 评估领域组件（如需拆分）
└── layout/       ← 布局组件（Sidebar, Header）
```

#### 6.2.2 组件编写规则

| 规则 | 说明 |
|------|------|
| **单一职责** | 每个组件只做一件事，超过 200 行必须拆分 |
| **Props 类型化** | 所有 props 必须有 TypeScript 类型定义 |
| **无硬编码样式** | 颜色/间距/字号只用 Tailwind 类或 CSS 变量 |
| **响应式优先** | 使用 Tailwind 断点（sm/md/lg/xl），不用 px 媒体查询 |
| **可组合** | 通过 slot/snippet 支持内容投射 |
| **无副作用** | 纯展示组件不能直接调用 API，通过事件回调通知父组件 |

#### 6.2.3 样式一致性清单

- [ ] 所有卡片使用 `bg-bg-card rounded-[var(--radius)] shadow-[var(--shadow-sm)]`
- [ ] 所有主按钮使用 `bg-accent text-white rounded-[var(--radius)]`
- [ ] 所有表单输入使用统一的 border/focus 样式
- [ ] 所有状态色（成功/警告/危险/信息）使用令牌定义
- [ ] 所有过渡动画使用 `transition: var(--transition)`
- [ ] 所有页面入场使用 `.page-enter` 动画类

---

## 7. TypeScript 编码规范

### 7.1 严格模式

`tsconfig.json` 必须保持：
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### 7.2 类型定义规范

| 规则 | 说明 |
|------|------|
| 统一出口 | 所有公共类型通过 `src/lib/types/index.ts` re-export |
| 禁止 `any` | 用 `unknown` + 类型守卫替代 |
| 接口优于类型别名 | 定义对象结构用 `interface`，定义联合/元组用 `type` |
| 枚举用 `as const` | 用 `const` 对象 + `typeof` 替代 `enum` |
| 返回类型显式声明 | 公共函数必须声明返回类型 |

### 7.3 导入规范

```typescript
// ✅ 正确顺序
import type { ... } from '...'     // 1. 类型导入
import { ... } from 'external'     // 2. 外部库
import { ... } from '$lib/...'     // 3. 内部模块
import Component from './...'       // 4. 相对路径

// ❌ 禁止
import * as everything from '...'  // 禁止通配符导入
```

---

## 8. 数据库与数据访问规范

### 8.1 DAO 模式规范

| 规则 | 说明 |
|------|------|
| 每张表一个 DAO | 一个 `*-dao.ts` 文件对应一张表 |
| 方法命名统一 | `getById`, `getAll`, `create`, `update`, `delete` |
| SQL 参数化 | 所有 SQL 必须使用 `?` 参数占位符，禁止字符串拼接 |
| 事务封装 | 多表操作必须包裹在 `db.transaction()` 中 |
| 类型安全 | DAO 返回值必须有明确 TypeScript 类型 |

### 8.2 Migration 规范

| 规则 | 说明 |
|------|------|
| 文件名格式 | `NNN-描述.sql`（如 `003-add-report-table.sql`） |
| 只增不删 | 禁止修改已发布的 migration 文件 |
| 向后兼容 | 新增列必须有 DEFAULT 值或允许 NULL |

---

## 9. 测试策略

### 9.1 测试金字塔

```
        ╱╲
       ╱ E2E ╲           ← Playwright（关键用户流程）
      ╱────────╲
     ╱ 集成测试  ╲        ← API 端点 + DAO（含真实 SQLite）
    ╱──────────────╲
   ╱   单元测试     ╲     ← 纯函数、工具模块、类型守卫
  ╱──────────────────╲
```

### 9.2 测试文件位置

```
被测文件: src/lib/xxx/foo.ts
测试文件: src/lib/xxx/__test__/foo.test.ts
```

### 9.3 测试命名

```typescript
describe('模块名', () => {
  it('should 预期行为 when 条件', () => { ... })
})
```

---

## 10. 安全规范

| 层 | 安全措施 |
|----|----------|
| **Electron 主进程** | Context Isolation 开启、Node Integration 关闭、Preload 脚本验证 |
| **API 端点** | 输入校验、错误处理不泄露堆栈、文件大小限制 |
| **数据库** | SQL 参数化（已有）、路径遍历防护（已有 `path.basename`） |
| **AI 服务** | API Key 环境变量存储、响应内容消毒 |
| **文件上传** | 扩展名白名单、大小限制（10MB）、文件名消毒 |
| **依赖管理** | 定期 `npm audit`、锁定版本、SBOM 意识 |

---

## 11. Git 工作流与版本管理

### 11.1 分支模型

```
main        ← 生产就绪，受保护
  └── dev   ← 集成分支
       └── feat/xxx   ← 功能分支
       └── fix/xxx    ← 修复分支
       └── refactor/xxx ← 重构分支
```

### 11.2 Commit 规范 (Conventional Commits)

```
<type>(<scope>): <description>

type:     feat | fix | refactor | docs | chore | test | perf | style
scope:    ai | db | ui | resume | report | electron | api
```

### 11.3 版本号 (SemVer)

| 变更类型 | 版本号变化 | 示例 |
|----------|-----------|------|
| 破坏性变更 | MAJOR | 1.x.x → 2.0.0 |
| 新功能 | MINOR | 1.2.x → 1.3.0 |
| 修复/优化 | PATCH | 1.2.0 → 1.2.1 |

---

## 12. 文档与可维护性

### 12.1 文档结构

```
docs/
├── DEVELOPMENT-STRATEGY.md    ← 本文档（开发策略）
├── specs/                     ← 需求规格（IEEE 830）
│   └── v1.3.0-spec.md
├── architecture/              ← 架构决策记录 (ADR)
│   └── ADR-001-ai-strategy.md
└── ui-guidelines/             ← UI 组件规范与示例
```

### 12.2 代码注释规范

| 规则 | 说明 |
|------|------|
| 不注释"做了什么" | 代码本身应该表达"做了什么" |
| 只注释"为什么" | 解释非显而易见的业务逻辑或技术决策 |
| JSDoc 用于公共 API | 导出函数、接口必须有 JSDoc |
| TODO 格式 | `// TODO(负责人): 描述 [#issue]` |

---

## 13. 迭代开发检查清单

每次提交代码前，对照以下清单：

### 架构合规
- [ ] 遵循分层架构，无跨层/反向依赖
- [ ] 新增模块放置在正确的目录层级
- [ ] 新增设计模式在 PR 中有说明

### 代码质量
- [ ] TypeScript strict 无报错（`npm run check`）
- [ ] 无 `any` 类型
- [ ] 文件 ≤ 300 行，函数 ≤ 50 行
- [ ] 命名符合规范（kebab-case 文件，PascalCase 类型）
- [ ] 导入顺序正确

### UI 一致性
- [ ] 无硬编码颜色/字号（全部使用设计令牌）
- [ ] 新组件遵循组件分层规范
- [ ] 新组件 Props 有 TypeScript 类型

### 安全
- [ ] 用户输入已消毒
- [ ] SQL 使用参数化查询
- [ ] 文件操作有路径遍历防护

### 测试
- [ ] 新增业务逻辑有对应测试
- [ ] 测试文件在 `__test__/` 目录下

### 文档
- [ ] CHANGELOG.md 已更新
- [ ] 重大变更有 ADR 记录

---

## 参考资料

- [ISO/IEC 25010 — 软件产品质量模型](https://www.iso.org/standard/35733.html)
- [设计模式 — 菜鸟教程](https://www.runoob.com/design-pattern/design-pattern-intro.html)
- [OWASP Top 10 (2025)](https://owasp.org/www-project-top-ten/)
- [CISQ 代码质量标准](https://www.it-cisq.org/standards/code-quality-standards-maintainability/)
- [Tailwind CSS v4 最佳实践](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)
- [SvelteKit 架构模式](https://oestechnology.co.uk/posts/architectural-patterns-scaling-sveltekit)
- [Electron 高级架构](https://blog.logrocket.com/advanced-electron-js-architecture/)
- [Spec-Driven Development](https://thoughtworks.medium.com/spec-driven-development-d85995a81387)
- [软件开发最佳实践 2026](https://eluminoustechnologies.com/blog/software-development-best-practices/)
- [Svelte 5 设计模式](https://render.com/blog/svelte-design-patterns)
