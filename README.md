# 智聘评估 (Recruitment Candidate Assessment)

AI 驱动的候选人评估系统，支持多维度智能打分、雷达图可视化对比、结构化报告生成与附件管理。

## 核心功能

- **岗位中心化管理** — 候选人通过 job_id 绑定岗位，三大页面以岗位为维度筛选
- **AI 智能评估** — 支持 OpenAI / Claude / DeepSeek 多提供商策略切换，基于岗位模板进行多维度评分
- **AI 对话增强** — 注入数据库全量上下文到 AI 对话，支持 Markdown 渲染
- **简历解析** — 支持 PDF、Word 文档解析，多文件批量上传，扫描件自动 OCR 识别
- **简历信息库** — AI 结构化解析简历，按岗位过滤浏览，支持手动编辑与重新解析
- **可视化报告** — 雷达图 + KPI 卡片 + 结构化文本，支持 Word 导出
- **候选人对比** — 3-5 人多选对比，雷达图叠加展示
- **二次评估** — 补充附件后可触发 AI 重新评估，自动关联历史记录
- **附件管理** — 评估附件上传/查看/删除，支持类型与大小校验
- **热更新** — 侧边栏一键检查 GitHub 更新，自动拉取代码 + 安装依赖

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Svelte 5 + SvelteKit + TypeScript (strict) |
| 样式 | Tailwind CSS v4 (CSS-first @theme tokens) |
| 桌面 | Electron (主/渲染进程分离) |
| 数据库 | SQLite (better-sqlite3, WAL mode) |
| AI | OpenAI / Claude / DeepSeek (策略模式) |
| OCR | PaddleOCR v4 (multilingual-purejs-ocr, ONNX) |
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

设计模式：策略模式 (AI)、工厂模式 (AI/Resume)、单例模式 (DB/OCR)、模板方法 (Parser)、DAO (数据访问)、责任链 (简历解析)

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
│   ├── resume-profiles/     # 简历信息库
│   ├── reports/             # 报告页面
│   └── settings/            # 设置页面
└── electron/                # Electron 主进程
```

## 版本历史

### v1.5.0 (2026-04-10)

**新功能**
- 简历信息库 — AI 结构化解析简历，自动提取姓名/联系方式/工作经历/教育背景/项目经验等
- 扫描件 OCR — 图片型 PDF 自动降级为 PaddleOCR v4 中文识别，支持离线使用
- 简历档案 CRUD — 按岗位过滤浏览，支持手动编辑、重新 AI 解析、级联删除
- 上传自动解析 — 简历上传时自动触发结构化解析，结果同步到简历信息库

**技术改进**
- PDF 引擎升级 — 从 pdf-parse 迁移到 unpdf (Mozilla pdf.js)，提升中文 CJK 提取质量
- 责任链模式 — 简历解析流程使用 Chain of Responsibility (文本清洗 → AI 解析 → 数据验证)
- 数据库扩展 — 新增 4 张表 (resume_profiles, work_experiences, education_history, project_experiences)
- OcrService 单例 — Promise 缓存防并发竞态，MAX_OCR_PAGES=20 限制内存消耗

**修复**
- 扫描件 PDF 上传不再返回 500 服务器内部错误
- 简历信息库页面 $effect 无限循环导致加载卡死
- unpdf getDocumentProxy 与 renderPageAsImage 的 worker 冲突

### v1.4.0 (2026-04-08)

**新功能**
- 岗位中心化重构 — candidates 表新增 job_id 外键，简历管理/智能分析/匹配报告三个页面以岗位为维度筛选
- AI 对话增强 — 注入数据库全量上下文到 system prompt，ChatBubble 支持 Markdown 渲染
- 热更新 — 侧边栏一键检查 GitHub 更新，git pull + npm install + Vite HMR 自动刷新

**安全修复**
- ChatBubble XSS — DOMPurify 加载前不渲染 HTML，改用纯文本回退
- Prompt injection 防护 — `<data>` 标签分隔 + 三明治防御 + 角色过滤
- reports 页面 DOMPurify 静态导入改为动态导入（SSR 安全）

**改进**
- 数据模型：迁移 004 清除旧数据后再添加 FK 列，确保数据完整性
- Token 控制：chat-context 添加 MAX_JOBS/MAX_CANDIDATES/MAX_TOTAL_CHARS 限制
- 批量删除：新增岗位级 DELETE 端点，替代逐条删除循环
- 竞态修复：reports 页面 $effect 添加请求序号防止 stale 响应覆盖
- 设计令牌：ChatBubble + app.css 硬编码颜色全部替换为 CSS 变量
- 导入规范：统一为 type → external → $lib → relative 顺序
- 测试增强：新增 getByJobId、deleteByJobId、FK 级联删除等测试（50 PASS）

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
