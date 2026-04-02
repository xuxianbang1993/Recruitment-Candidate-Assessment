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
      { name: '目标感', weight: 15, definition: '以目标为驱动，关注结果，有强烈的达成意愿和分解能力', positive: '主动设定挑战目标，持续追踪进度，想方设法达成，为目标付出额外努力', negative: '对目标无感，完不成找借口，缺乏紧迫感，轻易放弃', questions: ['你上一份工作的业绩目标和达成情况？', '月中发现业绩落后你会怎么做？', '描述你为达成一个困难目标坚持到底的经历'], indicators: ['清晰的目标分解能力（年→季→月→周）', '为达成目标愿意付出的行为证据（加班、主动开发、调整策略）', '面对困难时的坚持力和毅力（不轻易放弃的实例）'] },
      { name: '勤奋度', weight: 15, definition: '工作投入度高，主动付出额外时间和精力提升业绩', positive: '高出勤率，主动加班跟进客户，利用休息时间学习产品知识，行为量持续保持高位', negative: '准时下班从不加班，工作量刚好达标，不愿额外付出，缺乏紧迫感', questions: ['描述你最忙碌的一段工作经历，你是如何安排时间的？', '你的日常客户拜访量/电话量是多少？', '你是否有利用业余时间提升自己的习惯？'], indicators: ['加班/自主学习等额外时间投入频率', '主动出击频率（日均拜访量、电话量、邮件量）', '利用休息时间提升业务的行为（自学产品、研究市场、维护客户关系）'] },
      { name: '沟通能力', weight: 15, definition: '清晰表达、有效倾听、推动协作达成共识', positive: '根据客户类型调整沟通方式，逻辑清晰，能快速建立信任，跨部门协作顺畅', negative: '表达混乱，只会单向输出不会倾听，跨部门沟通困难', questions: ['描述你通过沟通成功说服客户的经历', '客户提出不合理要求时你如何应对？', '你如何与工厂/技术部门协调交期问题？'], indicators: ['表达清晰度与逻辑性（能否简洁传递核心信息）', '跨部门/跨文化沟通效率（与工厂、物流、技术的协作）', '冲突调解与共识达成能力（客户投诉、内部分歧处理）'] },
      { name: '抗压能力', weight: 10, definition: '在业绩压力和客户拒绝下保持积极状态和行动力', positive: '面对挫折迅速调整，保持高出勤和拜访量，情绪稳定不影响工作', negative: '遇到困难就消极，业绩不好时行为量下降，容易情绪化', questions: ['你经历过最大的业绩压力是什么？如何应对的？', '连续被客户拒绝后你的心理状态和行动？', '描述一次高压下你仍然完成任务的经历'], indicators: ['高压环境下的情绪稳定性（是否影响工作表现）', '连续遭拒后的恢复速度与行动力（多快重新出发）', '持续高强度工作的耐力（旺季/紧急项目期间的表现）'] },
      { name: '学习能力', weight: 10, definition: '快速掌握新产品、新市场、新技能，并转化为业绩', positive: '主动学习行业新知，快速掌握新产品卖点，将学习成果应用到客户开发中', negative: '抗拒变化，重复犯同样错误，不愿接受新方法和新工具', questions: ['你最近学了什么与工作相关的新知识？如何应用？', '接手新产品线时你的学习方法是什么？', '举例你快速掌握新领域知识并产生业绩的经历'], indicators: ['新产品/新市场知识的掌握速度（从零到能独立介绍需要多久）', '学习方法论与自驱学习行为（是否有系统学习习惯）', '将新知识转化为业绩的能力（学以致用的实例）'] },
      { name: '销售能力（业务、英语水平）', weight: 20, definition: '综合业务开发能力，包括英语沟通、谈判成交和客户开发', positive: '英语沟通流利，谈判有策略有底线，持续开发新客户，转化率高，订单额持续增长', negative: '英语无法应对商务场景，谈判中轻易让步，等客户上门不主动开发', questions: ['请用英语简单介绍你的工作经历（现场测试）', '描述你成功开发一个大客户的全过程', '你以往的年度/季度订单总额大概是多少？', '描述一次艰难谈判你是如何成交的'], indicators: ['英语口语沟通水平（日常/商务/谈判级别，是否能独立接待外商）', '谈判能力与成交技巧（报价策略、异议处理、促成签约）', '客户开发能力（新客户获取渠道和方法、开发成功率）', '以往订单总额/业绩数据（可量化的销售成果）'] },
      { name: '价值观', weight: 10, definition: '认同公司核心价值观，诚信正直，遵守职业道德', positive: '言行一致，主动维护团队利益，面对利益冲突选择正确做法，客户关系健康透明', negative: '推诿责任，背后议论同事，为个人利益损害团队，客户关系不透明', questions: ['你在工作中遇到利益冲突时如何处理？', '你如何看待带走客户资源跳槽的行为？', '描述一次你主动承认错误的经历'], indicators: ['诚信正直的行为表现（是否有隐瞒、欺骗、飞单等行为）', '团队协作精神与利他行为（是否愿意分享经验、帮助同事）', '对公司文化和制度的认同度（是否遵守流程、维护公司形象）'] },
      { name: '管理潜力', weight: 5, definition: '展现出领导力萌芽，有带团队和规划组织的潜质', positive: '主动带新人，能组织小型活动/项目，同事愿意跟随，有全局观', negative: '只关注个人业绩，不愿分享或帮助他人，缺乏全局视角', questions: ['你有带新人或带小团队的经历吗？', '你觉得一个好的销售主管应该具备什么能力？', '如果让你管理3-5人的小团队，你会怎么安排工作？'], indicators: ['领导力萌芽表现（是否主动带新人、组织团队活动）', '团队影响力与号召力（同事是否愿意听从建议）', '规划组织能力的初步体现（是否展现过项目管理或资源协调能力）'] },
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
