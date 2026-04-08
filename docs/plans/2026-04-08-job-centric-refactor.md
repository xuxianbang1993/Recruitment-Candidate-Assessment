# Job-Centric Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the recruitment assessment system so candidates belong to a specific job position, and all pages (resume management, smart analysis, match reports) are organized around jobs.

**Architecture:** Add `job_id` FK to `candidates` table establishing a one-to-one candidate-to-job relationship. Modify CandidateDAO, 3 API endpoints, 3 pages, and 2 components. Follows existing layered architecture: Foundation -> DAO -> API -> Presentation.

**Tech Stack:** Svelte 5 + SvelteKit + TypeScript strict + SQLite (better-sqlite3) + Tailwind CSS v4

---

## Task 1: Database Migration + Type Foundation

**Files:**
- Create: `src/lib/server/db/migrations/004-add-candidate-job-id.sql`
- Modify: `src/lib/types/candidate.ts`

**Step 1: Create the migration file**

Create `src/lib/server/db/migrations/004-add-candidate-job-id.sql`:

```sql
-- 004: Add job_id foreign key to candidates table (job-centric refactor)
-- Requires clearing existing candidate data before running

ALTER TABLE candidates ADD COLUMN job_id TEXT NOT NULL DEFAULT '' REFERENCES jobs(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_candidates_job ON candidates(job_id);
```

**Step 2: Update the Candidate type**

Modify `src/lib/types/candidate.ts` — replace `position: string` with `jobId: string`:

```typescript
export interface Candidate {
  id: string
  jobId: string
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

**Step 3: Delete the old database file to start fresh**

```bash
cd D:/深圳SZOMK/Recruitment-Candidate-Assessment
rm -f recruitment.db recruitment.db-wal recruitment.db-shm
```

**Step 4: Commit**

```bash
git add src/lib/server/db/migrations/004-add-candidate-job-id.sql src/lib/types/candidate.ts
git commit -m "feat(db): add job_id FK to candidates table, update Candidate type"
```

---

## Task 2: CandidateDAO Refactor

**Files:**
- Modify: `src/lib/server/db/candidate-dao.ts`

**Step 1: Update CandidateRow interface and rowToCandidate**

In `src/lib/server/db/candidate-dao.ts`, replace the existing `CandidateRow` interface and `rowToCandidate` function:

```typescript
interface CandidateRow {
  id: string;
  job_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  resume_text: string | null;
  skills: string | null;
  experience: number;
  education: string | null;
  created_at: string;
}

function rowToCandidate(row: CandidateRow): Candidate {
  return {
    id: row.id,
    jobId: row.job_id,
    name: row.name,
    phone: row.phone ?? '',
    email: row.email ?? '',
    resumeText: row.resume_text ?? '',
    skills: row.skills ? (JSON.parse(row.skills) as string[]) : [],
    experience: row.experience,
    education: row.education ?? '',
    createdAt: row.created_at
  };
}
```

**Step 2: Add getByJobId method**

Add after `getById`:

```typescript
getByJobId(jobId: string): Candidate[] {
  const db = getDatabase();
  const rows = db
    .prepare('SELECT * FROM candidates WHERE job_id = ? ORDER BY created_at DESC')
    .all(jobId) as CandidateRow[];
  return rows.map(rowToCandidate);
}
```

**Step 3: Update create method**

Replace the existing `create` method — change `position` to `jobId`:

```typescript
create(data: Omit<Candidate, 'id' | 'createdAt'>): Candidate {
  const db = getDatabase();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO candidates (id, job_id, name, phone, email, resume_text, skills, experience, education)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.jobId,
    data.name,
    data.phone,
    data.email,
    data.resumeText,
    JSON.stringify(data.skills ?? []),
    data.experience ?? 0,
    data.education
  );
  return this.getById(id)!;
}
```

**Step 4: Update the update method**

Replace the `position` field handling with `jobId`:

```typescript
update(id: string, data: Partial<Omit<Candidate, 'id' | 'createdAt'>>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?');
    values.push(data.phone);
  }
  if (data.email !== undefined) {
    fields.push('email = ?');
    values.push(data.email);
  }
  if (data.jobId !== undefined) {
    fields.push('job_id = ?');
    values.push(data.jobId);
  }
  if (data.resumeText !== undefined) {
    fields.push('resume_text = ?');
    values.push(data.resumeText);
  }
  if (data.skills !== undefined) {
    fields.push('skills = ?');
    values.push(JSON.stringify(data.skills));
  }
  if (data.experience !== undefined) {
    fields.push('experience = ?');
    values.push(data.experience);
  }
  if (data.education !== undefined) {
    fields.push('education = ?');
    values.push(data.education);
  }

  if (fields.length === 0) return;

  values.push(id);
  db.prepare(`UPDATE candidates SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}
```

**Step 5: Update search method to support jobId filter**

Replace the existing `search` method:

```typescript
search(keyword: string, jobId?: string): Candidate[] {
  const db = getDatabase();
  const escaped = keyword.replace(/[%_]/g, '\\$&');
  const pattern = '%' + escaped + '%';

  if (jobId) {
    const rows = db
      .prepare(
        `SELECT * FROM candidates
         WHERE job_id = ? AND (name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')
         ORDER BY created_at DESC`
      )
      .all(jobId, pattern, pattern) as CandidateRow[];
    return rows.map(rowToCandidate);
  }

  const rows = db
    .prepare(
      `SELECT * FROM candidates
       WHERE name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\'
       ORDER BY created_at DESC`
    )
    .all(pattern, pattern) as CandidateRow[];
  return rows.map(rowToCandidate);
}
```

**Step 6: Commit**

```bash
git add src/lib/server/db/candidate-dao.ts
git commit -m "refactor(db): update CandidateDAO for job_id FK, add getByJobId"
```

---

## Task 3: API Layer Updates

**Files:**
- Modify: `src/routes/api/candidates/+server.ts`
- Modify: `src/routes/api/candidates/[id]/+server.ts`
- Modify: `src/routes/api/resume/upload/+server.ts`

**Step 1: Update GET /api/candidates to support jobId filter**

In `src/routes/api/candidates/+server.ts`, replace the `GET` handler:

```typescript
export const GET: RequestHandler = ({ url }) => {
  try {
    const keyword = url.searchParams.get('keyword')
    const jobId = url.searchParams.get('jobId')

    let candidates
    if (keyword) {
      candidates = candidateDAO.search(keyword, jobId ?? undefined)
    } else if (jobId) {
      candidates = candidateDAO.getByJobId(jobId)
    } else {
      candidates = candidateDAO.getAll()
    }

    return json({ success: true, data: candidates })
  } catch (e) {
    console.error('GET /api/candidates error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
```

**Step 2: Update POST /api/candidates**

Replace the `POST` handler — change `position` to `jobId`:

```typescript
export const POST: RequestHandler = async ({ request }) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('name' in body) ||
    !('jobId' in body) ||
    !('resumeText' in body)
  ) {
    return json(
      { success: false, error: 'Missing required fields: name, jobId, resumeText' },
      { status: 400 }
    )
  }

  const data = body as Record<string, unknown>

  const email = String(data.email ?? '')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, error: '邮箱格式不正确' }, { status: 400 })
  }

  try {
    const candidate = candidateDAO.create({
      jobId: String(data.jobId),
      name: String(data.name),
      phone: String(data.phone ?? ''),
      email,
      resumeText: String(data.resumeText),
      skills: Array.isArray(data.skills) ? (data.skills as string[]).map(String) : [],
      experience: typeof data.experience === 'number' ? data.experience : 0,
      education: typeof data.education === 'string' ? data.education : ''
    })
    return json({ success: true, data: candidate }, { status: 201 })
  } catch (e) {
    console.error('POST /api/candidates error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
```

**Step 3: Update PUT /api/candidates/[id]**

In `src/routes/api/candidates/[id]/+server.ts`, update the PUT handler to use `jobId` instead of `position`:

Replace this line:
```typescript
    if ('position' in data) update.position = String(data.position)
```
With:
```typescript
    if ('jobId' in data) update.jobId = String(data.jobId)
```

**Step 4: Update POST /api/resume/upload to accept jobId**

In `src/routes/api/resume/upload/+server.ts`, update the `createCandidate` branch to use `jobId` from form data.

After line `const createCandidate = createCandidateRaw === 'true' || createCandidateRaw === '1'`, add:

```typescript
  const jobId = formData.get('jobId')
```

Then replace the `createCandidate` branch (lines 74-86):

```typescript
    } else if (createCandidate) {
      if (typeof jobId !== 'string' || !jobId) {
        return json({ success: false, error: 'jobId is required when creating a candidate' }, { status: 400 })
      }
      const basename = path.basename(file.name, path.extname(file.name))
      const candidate = candidateDAO.create({
        jobId,
        name: basename || '未命名候选人',
        phone: '',
        email: '',
        resumeText: parsed.text,
        skills: [],
        experience: 0,
        education: ''
      })
      resolvedCandidateId = candidate.id
    }
```

**Step 5: Commit**

```bash
git add src/routes/api/candidates/+server.ts src/routes/api/candidates/\[id\]/+server.ts src/routes/api/resume/upload/+server.ts
git commit -m "feat(api): update candidate APIs for job_id support"
```

---

## Task 4: ResumeUploader Component Update

**Files:**
- Modify: `src/lib/components/ResumeUploader.svelte`

**Step 1: Add jobId prop**

Replace the props declaration (lines 4-7):

```typescript
  let { onupload, multiple = false, jobId }: {
    onupload: (candidate: Candidate) => void
    multiple?: boolean
    jobId: string
  } = $props()
```

**Step 2: Pass jobId in upload form data**

In the `uploadFile` function, add `jobId` to the form data. After `formData.append('createCandidate', 'true')` (line 67), add:

```typescript
      formData.append('jobId', jobId)
```

**Step 3: Commit**

```bash
git add src/lib/components/ResumeUploader.svelte
git commit -m "feat(ui): add jobId prop to ResumeUploader component"
```

---

## Task 5: CandidateCard Component Update

**Files:**
- Modify: `src/lib/components/CandidateCard.svelte`

**Step 1: Remove position display**

In `src/lib/components/CandidateCard.svelte`, remove the position block from the card header. Find and delete lines 132-140 (the `{#if candidate.position}` block):

```svelte
        {#if candidate.position}
          <span class="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            {candidate.position}
          </span>
        {/if}
```

Remove this entire block. The experience display that follows it stays.

**Step 2: Commit**

```bash
git add src/lib/components/CandidateCard.svelte
git commit -m "refactor(ui): remove position display from CandidateCard"
```

---

## Task 6: Candidates Page (Resume Management) Refactor

**Files:**
- Modify: `src/routes/candidates/+page.svelte`

**Step 1: Replace the entire script section**

Replace the `<script lang="ts">` block with:

```typescript
<script lang="ts">
  import { onMount } from 'svelte'
  import ResumeUploader from '$lib/components/ResumeUploader.svelte'
  import CandidateCard from '$lib/components/CandidateCard.svelte'
  import type { Candidate, Job } from '$lib/types'
  import { showConfirm } from '$lib/utils/dialog'

  let jobs = $state<Job[]>([])
  let selectedJobId = $state('')
  let candidates = $state<Candidate[]>([])
  let keyword = $state('')
  let loading = $state(false)
  let loadingJobs = $state(false)
  let error = $state('')
  let searchDebounce: ReturnType<typeof setTimeout>

  async function fetchJobs() {
    loadingJobs = true
    try {
      const res = await fetch('/api/jobs')
      if (res.ok) {
        const json = await res.json()
        jobs = json.success ? (json.data ?? []) : []
        if (jobs.length > 0 && !selectedJobId) {
          selectedJobId = jobs[0].id
        }
      }
    } catch {
      // ignore
    } finally {
      loadingJobs = false
    }
  }

  async function fetchCandidates() {
    if (!selectedJobId) {
      candidates = []
      return
    }
    loading = true
    error = ''
    try {
      const params = new URLSearchParams({ jobId: selectedJobId })
      if (keyword) params.set('keyword', keyword)
      const res = await fetch(`/api/candidates?${params}`)
      if (res.ok) {
        const data = await res.json()
        candidates = data.data ?? []
      } else {
        error = '加载候选人列表失败'
      }
    } catch {
      error = '加载候选人列表失败'
    } finally {
      loading = false
    }
  }

  function handleJobChange() {
    keyword = ''
    fetchCandidates()
  }

  function handleSearch() {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => fetchCandidates(), 350)
  }

  function handleUpload(candidate: Candidate) {
    candidates = [candidate, ...candidates]
  }

  async function handleDelete(id: string) {
    if (!(await showConfirm('确定要删除该候选人吗？\n\n此操作不可撤销。'))) return
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        candidates = candidates.filter((c) => c.id !== id)
      } else {
        error = '删除失败，请重试'
      }
    } catch {
      error = '删除失败，请重试'
    }
  }

  function handleResumeChange(updated: Candidate) {
    candidates = candidates.map((c) => (c.id === updated.id ? updated : c))
  }

  async function handleClearAll() {
    if (!(await showConfirm(`确定要清空该岗位下全部 ${candidates.length} 位候选人吗？\n\n此操作不可撤销。`))) return
    try {
      // Delete each candidate under this job
      for (const c of candidates) {
        await fetch(`/api/candidates/${c.id}`, { method: 'DELETE' })
      }
      candidates = []
    } catch {
      error = '清空失败，请重试'
    }
  }

  onMount(async () => {
    await fetchJobs()
    if (selectedJobId) fetchCandidates()
  })
</script>
```

**Step 2: Replace the template section**

Replace everything after `</script>` with:

```svelte
<svelte:head>
  <title>简历管理 - 智聘评估</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-6 flex items-center justify-between">
  <div>
    <h1 class="text-xl font-bold" style="color: var(--color-text-primary);">简历管理</h1>
    <p class="text-sm mt-0.5" style="color: var(--color-text-secondary);">上传候选人简历，系统自动解析关键信息</p>
  </div>
  <div class="flex items-center gap-2">
    <div
      class="text-sm px-3 py-1.5 rounded-lg"
      style="background: var(--color-accent-bg); color: var(--color-accent);"
    >
      共 {candidates.length} 位候选人
    </div>
    {#if candidates.length > 0}
      <button
        onclick={handleClearAll}
        class="text-sm px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-80"
        style="background: var(--color-danger-bg); color: var(--color-danger); border: 1px solid rgba(199,84,80,0.15);"
      >
        清空全部
      </button>
    {/if}
  </div>
</div>

<!-- Error Alert -->
{#if error}
  <div
    class="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
    style="background: var(--color-danger-bg); border: 1px solid rgba(199,84,80,0.2); color: var(--color-danger);"
  >
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    {error}
  </div>
{/if}

<!-- Job Selector -->
<div class="mb-4">
  {#if loadingJobs}
    <div class="h-10 rounded-lg animate-pulse" style="background: var(--color-bg-card);"></div>
  {:else if jobs.length === 0}
    <div
      class="px-4 py-3 rounded-xl text-sm"
      style="background: var(--color-accent-bg); border: 1px solid rgba(212,118,60,0.2); color: var(--color-accent);"
    >
      暂无岗位，请先在「岗位需求」中创建岗位
      <a href="/assessment" class="underline font-medium ml-1">去创建</a>
    </div>
  {:else}
    <select
      bind:value={selectedJobId}
      onchange={handleJobChange}
      class="w-full h-10 px-3 rounded-lg text-sm outline-none cursor-pointer"
      style="background: var(--color-bg-card); border: 1px solid var(--color-border); color: var(--color-text-primary);"
    >
      {#each jobs as job}
        <option value={job.id}>{job.title} — {job.department}</option>
      {/each}
    </select>
  {/if}
</div>

<!-- Upload Area -->
{#if selectedJobId}
  <div class="mb-6">
    <ResumeUploader onupload={handleUpload} jobId={selectedJobId} />
  </div>
{/if}

<!-- Search Bar -->
{#if selectedJobId}
  <div class="mb-4 flex items-center gap-3">
    <div class="relative flex-1">
      <div class="absolute left-3 top-1/2 -translate-y-1/2" style="color: var(--color-text-secondary);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <input
        type="text"
        placeholder="搜索候选人姓名、技能..."
        bind:value={keyword}
        oninput={handleSearch}
        class="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
        style="
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
        "
      />
    </div>
    <button
      onclick={() => { keyword = ''; fetchCandidates() }}
      class="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
      style="background: var(--color-bg-card); border: 1px solid var(--color-border); color: var(--color-text-secondary);"
    >
      重置
    </button>
  </div>
{/if}

<!-- Candidate List -->
{#if loading}
  <div class="flex items-center justify-center py-16">
    <div
      class="w-8 h-8 rounded-full border-2 animate-spin"
      style="border-color: var(--color-accent) transparent transparent transparent;"
    ></div>
    <span class="ml-3 text-sm" style="color: var(--color-text-secondary);">加载中...</span>
  </div>
{:else if !selectedJobId}
  <!-- no job selected, empty state handled by job selector -->
{:else if candidates.length === 0}
  <div
    class="flex flex-col items-center justify-center py-20 rounded-2xl"
    style="background: var(--color-bg-card); border: 1px solid var(--color-border);"
  >
    <div
      class="w-16 h-16 rounded-full flex items-center justify-center mb-4"
      style="background: var(--color-accent-bg);"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
    <p class="text-sm font-medium mb-1" style="color: var(--color-text-primary);">
      {keyword ? '未找到匹配的候选人' : '该岗位暂无候选人'}
    </p>
    <p class="text-xs" style="color: var(--color-text-secondary);">
      {keyword ? '请尝试其他关键词' : '上传简历后，候选人将在此显示'}
    </p>
  </div>
{:else}
  <div class="space-y-3">
    {#each candidates as candidate (candidate.id)}
      <CandidateCard {candidate} ondelete={handleDelete} onresumechange={handleResumeChange} />
    {/each}
  </div>
{/if}
```

**Step 3: Commit**

```bash
git add src/routes/candidates/+page.svelte
git commit -m "feat(ui): refactor candidates page with job selector"
```

---

## Task 7: Smart Analysis Page Refactor

**Files:**
- Modify: `src/routes/assessment/results/+page.svelte`

**Step 1: Update fetchData to filter candidates by job**

In `src/routes/assessment/results/+page.svelte`, replace the `fetchData` function (lines 34-62):

```typescript
  async function fetchData() {
    loading = true
    try {
      const [aRes, jRes] = await Promise.all([
        fetch('/api/assessments'),
        fetch('/api/jobs'),
      ])
      if (aRes.ok) {
        const d = await aRes.json()
        assessments = d.success ? (d.data ?? []) : []
      }
      if (jRes.ok) {
        const d = await jRes.json()
        jobs = d.success ? (d.data ?? []) : []
        if (jobs.length > 0 && !selectedJobId) {
          selectedJobId = jobs[0].id
        }
      }
      // Fetch candidates for selected job
      await fetchCandidatesForJob()
    } catch {
      // silently ignore
    } finally {
      loading = false
    }
  }

  async function fetchCandidatesForJob() {
    if (!selectedJobId) {
      candidates = []
      return
    }
    try {
      const res = await fetch(`/api/candidates?jobId=${selectedJobId}`)
      if (res.ok) {
        const d = await res.json()
        candidates = d.success ? (d.data ?? []) : []
      }
    } catch {
      // ignore
    }
  }
```

**Step 2: Update handleEvaluate to only evaluate job candidates**

Replace the `handleEvaluate` function (lines 64-100):

```typescript
  async function handleEvaluate() {
    if (!selectedJobId || candidates.length === 0) return
    evalError = ''
    evaluating = true
    let successCount = 0
    let failCount = 0
    try {
      for (const candidate of candidates) {
        try {
          const res = await fetch('/api/ai/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateId: candidate.id, jobId: selectedJobId }),
          })
          if (res.ok) {
            successCount++
          } else {
            failCount++
            const err = await res.json().catch(() => ({}))
            console.error(`评估 ${candidate.name} 失败:`, err.error)
          }
        } catch {
          failCount++
        }
      }
      if (failCount > 0 && successCount === 0) {
        evalError = '评估失败，请检查 AI 配置后重试'
      } else if (failCount > 0) {
        evalError = `${successCount} 人评估成功，${failCount} 人失败`
      }
      await fetchData()
    } catch {
      evalError = '网络错误，请重试'
    } finally {
      evaluating = false
    }
  }
```

**Step 3: Add a reactive effect to refresh candidates when job changes**

Add after the `handleEvaluate` function, before the `filteredAssessments` derived:

```typescript
  // When selectedJobId changes, refresh candidates
  $effect(() => {
    if (selectedJobId) {
      fetchCandidatesForJob()
    }
  })
```

**Step 4: Update the job selector in the template**

Find the job selector `<select>` (around line 152) and add an onchange handler:

```svelte
    {#if jobs.length > 0}
      <select
        bind:value={selectedJobId}
        onchange={() => fetchCandidatesForJob()}
        class="px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
        style="background: var(--color-bg-card); border: 1px solid var(--color-border); color: var(--color-text-primary);"
      >
        {#each jobs as job}
          <option value={job.id}>{job.title}</option>
        {/each}
      </select>
    {/if}
```

**Step 5: Commit**

```bash
git add src/routes/assessment/results/+page.svelte
git commit -m "feat(ui): filter smart analysis by job, evaluate only job candidates"
```

---

## Task 8: Match Reports Page Refactor (Three-Level Cascade)

**Files:**
- Modify: `src/routes/reports/+page.svelte`

**Step 1: Add job state and fetch function**

In `src/routes/reports/+page.svelte`, add job-related state after the existing state declarations (after line 8). Add these new state variables:

```typescript
  let jobs = $state<Job[]>([])
  let selectedJobId = $state<string>('')
  let loadingJobs = $state(false)
```

**Step 2: Replace the onMount to load jobs first**

Replace the `onMount` block (lines 26-39):

```typescript
  onMount(async () => {
    loadingJobs = true
    try {
      const res = await fetch('/api/jobs')
      if (res.ok) {
        const json = await res.json()
        jobs = json.success ? (json.data ?? []) : []
        if (jobs.length > 0) {
          selectedJobId = jobs[0].id
        }
      }
    } catch {
      // ignore
    } finally {
      loadingJobs = false
    }
  })
```

**Step 3: Add onJobChange to load candidates for selected job**

Add after onMount:

```typescript
  async function onJobChange() {
    candidates = []
    selectedCandidateId = ''
    assessments = []
    selectedAssessmentId = ''
    reportText = ''
    reportScore = null
    error = ''
    if (!selectedJobId) return

    loadingCandidates = true
    try {
      const res = await fetch(`/api/candidates?jobId=${selectedJobId}`)
      if (res.ok) {
        const json = await res.json()
        candidates = json.success ? (json.data ?? []) : []
      }
    } catch {
      // ignore
    } finally {
      loadingCandidates = false
    }
  }

  // Load candidates when job changes
  $effect(() => {
    if (selectedJobId) {
      onJobChange()
    }
  })
```

**Step 4: Update the Selector Card template**

Replace the `<!-- Selector Card -->` section (the grid with candidate/assessment selectors) to add the job selector as the first level. Replace the entire Selector Card div:

```svelte
  <!-- Selector Card -->
  <div
    class="rounded-xl p-5 space-y-4"
    style="background: var(--color-bg-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);"
  >
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <!-- Job -->
      <div>
        <label for="jobSel" class="block text-xs font-medium mb-1.5" style="color: var(--color-text-secondary);">选择岗位</label>
        {#if loadingJobs}
          <div class="h-10 rounded-lg animate-pulse" style="background: var(--color-bg-primary);"></div>
        {:else}
          <select
            id="jobSel"
            bind:value={selectedJobId}
            class="w-full h-10 px-3 rounded-lg text-sm outline-none"
            style="background: var(--color-bg-primary); border: 1px solid var(--color-border); color: var(--color-text-primary);"
          >
            <option value="">请选择岗位...</option>
            {#each jobs as j}
              <option value={j.id}>{j.title} — {j.department}</option>
            {/each}
          </select>
        {/if}
      </div>

      <!-- Candidate -->
      <div>
        <label for="candidateSel" class="block text-xs font-medium mb-1.5" style="color: var(--color-text-secondary);">选择候选人</label>
        {#if loadingCandidates}
          <div class="h-10 rounded-lg animate-pulse" style="background: var(--color-bg-primary);"></div>
        {:else}
          <select
            id="candidateSel"
            bind:value={selectedCandidateId}
            onchange={onCandidateChange}
            disabled={!selectedJobId || candidates.length === 0}
            class="w-full h-10 px-3 rounded-lg text-sm outline-none"
            style="background: var(--color-bg-primary); border: 1px solid var(--color-border); color: var(--color-text-primary); opacity: {!selectedJobId ? '0.5' : '1'};"
          >
            {#if candidates.length === 0}
              <option value="">— 暂无候选人 —</option>
            {:else}
              <option value="">请选择候选人...</option>
              {#each candidates as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            {/if}
          </select>
        {/if}
      </div>

      <!-- Assessment -->
      <div>
        <label for="assessmentSel" class="block text-xs font-medium mb-1.5" style="color: var(--color-text-secondary);">选择评估记录</label>
        {#if loadingAssessments}
          <div class="h-10 rounded-lg animate-pulse" style="background: var(--color-bg-primary);"></div>
        {:else}
          <select
            id="assessmentSel"
            bind:value={selectedAssessmentId}
            disabled={!selectedCandidateId || assessments.length === 0}
            class="w-full h-10 px-3 rounded-lg text-sm outline-none"
            style="background: var(--color-bg-primary); border: 1px solid var(--color-border); color: var(--color-text-primary); opacity: {!selectedCandidateId ? '0.5' : '1'};"
          >
            {#if assessments.length === 0}
              <option value="">— 暂无评估记录 —</option>
            {:else}
              <option value="">请选择...</option>
              {#each assessments as a}
                <option value={a.id}>评估（得分 {a.totalScore}）</option>
              {/each}
            {/if}
          </select>
        {/if}
      </div>
    </div>

    <div class="flex items-center justify-between">
      {#if error}
        <div class="text-sm px-3 py-2 rounded-lg flex-1 mr-4" style="background: var(--color-danger-bg); color: var(--color-danger);">
          {error}
        </div>
      {:else}
        <div></div>
      {/if}

      <button
        onclick={generateReport}
        disabled={!canGenerate}
        class="h-10 px-5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 flex-shrink-0"
        style="
          background: {!canGenerate ? 'var(--color-border)' : 'var(--color-accent)'};
          color: {!canGenerate ? 'var(--color-text-secondary)' : 'var(--color-bg-card)'};
        "
      >
        {#if generating}
          <span class="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
          生成中...
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          生成报告
        {/if}
      </button>
    </div>
  </div>
```

**Step 5: Update the empty state text for no candidates**

Find the block that starts with `{:else if selectedCandidateId && assessments.length === 0` (around line 282) and update it:

```svelte
  {:else if !selectedJobId && !loadingJobs && jobs.length === 0}
    <div
      class="rounded-xl p-10 text-center"
      style="background: var(--color-bg-card); border: 1px solid var(--color-border);"
    >
      <div class="text-sm" style="color: var(--color-text-secondary);">暂无岗位，请先创建岗位需求</div>
      <a
        href="/assessment"
        class="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-medium"
        style="background: var(--color-accent); color: var(--color-bg-card);"
      >
        去创建岗位
      </a>
    </div>
```

**Step 6: Commit**

```bash
git add src/routes/reports/+page.svelte
git commit -m "feat(ui): refactor reports page with job->candidate->assessment cascade"
```

---

## Task 9: Verify and Fix TypeScript Errors

**Files:** All modified files

**Step 1: Run TypeScript check**

```bash
cd D:/深圳SZOMK/Recruitment-Candidate-Assessment
npm run check
```

**Step 2: Fix any TypeScript errors**

Common issues to watch for:
- Any remaining references to `candidate.position` in other files
- Type mismatches in the updated interfaces
- Missing `jobId` in any call to `candidateDAO.create()`

Search for all references to `candidate.position` or `.position`:

```bash
grep -r "\.position" src/ --include="*.ts" --include="*.svelte" | grep -v node_modules | grep -v ".svelte-kit"
```

Fix any remaining references.

**Step 3: Run dev server to verify**

```bash
npm run dev
```

Verify:
- App loads without errors
- Candidates page shows job selector
- Can upload resume with job selected
- Smart analysis filters by job
- Reports page has three-level cascade

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors from job-centric refactor"
```

---

## Task 10: Final Verification and Branch Commit

**Step 1: Run full check**

```bash
npm run check
```

**Step 2: Verify app runs**

```bash
npm run dev
```

Test the complete flow:
1. Go to 岗位需求 → Create a job
2. Go to 简历管理 → Select the job → Upload a resume
3. Go to 智能分析 → Select the job → Run analysis
4. Go to 匹配报告 → Select job → Select candidate → Generate report

**Step 3: Create feature branch and commit all changes**

```bash
git checkout -b feat/v1.4.0-job-centric-refactor
git add -A
git commit -m "feat: v1.4.0 job-centric refactor - candidates tied to jobs

- Add job_id FK to candidates table (migration 004)
- Update Candidate type: replace position with jobId
- CandidateDAO: add getByJobId, update create/search for jobId
- Candidates page: add job selector, filter by job
- Smart analysis: evaluate only job-specific candidates
- Reports page: three-level cascade (job->candidate->assessment)
- ResumeUploader: pass jobId on upload
- CandidateCard: remove position display"
```
