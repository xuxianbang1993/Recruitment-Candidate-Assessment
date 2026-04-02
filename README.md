# 智聘评估 (Recruitment Candidate Assessment)

AI 驱动的候选人评估系统，支持多维度智能打分、雷达图可视化对比、结构化报告生成与附件管理。

## 核心功能

- **AI 智能评估** — 支持 OpenAI / Claude / DeepSeek 多提供商策略切换，基于岗位模板进行多维度评分
- **简历解析** — 支持 PDF、Word 文档解析，多文件批量上传
- **可视化报告** — 雷达图 + KPI 卡片 + 结构化文本，支持 Word 导出
- **候选人对比** — 3-5 人多选对比，雷达图叠加展示
- **二次评估** — 补充附件后可触发 AI 重新评估，自动关联历史记录
- **附件管理** — 评估附件上传/查看/删除，支持类型与大小校验

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Svelte 5 + SvelteKit + TypeScript (strict) |
| 样式 | Tailwind CSS v4 (CSS-first @theme tokens) |
| 桌面 | Electron (主/渲染进程分离) |
| 数据库 | SQLite (better-sqlite3, WAL mode) |
| AI | OpenAI / Claude / DeepSeek (策略模式) |
| 图表 | Chart.js |

## 架构

```
Presentation (Svelte 组件)
    ↓
API Routes (+server.ts)
    ↓
Service (业务逻辑)
    ↓
DAO (数据访问)
    ↓
Foundation (数据库 / 文件系统)
```

设计模式：策略模式 (AI)、工厂模式 (AI/Resume)、单例模式 (DB)、模板方法 (Parser)、DAO (数据访问)

## 快速开始

```bash
# 安装依赖
npm install

# Web 开发模式
npm run dev

# Electron 桌面模式
npm run electron:dev

# 构建
npm run build

# Electron 打包 (Windows)
npm run electron:build
```

## 项目结构

```
src/
├── lib/
│   ├── components/          # UI 组件
│   │   ├── report/          # 报告相关组件
│   │   └── ...              # 通用组件
│   ├── server/
│   │   ├── ai/              # AI 策略 & Prompt
│   │   ├── db/              # 数据库 & DAO
│   │   └── services/        # 业务服务层
│   └── types/               # TypeScript 类型定义
├── routes/
│   ├── api/                 # API 端点
│   ├── assessment/          # 评估页面
│   ├── candidates/          # 候选人管理
│   ├── reports/             # 报告页面
│   └── settings/            # 设置页面
└── electron/                # Electron 主进程
```

## 版本历史

### v1.3.0 (2026-04-02)

**新功能**
- 附件管理系统（上传/查看/删除）
- AI 二次评估（补充附件后重新评分）
- 多人对比（3-5 人雷达图叠加）
- 简历多文件批量上传
- 销售岗位模板重构（8 维度 + KPI 指标）
- 评估 Prompt 增强（评分分级 + 区分度规则）

**修复与改进**
- XSS 安全加固（DOMPurify 消毒）
- 组件架构优化（ReportProse / ReportRadar）
- 设计令牌统一，清除硬编码颜色
- RadarChart canvas 资源清理与响应式优化

### v1.2.0

- Word 文档导出
- Markdown 渲染支持

### v1.1.0

- V2.0 评估维度模板集成
- 可视化报告（雷达图 + KPI 卡片）

### v1.0.0

- 核心评估流程
- 候选人管理
- AI 多提供商支持
- Electron 桌面应用

## 开发规范

详见 [docs/DEVELOPMENT-STRATEGY.md](docs/DEVELOPMENT-STRATEGY.md)

## License

Private — 深圳市奥科姆科技有限公司
