# v1.5.0 设计文档：简历信息库 (Resume Profiles)

> 日期: 2026-04-10
> 版本: v1.5.0
> 状态: 已批准

## 1. 背景与问题

当前系统的简历处理流程存在两个核心问题：

1. **PDF 文本提取质量差** — 使用 `pdf-parse`（pdfjs 薄封装），对中文简历的格式还原有限，导致提取出的原始文本质量不高
2. **无结构化数据层** — 上传简历后只存储原始文本 (`candidates.resume_text`)，没有字段级别的结构化解析。所有下游功能（评估、报告、对话）都直接消费原始文本，准确性完全依赖 AI 对杂乱文本的理解能力

## 2. 目标

- 新增**简历信息库**功能，对每份上传的简历进行 AI 结构化解析，精确识别每个字段
- 升级 PDF 文本提取引擎，提高中文简历的提取质量
- 所有下游功能（智能分析、AI 对话、匹配报告、二次评估）全面切换到结构化数据源
- 支持用户手动编辑 AI 解析结果，支持重新解析

## 3. 数据库设计

### 3.1 新增表 (migration 005)

#### resume_profiles (主表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| candidate_id | TEXT NOT NULL FK → candidates(id) ON DELETE CASCADE | 候选人 ID |
| job_id | TEXT NOT NULL FK → jobs(id) | 岗位 ID |
| job_title | TEXT | 冗余存储岗位名称 |
| name | TEXT | 姓名 |
| gender | TEXT | 性别 |
| birth_date | TEXT | 出生年月 |
| phone | TEXT | 电话 |
| email | TEXT | 邮箱 |
| city | TEXT | 所在城市 |
| highest_education | TEXT | 最高学历 |
| school | TEXT | 毕业院校 |
| major | TEXT | 专业 |
| work_years | INTEGER | 工作年限 |
| expected_salary | TEXT | 期望薪资 |
| skills | TEXT (JSON) | 技能清单 |
| certificates | TEXT (JSON) | 证书资质 |
| languages | TEXT (JSON) | 语言能力 |
| self_evaluation | TEXT | 自我评价 |
| raw_text | TEXT | 原始提取文本 |
| parse_status | TEXT | 'pending' / 'parsing' / 'completed' / 'failed' |
| parse_error | TEXT | 解析失败原因 |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

#### work_experiences (子表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| profile_id | TEXT FK → resume_profiles(id) ON DELETE CASCADE | |
| company | TEXT | 公司名称 |
| position | TEXT | 职位 |
| start_date | TEXT | 起始时间 |
| end_date | TEXT | 结束时间 |
| description | TEXT | 工作内容描述 |
| sort_order | INTEGER DEFAULT 0 | 排序 |

#### education_history (子表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| profile_id | TEXT FK → resume_profiles(id) ON DELETE CASCADE | |
| school | TEXT | 院校 |
| major | TEXT | 专业 |
| degree | TEXT | 学历 |
| start_date | TEXT | |
| end_date | TEXT | |
| sort_order | INTEGER DEFAULT 0 | |

#### project_experiences (子表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| profile_id | TEXT FK → resume_profiles(id) ON DELETE CASCADE | |
| project_name | TEXT | 项目名称 |
| role | TEXT | 角色 |
| start_date | TEXT | |
| end_date | TEXT | |
| description | TEXT | 项目描述 |
| sort_order | INTEGER DEFAULT 0 | |

### 3.2 数据生命周期

- `resume_profiles.candidate_id` 设置 `ON DELETE CASCADE`
- 子表通过 `profile_id` CASCADE 到 `resume_profiles`
- 删除候选人 → 自动删除 resume_profile → 自动删除所有子表记录
- 清空某岗位下所有候选人 → 对应的简历信息库数据全部清除

## 4. PDF 引擎升级

```
pdf-parse (当前) → unpdf (升级)
```

- unpdf: 2026 年推荐的现代 PDF 解析库
- TypeScript 原生，零额外系统依赖（适合 Electron 打包）
- 支持 `fast`（速度优先）和 `precise`（精度优先）两种策略
- 使用 `precise` 策略提取简历文本

## 5. 解析流程

### 5.1 自动解析（上传时）

```
上传简历 (.pdf/.docx/.txt)
    ↓
文本提取 (unpdf/mammoth/TextParser)
    ↓
创建 candidate + resume_profile (parse_status='parsing')
    ↓
调用 AI 结构化解析 (使用已配置的 AI 提供商)
    ↓
解析 AI 返回的 JSON → 写入 4 张表 + 同步 candidates 表
    ↓
parse_status = 'completed'
    ↓
前端更新
```

### 5.2 手动重新解析

```
用户点击「重新解析」
    ↓
从 resume_profiles.raw_text 取原始文本
    ↓
清空子表记录 → 重新调用 AI → 重新写入
    ↓
parse_status 更新
```

### 5.3 AI 解析 Prompt 要求

- 输入：原始简历文本
- 输出：严格 JSON schema（定义每个字段的类型和格式）
- 缺失字段返回 null，不推断不编造
- 日期统一格式 `YYYY-MM` 或 `YYYY`
- 保持原文信息完整性

## 6. UI 设计

### 6.1 侧边栏新增

```
工作台 (/)
简历管理 (/candidates)
简历信息库 (/resume-profiles)    ← 新增
岗位需求 (/assessment)
智能分析 (/assessment/results)
AI 对话 (/chat)
匹配报告 (/reports)
系统设置 (/settings)
```

### 6.2 简历信息库页面 (/resume-profiles)

**顶部：** 页面标题 + 总数统计 + 岗位筛选下拉

**卡片折叠态：** 姓名 | 性别 | 学历 | 工作年限 | 应聘岗位 | 解析状态标签 | 操作按钮

**卡片展开态：**
- 基础信息区（表单字段）
- 技能/证书/语言（标签形式）
- 工作经历（时间线形式）
- 教育经历（时间线形式）
- 项目经验（时间线形式）
- 自我评价（文本区）
- 每个区域支持编辑

**编辑模式：**
- 基础信息：表单输入框
- 工作/教育/项目经历：可增删改的列表
- 保存后更新 DB + 同步 candidates 表对应字段

## 7. 下游系统全面改造

所有 AI 功能的候选人数据源从 `candidates.resumeText` 全面切换到 `resume_profiles` 结构化数据。

| 功能 | 当前数据源 | 改造后数据源 |
|------|-----------|-------------|
| AI 评估 (evaluate) | candidate.resumeText | resume_profiles 全部结构化字段 |
| 智能分析 (results) | assessment.scores | assessment.scores (基于结构化 prompt) |
| AI 对话 (chat) | candidate.resumeText + DB | resume_profiles 结构化数据 |
| 匹配报告 (reports) | assessment + resumeText | assessment + resume_profiles |
| 二次评估 (re-evaluate) | resumeText + attachments | resume_profiles + attachments |

**前置条件：** 如果 `resume_profiles.parse_status !== 'completed'`，评估/报告/对话提示"请先完成简历解析"。

## 8. 技术约束

- 遵循五层架构: Presentation → API → Service → DAO → Foundation
- 所有样式使用 `app.css` 设计令牌，禁止硬编码颜色
- 新增 DAO: `resume-profile-dao.ts`, `work-experience-dao.ts`, `education-history-dao.ts`, `project-experience-dao.ts`
- 新增 Service: `resume-profile-service.ts`（封装 AI 解析 + DB 写入）
- 新增 API 路由: `/api/resume-profiles/`
- 新增页面: `/src/routes/resume-profiles/+page.svelte`
- TypeScript strict，禁止 any 类型
- Svelte 5 语法 ($state, $derived, $effect)
