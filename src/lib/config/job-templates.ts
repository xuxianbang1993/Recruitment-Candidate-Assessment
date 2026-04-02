import type { ScoreDimension } from '$lib/types/assessment'

export type JobCategory = 'management' | 'sales' | 'expert' | 'support'

export interface DimensionTemplate {
  name: string
  weight: number
  definition: string
  positive: string
  negative: string
  questions: string[]
  indicators: string[]
}

export interface JobTemplate {
  category: JobCategory
  label: string
  description: string
  dimensions: DimensionTemplate[]
}

export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  management: '管理岗',
  sales: '销售/业务岗',
  expert: '专业骨干岗',
  support: '职能支持岗',
}

export const JOB_TEMPLATES: Record<JobCategory, JobTemplate> = {
  management: {
    category: 'management',
    label: '管理岗',
    description: '一线主管、中层经理、高层管理者',
    dimensions: [
      { name: '领导力', weight: 25, definition: '带领团队达成目标，激励员工，解决冲突，营造积极氛围', positive: '明确分工，因材施教，团队士气高，人员流失率低', negative: '事必躬亲或放任不管，团队内部矛盾频发', questions: ['你如何带领低绩效团队实现改善？', '团队成员严重冲突时你怎么处理？', '你如何激励不同类型的下属？'], indicators: [] },
      { name: '战略思维', weight: 15, definition: '在公司战略框架下规划部门方向，前瞻性思考，识别机会与风险', positive: '能将战略转化为可执行计划，提前预判行业变化', negative: '只关注眼前事务，缺乏长远规划，被动响应变化', questions: ['你如何将公司年度目标分解到部门？', '举例你提前识别市场趋势并采取行动', '你如何平衡短期业绩与长期发展？'], indicators: [] },
      { name: '执行力', weight: 15, definition: '推动决策落地，关注结果而非过程，确保团队高效执行', positive: '设定清晰目标和里程碑，定期复盘，及时纠偏', negative: '计划停留在纸面，缺乏跟进，找客观原因解释失败', questions: ['描述你推动落地的重大决策，遇到什么阻力？', '执行偏离计划时你如何调整？', '你如何衡量团队执行效果？'], indicators: [] },
      { name: '人才培养', weight: 10, definition: '识别和培养关键人才，建设梯队，帮助下属成长', positive: '有人才培养计划，下属能力持续提升，有接班人', negative: '不愿花时间带人，核心员工流失，团队能力断层', questions: ['你如何识别团队中的高潜力人才？', '举例你培养了一个下属的成长过程', '你离开后团队能否平稳运转？'], indicators: [] },
      { name: '沟通协同', weight: 10, definition: '跨部门高效沟通，推动协作，化解分歧达成共识', positive: '主动与关联部门对齐目标，高效会议，信息透明', negative: '部门本位主义，沟通不畅导致信息断层', questions: ['举例你推动跨部门协作取得成效的经历', '其他部门不配合时你怎么办？', '你如何确保信息传递不失真？'], indicators: [] },
      { name: '价值观', weight: 10, definition: '认同公司核心价值观，诚信正直，遵守职业道德', positive: '言行一致，主动维护团队利益，面对利益冲突选择正确做法', negative: '推诿责任，背后议论同事，为个人利益损害团队', questions: ['你在工作中遇到利益冲突时如何处理？', '你如何看待团队合作中的公平问题？', '描述一次你主动承认错误的经历'], indicators: [] },
      { name: '责任心', weight: 10, definition: '对工作结果负责，关注细节，按时按质交付', positive: '主动跟进任务闭环，发现问题及时上报，不推卸责任', negative: '敷衍了事，遗漏关键细节，出问题后第一反应找借口', questions: ['举一个你超出预期完成任务的例子', '任务出了差错你通常怎么处理？', '你如何确保工作中的细节不被遗漏？'], indicators: [] },
      { name: '学习能力', weight: 5, definition: '快速掌握新知识新技能，主动学习成长', positive: '主动学习行业新知，快速将新技能应用到工作中', negative: '抗拒变化，重复犯同样错误，不愿接受新方法', questions: ['你最近学了什么新技能？如何应用？', '面对陌生任务你的学习方法是什么？', '举例你快速掌握新领域知识的经历'], indicators: [] },
    ],
  },
  sales: {
    category: 'sales',
    label: '销售/业务岗',
    description: '普通业务、资深业务、大客户经理',
    dimensions: [
      { name: '客户开发', weight: 25, definition: '主动开拓客户，识别需求，推进商机转化', positive: '持续开发新客户，转化率高，善于挖掘需求', negative: '等客户上门，不愿主动拜访，丢单不分析原因', questions: ['描述你成功开发一个大客户的全过程', '你通常如何寻找新的潜在客户？', '客户多次拒绝后你怎么调整策略？'] },
      { name: '目标导向', weight: 15, definition: '以目标为驱动，关注业绩结果，有强烈的达成意愿', positive: '主动设定挑战目标，持续追踪进度，想方设法达成', negative: '对目标无感，完不成找借口，缺乏紧迫感', questions: ['你上一份工作的业绩目标和达成情况？', '月中发现业绩落后你会怎么做？', '描述你超额完成目标的一次经历'] },
      { name: '沟通谈判', weight: 15, definition: '清晰表达产品价值，有效倾听，推进谈判达成合作', positive: '根据客户类型调整沟通方式，谈判有策略有底线', negative: '只会介绍产品不会倾听，谈判中轻易让步', questions: ['描述你通过谈判挽回即将丢失的订单', '客户提出不合理要求时你如何应对？', '你如何快速建立客户信任？'] },
      { name: '抗压韧性', weight: 10, definition: '在业绩压力和客户拒绝下保持积极状态和行动力', positive: '面对挫折迅速调整，保持高出勤和拜访量', negative: '遇到困难就消极，业绩不好时行为量下降', questions: ['你经历过最大的业绩压力是什么？', '连续被拒绝后你的心理状态？', '你如何在高压环境下保持动力？'] },
      { name: '执行纪律', weight: 10, definition: '遵守销售流程，按时提交报表，执行公司政策', positive: 'CRM数据及时更新，拜访计划按时执行', negative: '报表拖延，流程不遵守，客户信息不记录', questions: ['你的日常工作计划是如何安排的？', '你如何保证客户台账的更新？', '个人做法与公司流程冲突时你怎么处理？'] },
      { name: '价值观', weight: 10, definition: '认同公司核心价值观，诚信正直，遵守职业道德', positive: '言行一致，主动维护团队利益，面对利益冲突选择正确做法', negative: '推诿责任，背后议论同事，为个人利益损害团队', questions: ['你在工作中遇到利益冲突时如何处理？', '你如何看待团队合作中的公平问题？', '描述一次你主动承认错误的经历'] },
      { name: '责任心', weight: 10, definition: '对工作结果负责，关注细节，按时按质交付', positive: '主动跟进任务闭环，发现问题及时上报', negative: '敷衍了事，遗漏关键细节，出问题后找借口', questions: ['举一个你超出预期完成任务的例子', '任务出了差错你通常怎么处理？', '你如何确保细节不被遗漏？'] },
      { name: '学习能力', weight: 5, definition: '快速掌握新知识新技能，主动学习成长', positive: '主动学习行业新知，快速应用到工作中', negative: '抗拒变化，重复犯同样错误', questions: ['你最近学了什么新技能？', '面对陌生任务你怎么学？', '举例你快速掌握新领域知识的经历'] },
    ],
  },
  expert: {
    category: 'expert',
    label: '专业骨干岗',
    description: '模具业务/技术专家、技术骨干、团队队长',
    dimensions: [
      { name: '专业能力', weight: 30, definition: '岗位核心专业知识和技术能力，行业经验深度', positive: '能独立解决专业难题，输出方案有深度', negative: '技术理论多实操少，解决问题依赖他人', questions: ['描述你最擅长的专业领域和代表性项目', '你如何保持专业技能的更新？', '举例你运用专业能力解决棘手问题'], indicators: [] },
      { name: '问题解决', weight: 20, definition: '面对复杂模糊的问题能快速分析根因并找到可行方案', positive: '善于拆解复杂问题，方案有逻辑，能权衡多种方案', negative: '遇到复杂问题就卡住，方案缺乏深度或可行性', questions: ['描述你解决过的最复杂的技术/业务问题', '信息不完整时你如何做判断？', '你的问题分析思路通常是怎样的？'], indicators: [] },
      { name: '质量成本', weight: 15, definition: '关注产品/服务质量，同时具备成本控制意识（制造业核心）', positive: '交付质量稳定，主动优化流程降低成本', negative: '只追求速度不顾质量，或过度追求完美不考虑成本', questions: ['你如何平衡质量和成本？举实际案例', '发现质量隐患但修复成本高时怎么处理？', '举例你通过工艺改善降低成本的经历'], indicators: [] },
      { name: '沟通协同', weight: 10, definition: '与团队、跨部门、客户有效沟通，推进工作进展', positive: '能用非专业语言沟通技术问题，推动协作', negative: '沟通生硬，不愿解释专业细节，造成协作障碍', questions: ['你如何向非技术人员解释专业方案？', '专业判断与业务需求冲突时怎么处理？', '描述一次跨部门协作的经历'], indicators: [] },
      { name: '价值观', weight: 10, definition: '认同公司核心价值观，诚信正直，遵守职业道德', positive: '言行一致，主动维护团队利益', negative: '推诿责任，为个人利益损害团队', questions: ['你在工作中遇到利益冲突时如何处理？', '你如何看待团队合作中的公平问题？', '描述一次你主动承认错误的经历'], indicators: [] },
      { name: '责任心', weight: 10, definition: '对工作结果负责，关注细节，按时按质交付', positive: '主动跟进任务闭环，发现问题及时上报', negative: '敷衍了事，遗漏关键细节', questions: ['举一个你超出预期完成任务的例子', '任务出了差错你通常怎么处理？', '你如何确保细节不被遗漏？'], indicators: [] },
      { name: '学习能力', weight: 5, definition: '快速掌握新知识新技能，主动学习成长', positive: '主动学习行业新知，快速应用到工作中', negative: '抗拒变化，重复犯同样错误', questions: ['你最近学了什么新技能？', '面对陌生任务你怎么学？', '举例你快速掌握新领域知识的经历'], indicators: [] },
    ],
  },
  support: {
    category: 'support',
    label: '职能支持岗',
    description: '行政、后勤、HR、财务、采购、IT 支持',
    dimensions: [
      { name: '岗位专业', weight: 30, definition: '胜任本职工作所需的专业知识和操作技能', positive: '熟练掌握岗位技能，处理日常事务准确高效', negative: '基本操作不熟练，频繁出错需他人纠正', questions: ['描述你上一份工作的日常职责和工作量', '你最擅长的职能领域是什么？', '你如何保证日常工作的准确性？'], indicators: [] },
      { name: '服务意识', weight: 15, definition: '以内部客户需求为导向，主动提供支持，态度热情', positive: '主动询问需求，响应及时，获得好评', negative: '被动等待指令，态度冷淡，推诿其他部门', questions: ['你如何理解职能岗位的"服务"定位？', '举例你主动帮助其他部门解决问题', '多个部门同时找你且需求冲突时怎么处理？'], indicators: [] },
      { name: '沟通协同', weight: 15, definition: '跨部门有效沟通，清晰传递信息，协调资源推进工作', positive: '信息传递准确及时，能协调不同部门达成一致', negative: '沟通含糊不清，信息传递有遗漏，不敢协调', questions: ['描述你协调多个部门完成一项工作的经历', '两个部门意见不一致时你如何促成共识？', '你如何确保跨部门信息不遗漏？'], indicators: [] },
      { name: '计划执行', weight: 10, definition: '合理安排工作优先级，按计划推进，确保时效', positive: '日程管理清晰，紧急和重要事务区分得当', negative: '工作无计划，经常遗漏或延误', questions: ['你如何安排一天的工作优先级？', '举例你同时处理多项紧急事务的经历', '你用什么方法/工具管理任务？'], indicators: [] },
      { name: '应变抗压', weight: 10, definition: '面对突发事务和多任务压力保持高效应对', positive: '突发状况下冷静处理，快速找到替代方案', negative: '遇到意外就慌乱，无法调整工作节奏', questions: ['描述一次工作中的突发状况你如何应对', '设备故障/物资短缺需紧急处理时你怎么做？', '你如何在高压下保持工作质量？'], indicators: [] },
      { name: '价值观', weight: 10, definition: '认同公司核心价值观，诚信正直，遵守职业道德', positive: '言行一致，主动维护团队利益', negative: '推诿责任，为个人利益损害团队', questions: ['你在工作中遇到利益冲突时如何处理？', '你如何看待团队合作中的公平问题？', '描述一次你主动承认错误的经历'], indicators: [] },
      { name: '责任心', weight: 5, definition: '对工作结果负责，关注细节，按时按质交付', positive: '主动跟进任务闭环，发现问题及时上报', negative: '敷衍了事，遗漏关键细节', questions: ['举一个你超出预期完成任务的例子', '任务出了差错你通常怎么处理？', '你如何确保细节不被遗漏？'], indicators: [] },
      { name: '学习能力', weight: 5, definition: '快速掌握新知识新技能，主动学习成长', positive: '主动学习行业新知，快速应用到工作中', negative: '抗拒变化，重复犯同样错误', questions: ['你最近学了什么新技能？', '面对陌生任务你怎么学？', '举例你快速掌握新领域知识的经历'], indicators: [] },
    ],
  },
}

export function templateToWeights(category: JobCategory): ScoreDimension[] {
  return JOB_TEMPLATES[category].dimensions.map((dimension) => ({
    name: dimension.name,
    weight: dimension.weight,
    score: 0,
  }))
}

export function getDimensionTemplate(
  category: JobCategory,
  dimName: string,
): DimensionTemplate | undefined {
  return JOB_TEMPLATES[category]?.dimensions.find((dimension) => dimension.name === dimName)
}
