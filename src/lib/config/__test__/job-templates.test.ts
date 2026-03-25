import assert from 'node:assert/strict'

import {
  JOB_CATEGORY_LABELS,
  JOB_TEMPLATES,
  getDimensionTemplate,
  templateToWeights,
} from '../job-templates.ts'

function run(): void {
  assert.deepEqual(JOB_CATEGORY_LABELS, {
    management: '管理岗',
    sales: '销售/业务岗',
    expert: '专业骨干岗',
    support: '职能支持岗',
  })

  for (const [category, template] of Object.entries(JOB_TEMPLATES)) {
    assert.equal(template.category, category)
    assert.equal(
      template.dimensions.reduce((sum, dimension) => sum + dimension.weight, 0),
      100,
    )
    assert.ok(template.dimensions.every((dimension) => dimension.questions.length === 3))
  }

  assert.deepEqual(templateToWeights('management').slice(0, 2), [
    { name: '领导力', weight: 25, score: 0 },
    { name: '战略思维', weight: 15, score: 0 },
  ])

  assert.deepEqual(getDimensionTemplate('support', '服务意识'), {
    name: '服务意识',
    weight: 15,
    definition: '以内部客户需求为导向，主动提供支持，态度热情',
    positive: '主动询问需求，响应及时，获得好评',
    negative: '被动等待指令，态度冷淡，推诿其他部门',
    questions: [
      '你如何理解职能岗位的"服务"定位？',
      '举例你主动帮助其他部门解决问题',
      '多个部门同时找你且需求冲突时怎么处理？',
    ],
  })

  assert.equal(getDimensionTemplate('sales', '不存在的维度'), undefined)
}

run()
