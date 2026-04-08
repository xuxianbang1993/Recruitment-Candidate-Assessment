# Checkpoint: 2026-04-08

> **分支:** feat/v1.4.0-job-centric-refactor
> **基于:** main (569f2f8)
> **状态:** 待合并到 main

---

## 本次迭代完成内容

### 1. 岗位中心化重构 (95ff43e)

**核心变更：** candidates 表新增 `job_id` 外键，候选人与岗位一对一绑定。

| 模块 | 变更内容 |
|------|----------|
| **数据库** | migration 004: candidates 加 job_id FK, ON DELETE CASCADE |
| **类型** | Candidate 接口: `position` -> `jobId` |
| **DAO** | CandidateDAO: 新增 `getByJobId()`, search 支持 jobId 筛选 |
| **API** | GET /api/candidates?jobId=xxx, POST /api/resume/upload 需 jobId |
| **简历管理** | 页面顶部新增岗位下拉选择器，按岗位筛选候选人 |
| **智能分析** | 只评估当前岗位下的候选人 |
| **匹配报告** | 岗位 -> 候选人 -> 评估记录 三级联动 |
| **组件** | ResumeUploader 新增 jobId prop, CandidateCard 移除 position 显示 |
| **AI 提示词** | prompts.ts 用 job.title 替代 candidate.position |
| **测试** | dao-test.ts, prompts.test.ts 适配新 schema |

**影响文件：** 17 个文件，289 行新增，124 行删除

### 2. AI 对话功能增强 (a7078fa)

**核心变更：** AI 聊天注入数据库全量上下文 + Markdown 渲染。

| 模块 | 变更内容 |
|------|----------|
| **新增** chat-context.ts | 聚合岗位/候选人/评估数据构建 system prompt |
| **API** | /api/ai/chat 注入 system prompt 到消息头部 |
| **ChatBubble** | assistant 消息用 marked + DOMPurify 渲染 markdown |
| **CSS** | .chat-prose 样式（表格/列表/代码块/标题/引用） |

**影响文件：** 4 个文件，236 行新增

---

## 数据库变更

```sql
-- migration 004
ALTER TABLE candidates ADD COLUMN job_id TEXT NOT NULL DEFAULT '' REFERENCES jobs(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_candidates_job ON candidates(job_id);
```

**注意：** 旧数据库已清空（v1.4.0 不兼容旧数据，需删除 recruitment.db 重新运行）

---

## 设计模式

- **DAO 模式** — CandidateDAO.getByJobId() 新增
- **观察者模式** — Svelte 5 $derived 响应岗位切换联动
- **建造者模式** — chat-context.ts 逐步构建 system prompt

---

## 待办 / 后续方向

- [ ] 合并 feat/v1.4.0-job-centric-refactor 到 main
- [ ] bump version 到 1.4.0
- [ ] 更新 README.md changelog
- [ ] 考虑 AI 对话的流式响应（streaming）
- [ ] 考虑候选人详情编辑功能（姓名、技能、学历等）
- [ ] 岗位需求页面样式统一到设计令牌（部分硬编码颜色待修复）

---

## 验证状态

- [x] TypeScript check: 0 errors, 0 warnings
- [x] 所有页面 HTTP 200
- [x] API 端点功能正确
- [x] UI 截图确认
