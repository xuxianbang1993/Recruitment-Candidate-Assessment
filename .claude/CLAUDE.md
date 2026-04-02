# 智聘评估 — 项目级开发规范

## 强制规则
- **所有代码变更必须遵循** `docs/DEVELOPMENT-STRATEGY.md` 开发策略文档
- 提交前必须通过文档中的「迭代开发检查清单」

## 技术栈
- Svelte 5 + SvelteKit + TypeScript (strict)
- Tailwind CSS v4 (CSS-first @theme tokens)
- Electron (主/渲染进程分离)
- SQLite (better-sqlite3, WAL mode)
- AI: OpenAI / Claude / DeepSeek (策略模式)

## 架构
- 严格分层: Presentation → API → Service → DAO → Foundation
- 禁止跨层/反向依赖
- Server-only 代码在 `$lib/server/` 下

## 设计模式
- 已用: 策略模式(AI)、工厂模式(AI/Resume)、单例模式(DB)、模板方法(Parser)、DAO(数据访问)
- 新增模式须在 PR 中说明理由

## 代码标准
- 禁止 `any` 类型
- 函数职责单一，逻辑清晰（不限制行数）
- 命名: kebab-case(文件), PascalCase(类型/组件), camelCase(函数/变量)

## UI
- 所有样式参数只用 `app.css` 中的设计令牌，禁止硬编码颜色/字号
- 组件分层: ui/ (原子) | report/ (报告) | layout/ (布局)

## Git
- 分支: main ← dev ← feat|fix|refactor/xxx
- Commit: Conventional Commits 格式
- 版本: SemVer
