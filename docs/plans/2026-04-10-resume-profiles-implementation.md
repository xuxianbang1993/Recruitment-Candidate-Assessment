# v1.5.0 简历信息库 — 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增简历信息库功能——AI 结构化解析简历 + 独立数据库表组 + 独立页面 + 全面替换下游数据源

**Architecture:** 在现有五层架构基础上，新增 Foundation 层类型定义、4 张 DAO 表、Service 层解析服务（责任链模式）、API 路由、Presentation 层页面和组件。PDF 引擎从 pdf-parse 升级为 unpdf。

**Tech Stack:** Svelte 5 (Runes), SvelteKit, TypeScript strict, SQLite (better-sqlite3), unpdf, Tailwind CSS v4, 设计令牌

**设计模式引入说明：**
| 新增模式 | 分类 | 解决的问题 | 参考开发策略 4.2 |
|----------|------|-----------|-----------------|
| 责任链 (Chain of Responsibility) | 行为型 | 简历预处理管道：提取→清洗→AI解析→存储 | ✅ 策略大纲明确推荐 |
| 建造者 (Builder) | 创建型 | 从结构化 profile 数据组装 AI prompt | ✅ 策略大纲明确推荐 |

**开发策略合规检查清单 (每个 Task 完成后对照)：**
- [ ] 分层架构：无跨层/反向依赖
- [ ] 新模块在正确目录层级
- [ ] TypeScript strict 无报错
- [ ] 无 `any` 类型
- [ ] 命名规范：kebab-case 文件、PascalCase 类型、camelCase 函数、UPPER_SNAKE_CASE 常量
- [ ] 导入顺序：类型 → 外部库 → 内部模块 → 相对路径
- [ ] UI 无硬编码颜色/字号
- [ ] SQL 参数化查询
- [ ] 公共函数有 JSDoc + 显式返回类型
- [ ] 多表操作用事务包裹

---

## Task 1: Foundation 层 — 类型定义

**层级:** Foundation (`src/lib/types/`)
**设计模式:** 无（纯类型定义）

**Files:**
- Create: `src/lib/types/resume-profile.ts`
- Modify: `src/lib/types/index.ts`

**Step 1: 创建类型定义文件**

```typescript
// src/lib/types/resume-profile.ts

/** 简历解析状态 */
export const PARSE_STATUS = {
  PENDING: 'pending',
  PARSING: 'parsing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type ParseStatus = typeof PARSE_STATUS[keyof typeof PARSE_STATUS];

/** 语言能力 */
export interface LanguageSkill {
  language: string;
  level: string;
}

/** 工作经历 */
export interface WorkExperience {
  id: string;
  profileId: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  sortOrder: number;
}

/** 教育经历 */
export interface EducationRecord {
  id: string;
  profileId: string;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
}

/** 项目经验 */
export interface ProjectExperience {
  id: string;
  profileId: string;
  projectName: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  sortOrder: number;
}

/** 简历信息主体 */
export interface ResumeProfile {
  id: string;
  candidateId: string;
  jobId: string;
  jobTitle: string;
  name: string;
  gender: string;
  birthDate: string;
  phone: string;
  email: string;
  city: string;
  highestEducation: string;
  school: string;
  major: string;
  workYears: number;
  expectedSalary: string;
  skills: string[];
  certificates: string[];
  languages: LanguageSkill[];
  selfEvaluation: string;
  rawText: string;
  parseStatus: ParseStatus;
  parseError: string;
  createdAt: string;
  updatedAt: string;
}

/** AI 解析返回的结构化数据（不含 id/profileId/sortOrder） */
export interface ParsedResumeData {
  name: string | null;
  gender: string | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  highestEducation: string | null;
  school: string | null;
  major: string | null;
  workYears: number | null;
  expectedSalary: string | null;
  skills: string[];
  certificates: string[];
  languages: LanguageSkill[];
  selfEvaluation: string | null;
  workExperiences: Omit<WorkExperience, 'id' | 'profileId' | 'sortOrder'>[];
  educationHistory: Omit<EducationRecord, 'id' | 'profileId' | 'sortOrder'>[];
  projectExperiences: Omit<ProjectExperience, 'id' | 'profileId' | 'sortOrder'>[];
}

/** 带子表的完整 Resume Profile */
export interface ResumeProfileFull extends ResumeProfile {
  workExperiences: WorkExperience[];
  educationHistory: EducationRecord[];
  projectExperiences: ProjectExperience[];
}
```

**Step 2: 更新 types barrel export**

在 `src/lib/types/index.ts` 末尾追加：
```typescript
export type {
  ResumeProfile,
  ResumeProfileFull,
  ParsedResumeData,
  WorkExperience,
  EducationRecord,
  ProjectExperience,
  LanguageSkill,
  ParseStatus,
} from './resume-profile'
export { PARSE_STATUS } from './resume-profile'
```

**Step 3: 运行 svelte-check 确认类型无误**

Run: `npx svelte-check --tsconfig ./tsconfig.json`
Expected: 0 errors

**Step 4: Commit**

```bash
git add src/lib/types/resume-profile.ts src/lib/types/index.ts
git commit -m "feat(types): add resume profile type definitions for v1.5.0"
```

---

## Task 2: Foundation 层 — 数据库 Migration

**层级:** Data Access (`src/lib/server/db/migrations/`)
**设计模式:** Migration 规范（只增不删，向后兼容）

**Files:**
- Create: `src/lib/server/db/migrations/006-add-resume-profiles.sql`

**Step 1: 创建 migration 文件**

```sql
-- 006-add-resume-profiles.sql
-- v1.5.0: 简历信息库 — 结构化简历数据存储

-- 主表：简历信息
CREATE TABLE IF NOT EXISTS resume_profiles (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  job_title TEXT DEFAULT '',
  name TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  birth_date TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  city TEXT DEFAULT '',
  highest_education TEXT DEFAULT '',
  school TEXT DEFAULT '',
  major TEXT DEFAULT '',
  work_years INTEGER DEFAULT 0,
  expected_salary TEXT DEFAULT '',
  skills TEXT DEFAULT '[]',
  certificates TEXT DEFAULT '[]',
  languages TEXT DEFAULT '[]',
  self_evaluation TEXT DEFAULT '',
  raw_text TEXT DEFAULT '',
  parse_status TEXT DEFAULT 'pending',
  parse_error TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_resume_profiles_candidate_id ON resume_profiles(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resume_profiles_job_id ON resume_profiles(job_id);

-- 子表：工作经历
CREATE TABLE IF NOT EXISTS work_experiences (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  company TEXT DEFAULT '',
  position TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES resume_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_work_experiences_profile_id ON work_experiences(profile_id);

-- 子表：教育经历
CREATE TABLE IF NOT EXISTS education_history (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  school TEXT DEFAULT '',
  major TEXT DEFAULT '',
  degree TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES resume_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_education_history_profile_id ON education_history(profile_id);

-- 子表：项目经验
CREATE TABLE IF NOT EXISTS project_experiences (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  project_name TEXT DEFAULT '',
  role TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES resume_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_experiences_profile_id ON project_experiences(profile_id);
```

**Step 2: Commit**

```bash
git add src/lib/server/db/migrations/006-add-resume-profiles.sql
git commit -m "feat(db): add migration 006 for resume profiles tables"
```

---

## Task 3: Data Access 层 — 4 个 DAO

**层级:** Data Access (`src/lib/server/db/`)
**设计模式:** DAO (数据访问对象)
**开发策略规范:** 每张表一个 DAO，方法命名统一 (getById/getAll/create/update/delete)，SQL 参数化，事务封装

**Files:**
- Create: `src/lib/server/db/resume-profile-dao.ts`
- Create: `src/lib/server/db/work-experience-dao.ts`
- Create: `src/lib/server/db/education-history-dao.ts`
- Create: `src/lib/server/db/project-experience-dao.ts`
- Modify: `src/lib/server/db/index.ts` — 追加 4 个 DAO export

**开发约束：**
- 参照 `candidate-dao.ts` 的 Row-to-Entity 转换模式 (snake_case → camelCase)
- 所有 JSON 字段 (skills, certificates, languages) 使用 `JSON.parse`/`JSON.stringify` 安全处理
- `resume-profile-dao.ts` 提供 `getFullById(id)` 方法，一次查询主表 + 3 个子表，返回 `ResumeProfileFull`
- `resume-profile-dao.ts` 提供 `getByCandidateId(candidateId)` 方法
- `resume-profile-dao.ts` 提供 `getByJobId(jobId)` 方法
- `resume-profile-dao.ts` 提供 `deleteByCandidateId(candidateId)` 方法（CASCADE 会自动清理子表）
- 3 个子表 DAO 提供 `getByProfileId(profileId)` 和 `deleteByProfileId(profileId)` 方法
- 3 个子表 DAO 提供 `batchCreate(profileId, items[])` 方法，用于批量插入解析结果
- 所有 DAO 必须导出 class + singleton instance（如 `export const resumeProfileDAO = new ResumeProfileDAO()`）

**Row 接口定义（在各自 DAO 文件内部定义，不导出）：**

```typescript
// resume-profile-dao.ts 内部
interface ResumeProfileRow {
  id: string;
  candidate_id: string;
  job_id: string;
  job_title: string | null;
  name: string | null;
  gender: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  highest_education: string | null;
  school: string | null;
  major: string | null;
  work_years: number;
  expected_salary: string | null;
  skills: string | null;       // JSON
  certificates: string | null; // JSON
  languages: string | null;    // JSON
  self_evaluation: string | null;
  raw_text: string | null;
  parse_status: string;
  parse_error: string | null;
  created_at: string;
  updated_at: string;
}
```

**Step 1:** 实现 4 个 DAO 文件，严格遵循 candidate-dao.ts 的模式
**Step 2:** 更新 `src/lib/server/db/index.ts` 追加导出
**Step 3:** Run: `npx svelte-check`，Expected: 0 errors
**Step 4:** Commit

```bash
git add src/lib/server/db/resume-profile-dao.ts \
        src/lib/server/db/work-experience-dao.ts \
        src/lib/server/db/education-history-dao.ts \
        src/lib/server/db/project-experience-dao.ts \
        src/lib/server/db/index.ts
git commit -m "feat(db): add 4 DAOs for resume profiles (profile, work, education, project)"
```

---

## Task 4: Service 层 — PDF 引擎升级 (pdf-parse → unpdf)

**层级:** Service (`src/lib/server/services/resume/`)
**设计模式:** 策略模式 (ResumeParser 接口不变，只替换 PDF 实现)

**Files:**
- Modify: `package.json` — 移除 pdf-parse，添加 unpdf
- Modify: `src/lib/server/services/resume/pdf-parser.ts` — 使用 unpdf 替换 pdf-parse

**Step 1: 安装 unpdf，卸载 pdf-parse**

Run: `npm uninstall pdf-parse && npm install unpdf`

**Step 2: 重写 pdf-parser.ts**

```typescript
// src/lib/server/services/resume/pdf-parser.ts
import { extractText } from 'unpdf';
import type { ResumeParser, ParsedResume } from './resume-parser';
import { truncateResumeText } from './resume-parser';

/**
 * PDF 简历解析器 — 使用 unpdf (pdfjs 现代封装) 提取文本
 * @implements {ResumeParser}
 */
export class PdfResumeParser implements ResumeParser {
  readonly supportedExtensions = ['.pdf'];

  async parse(buffer: Buffer, filename: string): Promise<ParsedResume> {
    const { text, totalPages } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });

    const extractedText = typeof text === 'string' ? text : (text as string[]).join('\n');

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('PDF 文件内容为空或无法提取文本（可能是扫描件或加密文件）');
    }

    return {
      text: truncateResumeText(extractedText.trim()),
      metadata: {
        filename,
        fileType: 'pdf',
        pageCount: totalPages,
        fileSize: buffer.length,
      },
    };
  }
}
```

**注意：** `unpdf` 的 `extractText` API 返回 `{ text, totalPages }`。`text` 当 `mergePages: true` 时为 string，否则为 string[]。需要处理两种情况确保类型安全。

**Step 3:** Run: `npx svelte-check`，Expected: 0 errors
**Step 4:** Commit

```bash
git add package.json package-lock.json src/lib/server/services/resume/pdf-parser.ts
git commit -m "feat(resume): upgrade PDF engine from pdf-parse to unpdf for better CJK support"
```

---

## Task 5: Service 层 — AI 简历解析服务 (责任链模式)

**层级:** Service (`src/lib/server/services/resume/`)
**设计模式:** 责任链 (Chain of Responsibility) — 简历预处理管道
**开发策略参考:** 4.2 "简历预处理管道（清洗→提取→格式化）"

**Files:**
- Create: `src/lib/server/services/resume/resume-parse-chain.ts` — 责任链定义
- Create: `src/lib/server/services/resume/resume-profile-service.ts` — 编排服务

**Step 1: 创建责任链处理器**

```typescript
// src/lib/server/services/resume/resume-parse-chain.ts

import type { ParsedResumeData } from '$lib/types';

/**
 * 责任链处理器接口 — 简历预处理管道的每个环节
 * 设计模式: Chain of Responsibility (行为型)
 * 解决问题: 简历从原始文本到结构化数据需要经过多个处理步骤，
 *          每个步骤职责单一、可独立替换、可自由组合顺序
 */
export interface ResumeParseHandler {
  /** 处理器名称，用于日志和错误追踪 */
  readonly name: string;
  /** 设置下一个处理器 */
  setNext(handler: ResumeParseHandler): ResumeParseHandler;
  /** 处理简历文本，返回结构化数据 */
  handle(context: ResumeParseContext): Promise<ResumeParseContext>;
}

/** 责任链上下文 — 在处理器之间传递的数据包 */
export interface ResumeParseContext {
  /** 原始提取文本 */
  rawText: string;
  /** 清洗后的文本 */
  cleanedText: string;
  /** AI 解析结果 */
  parsedData: ParsedResumeData | null;
  /** 处理过程中的错误 */
  error: string | null;
}

/**
 * 抽象基处理器 — 实现责任链传递逻辑
 */
export abstract class BaseParseHandler implements ResumeParseHandler {
  abstract readonly name: string;
  private nextHandler: ResumeParseHandler | null = null;

  setNext(handler: ResumeParseHandler): ResumeParseHandler {
    this.nextHandler = handler;
    return handler;
  }

  async handle(context: ResumeParseContext): Promise<ResumeParseContext> {
    if (context.error) return context; // 短路：前一步出错则跳过
    const result = await this.process(context);
    if (this.nextHandler) {
      return this.nextHandler.handle(result);
    }
    return result;
  }

  /** 子类实现具体处理逻辑 */
  protected abstract process(context: ResumeParseContext): Promise<ResumeParseContext>;
}

/**
 * 处理器 1: 文本清洗 — 去除多余空白、特殊字符、格式噪声
 */
export class TextCleanHandler extends BaseParseHandler {
  readonly name = 'TextClean';

  protected async process(context: ResumeParseContext): Promise<ResumeParseContext> {
    let text = context.rawText;

    // 统一换行符
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // 合并连续空行为单个空行
    text = text.replace(/\n{3,}/g, '\n\n');
    // 去除行首尾多余空格（保留缩进结构）
    text = text.split('\n').map(line => line.trimEnd()).join('\n');
    // 去除 Unicode 控制字符（保留常见空白）
    text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

    return { ...context, cleanedText: text.trim() };
  }
}

/**
 * 处理器 2: AI 结构化解析 — 调用 AI 提供商解析简历为 JSON
 * 依赖注入: AI 策略通过构造函数传入
 */
export class AIParseHandler extends BaseParseHandler {
  readonly name = 'AIParse';

  constructor(
    private readonly aiChat: (messages: Array<{ role: string; content: string }>) => Promise<string>
  ) {
    super();
  }

  protected async process(context: ResumeParseContext): Promise<ResumeParseContext> {
    try {
      const prompt = this.buildParsePrompt(context.cleanedText);
      const response = await this.aiChat([{ role: 'user', content: prompt }]);
      const parsedData = this.extractJSON(response);
      return { ...context, parsedData };
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知 AI 解析错误';
      return { ...context, error: `AI 解析失败: ${message}` };
    }
  }

  /** 构建 AI 解析 prompt — 要求严格 JSON 输出 */
  private buildParsePrompt(text: string): string {
    return `你是一个专业的简历信息提取助手。请从以下简历文本中精确提取结构化信息。

## 要求
1. 严格按照指定 JSON Schema 输出，不要添加额外字段
2. 无法从简历中确定的字段，值设为 null（字符串字段）或空数组（数组字段）
3. 不要推测或编造信息，只提取简历中明确提到的内容
4. 日期格式统一为 "YYYY-MM"（如 "2023-06"），只有年份则用 "YYYY"（如 "2023"）
5. 工作年限 (workYears) 如果简历未明确写出，根据最早工作经历到现在计算，无法判断则为 null
6. 工作经历、教育经历、项目经验按时间倒序排列（最近的在前）
7. 技能、证书列为字符串数组

## 输出 JSON Schema
\`\`\`json
{
  "name": "string | null",
  "gender": "string | null",
  "birthDate": "string | null",
  "phone": "string | null",
  "email": "string | null",
  "city": "string | null",
  "highestEducation": "string | null",
  "school": "string | null",
  "major": "string | null",
  "workYears": "number | null",
  "expectedSalary": "string | null",
  "skills": ["string"],
  "certificates": ["string"],
  "languages": [{"language": "string", "level": "string"}],
  "selfEvaluation": "string | null",
  "workExperiences": [
    {
      "company": "string",
      "position": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string"
    }
  ],
  "educationHistory": [
    {
      "school": "string",
      "major": "string",
      "degree": "string",
      "startDate": "string",
      "endDate": "string"
    }
  ],
  "projectExperiences": [
    {
      "projectName": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string"
    }
  ]
}
\`\`\`

## 简历文本
${text}

请直接输出 JSON，不要添加任何解释文字或 markdown 代码块标记。`;
  }

  /** 从 AI 响应中提取 JSON — 处理可能的 markdown 代码块包裹 */
  private extractJSON(response: string): ParsedResumeData {
    let jsonStr = response.trim();

    // 去除 markdown 代码块包裹
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch?.[1]) {
      jsonStr = codeBlockMatch[1].trim();
    }

    const parsed: unknown = JSON.parse(jsonStr);
    return this.validateParsedData(parsed);
  }

  /** 类型守卫 — 确保 AI 返回数据符合 ParsedResumeData schema */
  private validateParsedData(data: unknown): ParsedResumeData {
    if (typeof data !== 'object' || data === null) {
      throw new Error('AI 返回数据不是有效的 JSON 对象');
    }

    const obj = data as Record<string, unknown>;

    return {
      name: typeof obj.name === 'string' ? obj.name : null,
      gender: typeof obj.gender === 'string' ? obj.gender : null,
      birthDate: typeof obj.birthDate === 'string' ? obj.birthDate : null,
      phone: typeof obj.phone === 'string' ? obj.phone : null,
      email: typeof obj.email === 'string' ? obj.email : null,
      city: typeof obj.city === 'string' ? obj.city : null,
      highestEducation: typeof obj.highestEducation === 'string' ? obj.highestEducation : null,
      school: typeof obj.school === 'string' ? obj.school : null,
      major: typeof obj.major === 'string' ? obj.major : null,
      workYears: typeof obj.workYears === 'number' ? obj.workYears : null,
      expectedSalary: typeof obj.expectedSalary === 'string' ? obj.expectedSalary : null,
      skills: Array.isArray(obj.skills) ? obj.skills.filter((s): s is string => typeof s === 'string') : [],
      certificates: Array.isArray(obj.certificates) ? obj.certificates.filter((s): s is string => typeof s === 'string') : [],
      languages: Array.isArray(obj.languages)
        ? obj.languages.filter((l): l is { language: string; level: string } =>
            typeof l === 'object' && l !== null && typeof (l as Record<string, unknown>).language === 'string' && typeof (l as Record<string, unknown>).level === 'string')
        : [],
      selfEvaluation: typeof obj.selfEvaluation === 'string' ? obj.selfEvaluation : null,
      workExperiences: Array.isArray(obj.workExperiences)
        ? obj.workExperiences.map((w: Record<string, unknown>) => ({
            company: String(w.company ?? ''),
            position: String(w.position ?? ''),
            startDate: String(w.startDate ?? ''),
            endDate: String(w.endDate ?? ''),
            description: String(w.description ?? ''),
          }))
        : [],
      educationHistory: Array.isArray(obj.educationHistory)
        ? obj.educationHistory.map((e: Record<string, unknown>) => ({
            school: String(e.school ?? ''),
            major: String(e.major ?? ''),
            degree: String(e.degree ?? ''),
            startDate: String(e.startDate ?? ''),
            endDate: String(e.endDate ?? ''),
          }))
        : [],
      projectExperiences: Array.isArray(obj.projectExperiences)
        ? obj.projectExperiences.map((p: Record<string, unknown>) => ({
            projectName: String(p.projectName ?? ''),
            role: String(p.role ?? ''),
            startDate: String(p.startDate ?? ''),
            endDate: String(p.endDate ?? ''),
            description: String(p.description ?? ''),
          }))
        : [],
    };
  }
}

/**
 * 构建并执行责任链管道
 * @param rawText 原始简历文本
 * @param aiChat AI 对话函数 (依赖注入)
 * @returns 处理后的上下文，包含结构化数据或错误
 */
export function buildParseChain(
  aiChat: (messages: Array<{ role: string; content: string }>) => Promise<string>
): { execute: (rawText: string) => Promise<ResumeParseContext> } {
  const textClean = new TextCleanHandler();
  const aiParse = new AIParseHandler(aiChat);

  // 责任链: 清洗 → AI 解析
  textClean.setNext(aiParse);

  return {
    execute: (rawText: string) =>
      textClean.handle({
        rawText,
        cleanedText: '',
        parsedData: null,
        error: null,
      }),
  };
}
```

**Step 2: 创建简历 Profile 编排服务**

```typescript
// src/lib/server/services/resume/resume-profile-service.ts

import { randomUUID } from 'node:crypto';
import type { ParsedResumeData, ResumeProfileFull } from '$lib/types';
import { PARSE_STATUS } from '$lib/types';
import { getDatabase } from '$lib/server/db/database';
import { resumeProfileDAO } from '$lib/server/db/resume-profile-dao';
import { workExperienceDAO } from '$lib/server/db/work-experience-dao';
import { educationHistoryDAO } from '$lib/server/db/education-history-dao';
import { projectExperienceDAO } from '$lib/server/db/project-experience-dao';
import { candidateDAO } from '$lib/server/db/candidate-dao';
import { buildParseChain } from './resume-parse-chain';

/**
 * 简历 Profile 服务 — 编排 AI 解析 + 数据库写入
 *
 * 职责:
 * 1. 创建初始 profile 记录 (parse_status='parsing')
 * 2. 调用责任链管道进行 AI 解析
 * 3. 事务写入主表 + 3 个子表
 * 4. 同步更新 candidates 表关键字段
 */

/** 创建 profile 并触发 AI 解析 */
export async function createAndParseProfile(params: {
  candidateId: string;
  jobId: string;
  jobTitle: string;
  rawText: string;
  aiChat: (messages: Array<{ role: string; content: string }>) => Promise<string>;
}): Promise<ResumeProfileFull> {
  const { candidateId, jobId, jobTitle, rawText, aiChat } = params;

  // 创建初始记录 (status=parsing)
  const profileId = randomUUID();
  resumeProfileDAO.create({
    id: profileId,
    candidateId,
    jobId,
    jobTitle,
    rawText,
    parseStatus: PARSE_STATUS.PARSING,
  });

  try {
    // 执行责任链管道
    const chain = buildParseChain(aiChat);
    const result = await chain.execute(rawText);

    if (result.error || !result.parsedData) {
      resumeProfileDAO.update(profileId, {
        parseStatus: PARSE_STATUS.FAILED,
        parseError: result.error ?? '解析结果为空',
      });
      return resumeProfileDAO.getFullById(profileId)!;
    }

    // 事务写入: 主表更新 + 子表批量插入 + candidates 同步
    saveParseResult(profileId, candidateId, result.parsedData);

    return resumeProfileDAO.getFullById(profileId)!;
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    resumeProfileDAO.update(profileId, {
      parseStatus: PARSE_STATUS.FAILED,
      parseError: message,
    });
    return resumeProfileDAO.getFullById(profileId)!;
  }
}

/** 重新解析已有 profile */
export async function reparseProfile(
  profileId: string,
  aiChat: (messages: Array<{ role: string; content: string }>) => Promise<string>
): Promise<ResumeProfileFull> {
  const profile = resumeProfileDAO.getById(profileId);
  if (!profile) throw new Error(`Profile ${profileId} 不存在`);

  // 标记为解析中
  resumeProfileDAO.update(profileId, {
    parseStatus: PARSE_STATUS.PARSING,
    parseError: '',
  });

  try {
    const chain = buildParseChain(aiChat);
    const result = await chain.execute(profile.rawText);

    if (result.error || !result.parsedData) {
      resumeProfileDAO.update(profileId, {
        parseStatus: PARSE_STATUS.FAILED,
        parseError: result.error ?? '解析结果为空',
      });
      return resumeProfileDAO.getFullById(profileId)!;
    }

    // 清空旧子表数据 + 写入新数据
    const db = getDatabase();
    db.transaction(() => {
      workExperienceDAO.deleteByProfileId(profileId);
      educationHistoryDAO.deleteByProfileId(profileId);
      projectExperienceDAO.deleteByProfileId(profileId);
      saveParseResult(profileId, profile.candidateId, result.parsedData!);
    })();

    return resumeProfileDAO.getFullById(profileId)!;
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    resumeProfileDAO.update(profileId, {
      parseStatus: PARSE_STATUS.FAILED,
      parseError: message,
    });
    return resumeProfileDAO.getFullById(profileId)!;
  }
}

/**
 * 事务写入解析结果
 * - 更新 resume_profiles 主表字段
 * - 批量插入 3 个子表
 * - 同步 candidates 表关键字段
 */
function saveParseResult(
  profileId: string,
  candidateId: string,
  data: ParsedResumeData
): void {
  const db = getDatabase();

  db.transaction(() => {
    // 1. 更新主表
    resumeProfileDAO.update(profileId, {
      name: data.name ?? '',
      gender: data.gender ?? '',
      birthDate: data.birthDate ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      city: data.city ?? '',
      highestEducation: data.highestEducation ?? '',
      school: data.school ?? '',
      major: data.major ?? '',
      workYears: data.workYears ?? 0,
      expectedSalary: data.expectedSalary ?? '',
      skills: data.skills,
      certificates: data.certificates,
      languages: data.languages,
      selfEvaluation: data.selfEvaluation ?? '',
      parseStatus: PARSE_STATUS.COMPLETED,
      parseError: '',
    });

    // 2. 批量插入子表
    if (data.workExperiences.length > 0) {
      workExperienceDAO.batchCreate(profileId, data.workExperiences);
    }
    if (data.educationHistory.length > 0) {
      educationHistoryDAO.batchCreate(profileId, data.educationHistory);
    }
    if (data.projectExperiences.length > 0) {
      projectExperienceDAO.batchCreate(profileId, data.projectExperiences);
    }

    // 3. 同步 candidates 表
    candidateDAO.update(candidateId, {
      name: data.name ?? undefined,
      phone: data.phone ?? undefined,
      email: data.email ?? undefined,
      skills: data.skills.length > 0 ? data.skills : undefined,
      experience: data.workYears ?? undefined,
      education: data.highestEducation ?? undefined,
    });
  })();
}
```

**Step 3:** Run: `npx svelte-check`，Expected: 0 errors
**Step 4:** Commit

```bash
git add src/lib/server/services/resume/resume-parse-chain.ts \
        src/lib/server/services/resume/resume-profile-service.ts
git commit -m "feat(resume): add resume profile service with Chain of Responsibility pattern"
```

---

## Task 6: Service 层 — Prompt 建造者模式重构

**层级:** Service (`src/lib/server/services/ai/`)
**设计模式:** 建造者 (Builder) — 从结构化 profile 数据组装 prompt
**开发策略参考:** 4.2 "建造者模式 — 复杂报告/文档组装"

**Files:**
- Create: `src/lib/server/services/ai/profile-prompt-builder.ts`
- Modify: `src/lib/server/services/ai/prompts.ts` — 所有 prompt 函数改为读取 ResumeProfileFull

**核心变更:**
- `buildEvaluationPrompt` 签名从 `(candidate, job)` 变为 `(profile: ResumeProfileFull, job: Job)`
- `buildReportPrompt` 签名同步变更
- `buildReEvaluationPrompt` 签名同步变更
- `buildChatContext` 签名同步变更

**profile-prompt-builder.ts 设计:**

```typescript
// src/lib/server/services/ai/profile-prompt-builder.ts

import type { ResumeProfileFull, WorkExperience, EducationRecord, ProjectExperience } from '$lib/types';

/**
 * Profile Prompt 建造者 — 将结构化简历数据组装为 AI 可读的上下文文本
 * 设计模式: Builder (创建型)
 * 解决问题: prompt 组装逻辑分散在多个函数中，
 *          结构化数据格式化为文本的方式需要统一管理
 */
export class ProfilePromptBuilder {
  private sections: string[] = [];

  /** 添加基础信息区 */
  withBasicInfo(profile: ResumeProfileFull): this {
    const lines: string[] = ['## 候选人基本信息'];
    if (profile.name) lines.push(`- 姓名: ${profile.name}`);
    if (profile.gender) lines.push(`- 性别: ${profile.gender}`);
    if (profile.birthDate) lines.push(`- 出生年月: ${profile.birthDate}`);
    if (profile.phone) lines.push(`- 电话: ${profile.phone}`);
    if (profile.email) lines.push(`- 邮箱: ${profile.email}`);
    if (profile.city) lines.push(`- 所在城市: ${profile.city}`);
    if (profile.highestEducation) lines.push(`- 最高学历: ${profile.highestEducation}`);
    if (profile.school) lines.push(`- 毕业院校: ${profile.school}`);
    if (profile.major) lines.push(`- 专业: ${profile.major}`);
    if (profile.workYears > 0) lines.push(`- 工作年限: ${profile.workYears}年`);
    if (profile.expectedSalary) lines.push(`- 期望薪资: ${profile.expectedSalary}`);
    this.sections.push(lines.join('\n'));
    return this;
  }

  /** 添加技能/证书/语言 */
  withSkills(profile: ResumeProfileFull): this {
    const lines: string[] = [];
    if (profile.skills.length > 0) lines.push(`- 技能: ${profile.skills.join(', ')}`);
    if (profile.certificates.length > 0) lines.push(`- 证书: ${profile.certificates.join(', ')}`);
    if (profile.languages.length > 0) {
      const langs = profile.languages.map(l => `${l.language}(${l.level})`).join(', ');
      lines.push(`- 语言: ${langs}`);
    }
    if (lines.length > 0) this.sections.push(lines.join('\n'));
    return this;
  }

  /** 添加工作经历 */
  withWorkExperiences(experiences: WorkExperience[]): this {
    if (experiences.length === 0) return this;
    const lines = ['## 工作经历'];
    for (const exp of experiences) {
      lines.push(`### ${exp.company} — ${exp.position} (${exp.startDate} ~ ${exp.endDate})`);
      if (exp.description) lines.push(exp.description);
      lines.push('');
    }
    this.sections.push(lines.join('\n'));
    return this;
  }

  /** 添加教育经历 */
  withEducation(records: EducationRecord[]): this {
    if (records.length === 0) return this;
    const lines = ['## 教育经历'];
    for (const edu of records) {
      lines.push(`- ${edu.school} | ${edu.major} | ${edu.degree} (${edu.startDate} ~ ${edu.endDate})`);
    }
    this.sections.push(lines.join('\n'));
    return this;
  }

  /** 添加项目经验 */
  withProjects(projects: ProjectExperience[]): this {
    if (projects.length === 0) return this;
    const lines = ['## 项目经验'];
    for (const proj of projects) {
      lines.push(`### ${proj.projectName} — ${proj.role} (${proj.startDate} ~ ${proj.endDate})`);
      if (proj.description) lines.push(proj.description);
      lines.push('');
    }
    this.sections.push(lines.join('\n'));
    return this;
  }

  /** 添加自我评价 */
  withSelfEvaluation(text: string): this {
    if (text) {
      this.sections.push(`## 自我评价\n${text}`);
    }
    return this;
  }

  /** 构建最终文本 */
  build(): string {
    return this.sections.join('\n\n');
  }

  /** 便捷方法: 从完整 profile 构建全部上下文 */
  static fromProfile(profile: ResumeProfileFull): string {
    return new ProfilePromptBuilder()
      .withBasicInfo(profile)
      .withSkills(profile)
      .withWorkExperiences(profile.workExperiences)
      .withEducation(profile.educationHistory)
      .withProjects(profile.projectExperiences)
      .withSelfEvaluation(profile.selfEvaluation)
      .build();
  }
}
```

**修改 prompts.ts 的核心变更:**

1. `buildEvaluationPrompt(profile: ResumeProfileFull, job: Job): string`
   - 使用 `ProfilePromptBuilder.fromProfile(profile)` 替代 `candidate.resumeText`
   - 保留评分维度、分档标准、差异化指令不变

2. `buildReportPrompt(assessment, profile: ResumeProfileFull, job): string`
   - 同上替换

3. `buildReEvaluationPrompt(profile: ResumeProfileFull, job, initialAssessment, attachmentTexts): string`
   - 同上替换

4. `buildChatContext()` 函数也改为接收 profile 数据

**Step 3:** Run: `npx svelte-check`，Expected: 0 errors
**Step 4:** Commit

```bash
git add src/lib/server/services/ai/profile-prompt-builder.ts \
        src/lib/server/services/ai/prompts.ts
git commit -m "feat(ai): add ProfilePromptBuilder and refactor prompts to use structured profile data"
```

---

## Task 7: API 层 — 简历 Profile CRUD 路由

**层级:** API (`src/routes/api/`)
**开发策略规范:** 输入校验、错误处理不泄露堆栈、参数化查询

**Files:**
- Create: `src/routes/api/resume-profiles/+server.ts` — GET (列表) + POST (手动创建)
- Create: `src/routes/api/resume-profiles/[id]/+server.ts` — GET (详情) + PUT (编辑) + DELETE
- Create: `src/routes/api/resume-profiles/[id]/reparse/+server.ts` — POST (重新解析)

**路由设计:**
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/resume-profiles?jobId=X` | 获取某岗位下所有 profile（列表） |
| GET | `/api/resume-profiles/[id]` | 获取单个 profile 完整信息（含子表） |
| PUT | `/api/resume-profiles/[id]` | 编辑 profile（基础字段+子表） |
| DELETE | `/api/resume-profiles/[id]` | 删除单个 profile |
| POST | `/api/resume-profiles/[id]/reparse` | 重新 AI 解析 |

**编辑 PUT 逻辑要点:**
- 基础字段直接 update resume_profiles 表
- 子表采用"删除全部 + 重新插入"策略（简单可靠）
- 同步更新 candidates 表对应字段
- 整个操作包裹在事务中

**Commit:**
```bash
git add src/routes/api/resume-profiles/
git commit -m "feat(api): add resume profiles CRUD endpoints"
```

---

## Task 8: API 层 — 修改上传流程触发自动解析

**层级:** API (`src/routes/api/resume/upload/`)
**Files:**
- Modify: `src/routes/api/resume/upload/+server.ts`

**核心变更:**
上传流程在创建 candidate 之后，自动调用 `createAndParseProfile()`:

```
原流程: 上传 → 提取文本 → 创建 candidate (存 resumeText) → 返回
新流程: 上传 → 提取文本 → 创建 candidate (存 resumeText)
                        → 创建 profile + AI 解析 (异步不阻塞响应)
                        → 返回 (含 profileId + parseStatus)
```

**注意:** AI 解析是耗时操作（3-10秒），上传接口应先返回 `profileId + parseStatus='parsing'`，前端通过轮询 GET `/api/resume-profiles/[id]` 获取解析状态。或者改为同步等待（简历解析不像评估那么久，可以接受）。

**建议:** 同步执行，原因：
1. 单用户场景，不需要高并发
2. 前端可以显示解析进度
3. 实现更简单

**Commit:**
```bash
git add src/routes/api/resume/upload/+server.ts
git commit -m "feat(api): integrate resume profile auto-parsing into upload flow"
```

---

## Task 9: API 层 — 修改下游 API (evaluate, chat, report, re-evaluate)

**层级:** API (`src/routes/api/`)
**核心变更:** 所有 AI 相关 API 的数据源从 candidates 切换到 resume_profiles

**Files:**
- Modify: `src/routes/api/ai/evaluate/+server.ts`
- Modify: `src/routes/api/ai/chat/+server.ts`
- Modify: `src/routes/api/ai/report/+server.ts`
- Modify: `src/routes/api/assessments/[id]/re-evaluate/+server.ts`

**统一变更逻辑:**
1. 接收 candidateId → 查询 resume_profiles (getByCandidateId)
2. 检查 `parseStatus === 'completed'`，否则返回 422 "请先完成简历解析"
3. 调用 `resumeProfileDAO.getFullById()` 获取完整结构化数据
4. 传入改造后的 prompt 函数

**chat API 特殊处理:**
- `buildChatContext()` 改为使用 `ProfilePromptBuilder.fromProfile(profile)` 构建上下文
- 让 AI 能精准回答 "这个候选人上一份工作在哪？" 这类问题

**Commit:**
```bash
git add src/routes/api/ai/ src/routes/api/assessments/
git commit -m "feat(api): switch all AI endpoints to use structured resume profile data"
```

---

## Task 10: Presentation 层 — 侧边栏新增菜单项

**层级:** Presentation (`src/lib/components/`)
**Files:**
- Modify: `src/lib/components/Sidebar.svelte`

**变更:** 在 navItems 数组中，在"简历管理"之后插入：
```typescript
{ label: '简历信息库', href: '/resume-profiles', icon: 'profile' },
```

需要新增一个 `profile` 图标 SVG（与现有风格一致：18x18, stroke 1.8, no fill）。建议使用"文件+用户"图标代表结构化简历信息。

**Commit:**
```bash
git add src/lib/components/Sidebar.svelte
git commit -m "feat(ui): add resume profiles navigation item to sidebar"
```

---

## Task 11: Presentation 层 — 简历信息库页面 + 组件

**层级:** Presentation (`src/routes/resume-profiles/`, `src/lib/components/`)
**开发策略规范:** 设计令牌、Props 类型化、组件分层

**Files:**
- Create: `src/routes/resume-profiles/+page.svelte` — 主页面
- Create: `src/lib/components/ResumeProfileCard.svelte` — Profile 卡片组件（折叠/展开）
- Create: `src/lib/components/ResumeProfileEditor.svelte` — 编辑模式组件
- Create: `src/lib/components/ExperienceTimeline.svelte` — 工作/教育/项目时间线组件（可复用）

**组件设计要点：**

### ResumeProfileCard.svelte
- Props: `{ profile: ResumeProfileFull, onreparse, onedit, ondelete }`
- 折叠态: 姓名 | 性别 | 学历 | 工作年限 | 岗位 | 解析状态标签
- 展开态: 基础信息表格 + 技能标签 + 工作/教育/项目时间线 + 自我评价
- 解析状态用 Badge 组件: pending(灰), parsing(蓝+动画), completed(绿), failed(红)
- 所有颜色使用设计令牌

### ResumeProfileEditor.svelte
- Props: `{ profile: ResumeProfileFull, onsave, oncancel }`
- 基础信息: 表单输入框 (Input/Select)
- 技能/证书: 可增删的标签输入
- 工作/教育/项目: 可增删改的列表，每项可展开编辑
- 保存时调用 PUT /api/resume-profiles/[id]

### ExperienceTimeline.svelte
- Props: `{ items: Array<{title, subtitle, period, description?}>, editable?: boolean }`
- 通用的时间线展示组件，被工作经历/教育经历/项目经验三处复用
- 可选编辑模式 (支持增删改)

### 主页面 resume-profiles/+page.svelte
- 岗位筛选下拉 → 加载该岗位下所有 profiles
- 搜索栏 (按姓名/岗位搜索)
- Profile 卡片列表
- 空状态: "暂无简历信息，请先在简历管理中上传简历"

**样式约束（设计令牌清单）：**
- 卡片背景: `var(--color-bg-card)`
- 卡片圆角: `var(--radius)`
- 卡片阴影: `var(--shadow-sm)`
- 状态 Badge: `var(--color-success)` / `var(--color-info)` / `var(--color-danger)` / `var(--color-text-secondary)`
- 按钮: `var(--color-accent)` + `var(--color-bg-card)`
- 边框: `var(--color-border)`
- 过渡: `var(--transition)`

**Commit:**
```bash
git add src/routes/resume-profiles/ src/lib/components/ResumeProfileCard.svelte \
        src/lib/components/ResumeProfileEditor.svelte \
        src/lib/components/ExperienceTimeline.svelte
git commit -m "feat(ui): add resume profiles page with card, editor, and timeline components"
```

---

## Task 12: 集成测试 + 最终验证

**层级:** 全链路验证

**Step 1: svelte-check**

Run: `npx svelte-check --tsconfig ./tsconfig.json`
Expected: 0 errors, 0 warnings

**Step 2: 硬编码颜色检查**

Run: `grep -rn '#[0-9A-Fa-f]\{6\}' src/lib/components/ResumeProfile*.svelte src/lib/components/ExperienceTimeline.svelte src/routes/resume-profiles/`
Expected: 0 matches (无硬编码颜色)

**Step 3: any 类型检查**

Run: `grep -rn ': any' src/lib/types/resume-profile.ts src/lib/server/db/*-dao.ts src/lib/server/services/resume/resume-parse-chain.ts src/lib/server/services/resume/resume-profile-service.ts`
Expected: 0 matches

**Step 4: 分层依赖检查**

- 确认 `src/routes/resume-profiles/+page.svelte` 不直接 import `$lib/server/` 路径
- 确认 `src/lib/components/ResumeProfile*.svelte` 不直接 import `$lib/server/` 路径
- 确认新组件只 import `$lib/types/` 或其他组件

**Step 5: 开发策略检查清单对照**

逐项对照 `docs/DEVELOPMENT-STRATEGY.md` 第 13 节的完整检查清单。

**Step 6: Commit + Version bump**

```bash
# 版本号更新 (package.json)
npm version minor --no-git-tag-version
git add -A
git commit -m "chore: bump version to 1.5.0"
git tag v1.5.0
```

---

## 执行依赖图

```
Task 1 (Types)
    ↓
Task 2 (Migration)
    ↓
Task 3 (DAOs) ← depends on Task 1 + 2
    ↓
Task 4 (PDF Engine) ← independent, can parallel with 3
    ↓
Task 5 (Parse Service) ← depends on Task 3 + 4
    ↓
Task 6 (Prompt Builder) ← depends on Task 1
    ↓
Task 7 (Profile API) ← depends on Task 3 + 5
    ↓
Task 8 (Upload API) ← depends on Task 5 + 7
    ↓
Task 9 (Downstream API) ← depends on Task 6
    ↓
Task 10 (Sidebar) ← independent
    ↓
Task 11 (UI Page) ← depends on Task 7 + 10
    ↓
Task 12 (Verification) ← depends on all
```

**可并行的 Task:**
- Task 4 (PDF) 可与 Task 3 (DAOs) 并行
- Task 6 (Prompt Builder) 可在 Task 3 完成后与 Task 5 并行
- Task 10 (Sidebar) 可在任何时候执行
