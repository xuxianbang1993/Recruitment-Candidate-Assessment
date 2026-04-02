import type { Candidate } from '$lib/types/candidate'
import type { Assessment, Job } from '$lib/types/assessment'
import { JOB_TEMPLATES, getDimensionTemplate } from '$lib/config/job-templates'
import type { JobCategory } from '$lib/config/job-templates'

function normalizeWeight(weight: number): number {
  return weight <= 1 ? Math.round(weight * 100) : Math.round(weight)
}

function appendIndicators(base: string, indicators: string[]): string {
  return indicators.length > 0 ? base + '\n  关键指标：' + indicators.join('；') : base
}

function buildBehaviorContext(job: Job, mode: 'evaluation' | 'report'): string {
  if (!job.category || !JOB_TEMPLATES[job.category as JobCategory]) return ''

  const template = JOB_TEMPLATES[job.category as JobCategory]

  if (mode === 'evaluation') {
    return [
      '## 评分参考（行为锚点）',
      ...template.dimensions.map(
        (d) => appendIndicators(`- ${d.name}：正向「${d.positive}」；反向「${d.negative}」`, d.indicators),
      ),
    ].join('\n')
  }

  return [
    '## 维度行为标准',
    ...template.dimensions.map(
      (d) => appendIndicators(`- ${d.name}：${d.definition}（正向：${d.positive}；反向：${d.negative}）`, d.indicators),
    ),
  ].join('\n')
}

export function buildEvaluationPrompt(candidate: Candidate, job: Job): string {
  const dimensionsList = [
    job.weights
      .map((dim) => {
        const tmpl = job.category ? getDimensionTemplate(job.category as JobCategory, dim.name) : undefined
        const base = `- ${dim.name}（权重 ${normalizeWeight(dim.weight)}%）`
        if (tmpl?.indicators && tmpl.indicators.length > 0) {
          return base + '\n  关键指标：' + tmpl.indicators.join('；')
        }
        return base
      })
      .join('\n'),
    buildBehaviorContext(job, 'evaluation'),
  ]
    .filter(Boolean)
    .join('\n\n')

  const candidateSkills = candidate.skills.length > 0 ? candidate.skills.join('、') : '无'
  const jobSkills = job.skills.length > 0 ? job.skills.join('、') : '无'
  const requirements =
    job.requirements.length > 0 ? job.requirements.map((item) => `  - ${item}`).join('\n') : '  - 无'

  return `请对以下候选人进行招聘评估，并直接返回严格 JSON 对象。
## 候选人信息
- 姓名：${candidate.name}
- 应聘岗位：${candidate.position}
- 教育背景：${candidate.education}
- 工作年限：${candidate.experience} 年
- 技能：${candidateSkills}
- 简历内容：
${candidate.resumeText}

## 岗位要求
- 职位名称：${job.title}
- 所属部门：${job.department}
- 岗位类别：${job.category || '未设置'}
- 岗位描述：${job.description}
- 任职要求：
${requirements}
- 期望技能：${jobSkills}

## 评分维度（满分 100）
${dimensionsList}

## 分档标准（必须严格执行）
- 90-100：该维度表现卓越，简历中有多条明确的优秀行为证据
- 70-89：该维度表现良好，有 2-3 条正面行为证据支撑
- 50-69：该维度表现一般，证据不足或正反参半
- 30-49：该维度表现较差，多数指标不达标或缺乏证据
- 0-29：该维度严重不足，几乎无正面证据

## 评分规则（必须遵守）
1. 简历中无法找到某维度的支撑证据，该维度得分不得超过 40
2. 每个维度必须基于关键指标逐条评判，不可笼统给分
3. 优秀候选人与不合格候选人的总分差距应在 20 分以上
4. 禁止所有维度给出相近分数，必须体现维度间的强弱差异
5. 对于"销售能力"维度，如简历未体现英语水平或订单数据，该项不得超过 35

## 返回格式（严格 JSON，不要使用 Markdown 代码块）
{
  "scores": [
    { "name": "维度名称", "weight": 权重数字, "score": 0-100 }
  ],
  "totalScore": 加权总分,
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["不足1", "不足2"],
  "suggestions": ["建议1", "建议2"]
}`
}

export function buildReportPrompt(assessment: Assessment, candidate: Candidate, job: Job): string {
  const scoresSummary = [
    assessment.scores
      .map(
        (score) => `- ${score.name}：${score.score} 分（权重 ${normalizeWeight(score.weight)}%）`,
      )
      .join('\n'),
    buildBehaviorContext(job, 'report'),
  ]
    .filter(Boolean)
    .join('\n\n')

  const strengths = assessment.strengths.map((strength) => `- ${strength}`).join('\n') || '- 无'
  const weaknesses = assessment.weaknesses.map((weakness) => `- ${weakness}`).join('\n') || '- 无'
  const suggestions = assessment.suggestions.map((suggestion) => `- ${suggestion}`).join('\n') || '- 无'

  return `请根据以下评估数据，生成一份专业的招聘评估报告（Markdown 格式）。
## 候选人
- 姓名：${candidate.name}
- 应聘职位：${job.title}（${job.department}）

## 评分结果
- 综合得分：${assessment.totalScore} 分
${scoresSummary}

## 优势
${strengths}

## 不足
${weaknesses}

## 建议
${suggestions}

请输出完整报告，包含：执行摘要、各维度详细分析、综合结论、用人建议。
## 格式要求（必须严格遵守）
- 表格必须使用 Markdown 管道符格式，例如：
  | 评估维度 | 得分 | 权重 | 说明 |
  |---------|------|------|------|
  | 专业技能 | 84 | 30% | 说明文字 |
- 综合得分需要单独成行，格式清晰，不要把数字和说明粘连。
- 使用 **加粗** 标记关键信息，使用 > 引用块标记重要结论。
- 各章节使用 ## 二级标题分隔。`
}
