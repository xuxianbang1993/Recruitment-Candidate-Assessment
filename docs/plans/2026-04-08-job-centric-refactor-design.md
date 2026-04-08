# 岗位中心化重构设计文档

> **版本**: v1.4.0
> **日期**: 2026-04-08
> **状态**: 已批准
> **范围**: 简历管理、智能分析、匹配报告三大模块

---

## 1. 背景与目标

### 1.1 当前问题

- `candidates` 和 `jobs` 表完全独立，仅在 `assessments` 中通过双外键关联
- 简历上传无岗位概念，所有候选人平铺展示
- 智能分析对所有候选人批量评估，未按岗位区分
- 匹配报告以候选人为入口，缺少岗位维度

### 1.2 目标流程

```
岗位需求（创建岗位）
    └── 简历管理（选岗位 → 上传简历到该岗位）
         └── 智能分析（按岗位筛选候选人 → 评估）
              └── 匹配报告（岗位 → 候选人 → 报告）
```

### 1.3 设计决策

| 决策点 | 结论 | 理由 |
|--------|------|------|
| 候选人-岗位关系 | 一对一 | 业务需求明确 |
| 实现方式 | candidates 加 job_id FK | 简单直接，符合 YAGNI |
| 旧数据处理 | 清空重来 | 系统早期，无生产数据 |
| position 字段 | 移除 | 岗位信息改从关联的 jobs.title 获取 |

---

## 2. 数据模型变更

### 2.1 Migration: `004-add-candidate-job-id.sql`

```sql
ALTER TABLE candidates ADD COLUMN job_id TEXT NOT NULL DEFAULT '' REFERENCES jobs(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_candidates_job ON candidates(job_id);
```

注: 同时在 DAO 层移除对 `position` 字段的读写。`position` 列保留在数据库中(SQLite 不支持 DROP COLUMN 的旧版本)，但代码层面不再使用。

### 2.2 类型变更

```typescript
// src/lib/types/candidate.ts
export interface Candidate {
  id: string
  jobId: string        // 新增
  name: string
  phone: string
  email: string
  resumeText: string
  skills: string[]
  experience: number
  education: string
  createdAt: string
}
```

### 2.3 DAO 变更

CandidateDAO 新增/修改:
- `getByJobId(jobId: string): Candidate[]`
- `create()` 参数新增 jobId
- `search()` 支持 jobId 参数筛选

### 2.4 级联删除链

```
删除岗位 → CASCADE 删除候选人 → CASCADE 删除评估 → CASCADE 删除附件
```

---

## 3. 简历管理页面重构

### 3.1 页面结构

```
[页面头部: 标题 + 候选人计数]
[岗位选择下拉框]  ← 新增
[简历上传区域]    ← 携带当前 jobId
[搜索栏]          ← 在当前岗位范围内搜索
[候选人卡片列表]  ← 只显示当前岗位的候选人
```

### 3.2 交互逻辑

1. 页面加载 → 获取岗位列表 → 默认选中第一个
2. 切换岗位 → 刷新候选人列表 + 统计
3. 上传简历 → 携带 jobId → 后端关联
4. 无岗位 → 空状态提示 + 上传区禁用
5. 搜索 → 当前岗位范围内

### 3.3 组件变更

- `ResumeUploader.svelte`: 新增 `jobId` prop
- `CandidateCard.svelte`: 移除 position 显示
- API `POST /api/resume/upload`: body 新增 jobId
- API `GET /api/candidates`: 新增 `?jobId=xxx` 参数

---

## 4. 智能分析页面重构

### 4.1 变更点

1. 获取候选人改为 `GET /api/candidates?jobId=xxx`
2. 批量评估只对当前岗位下的候选人
3. 切换岗位时刷新候选人和评估结果
4. 页面结构和现有组件基本不变

---

## 5. 匹配报告页面重构

### 5.1 三级联动

```
[选择岗位 ▼] → [选择候选人 ▼] → [选择评估记录 ▼] → [生成报告]
```

1. 选岗位 → 加载该岗位下候选人
2. 选候选人 → 加载评估记录
3. 选评估 → 生成报告

### 5.2 变更点

- 新增岗位下拉选择器（第一级）
- 候选人下拉改为联动（第二级）
- 评估记录和报告生成逻辑不变

---

## 6. 影响范围汇总

### 6.1 新增文件

| 文件 | 说明 |
|------|------|
| `migrations/004-add-candidate-job-id.sql` | 数据库迁移 |

### 6.2 修改文件

| 层 | 文件 | 变更 |
|----|------|------|
| Foundation | `src/lib/types/candidate.ts` | 加 jobId，移除 position |
| Foundation | `src/lib/types/index.ts` | 确保 re-export 正确 |
| DAO | `src/lib/server/db/candidate-dao.ts` | 加 getByJobId，改 create/search |
| API | `src/routes/api/candidates/+server.ts` | 支持 jobId 查询参数 |
| API | `src/routes/api/resume/upload/+server.ts` | 接收 jobId |
| Page | `src/routes/candidates/+page.svelte` | 加岗位选择器 |
| Page | `src/routes/assessment/results/+page.svelte` | 候选人按岗位筛选 |
| Page | `src/routes/reports/+page.svelte` | 三级联动 |
| Component | `src/lib/components/ResumeUploader.svelte` | 加 jobId prop |
| Component | `src/lib/components/CandidateCard.svelte` | 移除 position |

---

## 7. 设计模式应用

| 模式 | 应用 |
|------|------|
| DAO 模式 | CandidateDAO 新增 getByJobId 方法 |
| 观察者模式 | Svelte 5 $derived 响应岗位切换联动 |

无需引入新的设计模式，利用已有模式和框架能力即可。
