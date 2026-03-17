import type { Candidate } from '$lib/types/candidate'
import type { Assessment, Job } from '$lib/types/assessment'

/** Normalize weight to percentage integer for display in prompts */
function normalizeWeight(weight: number): number {
  return weight <= 1 ? Math.round(weight * 100) : Math.round(weight)
}

export function buildEvaluationPrompt(candidate: Candidate, job: Job): string {
  const dimensionsList = job.weights
    .map(d => `- ${d.name}（权重${normalizeWeight(d.weight)}%）`)
    .join('\n')

  return `请对以下候选人进行招聘评估，返回JSON格式结果。

## 候选人信息
- 姓名：${candidate.name}
- 应聘职位：${candidate.position}
- 教育背景：${candidate.education}
- 工作年限：${candidate.experience}年
- 技能：${candidate.skills.join('、')}
- 简历内容：
${candidate.resumeText}

## 岗位要求
- 职位名称：${job.title}
- 所属部门：${job.department}
- 岗位描述：${job.description}
- 任职要求：
${job.requirements.map(r => '  - ' + r).join('\n')}
- 期望技能：${job.skills.join('、')}

## 评分维度（满分100）
${dimensionsList}

## 返回格式（严格JSON，直接输出对象，不要用markdown代码块包裹）
{
  "scores": [
    { "name": "维度名称", "weight": 权重数字, "score": 0-100分 }
  ],
  "totalScore": 加权总分,
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["不足1", "不足2"],
  "suggestions": ["建议1", "建议2"]
}`
}

export function buildReportPrompt(
  assessment: Assessment,
  candidate: Candidate,
  job: Job
): string {
  const scoresSummary = assessment.scores
    .map(s => `- ${s.name}：${s.score}分（权重${normalizeWeight(s.weight)}%）`)
    .join('\n')

  return `请根据以下评估数据，生成一份专业的招聘评估报告（Markdown格式）。

## 候选人
- 姓名：${candidate.name}
- 应聘职位：${job.title}（${job.department}）

## 评分结果
- 综合得分：${assessment.totalScore}分
${scoresSummary}

## 优势
${assessment.strengths.map(s => '- ' + s).join('\n')}

## 不足
${assessment.weaknesses.map(w => '- ' + w).join('\n')}

## 建议
${assessment.suggestions.map(s => '- ' + s).join('\n')}

请输出完整报告，包含：执行摘要、各维度详细分析、综合结论、用人建议。`
}
