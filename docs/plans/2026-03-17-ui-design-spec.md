# 智聘评估系统 - UI 设计规范

> 创建日期: 2026-03-17
> 来源: 从 `recruitment-assessment.html` demo 提取
> 规则: 所有前端开发必须严格遵循此规范，不得自行发挥

---

## 1. 设计风格

**整体风格:** 暖色商务极简风，暗色侧边栏 + 浅暖色内容区 + 橙色强调色

**参考关键词:** Warm Minimalism, SaaS Dashboard, 类似 Notion/Linear 的克制感但更温暖

**核心原则:**
- 克制用色，大面积留白
- 卡片式布局，圆角柔和
- 阴影轻薄，不浮夸
- 动效顺滑但不花哨

---

## 2. 色彩系统

### 主色板（从 demo 提取，必须严格使用）

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--bg-primary` | `#F7F5F2` | 页面背景（暖灰白） |
| `--bg-card` | `#FFFFFF` | 卡片背景 |
| `--bg-sidebar` | `#1A1D23` | 侧边栏背景（深灰黑） |
| `--bg-sidebar-hover` | `#2A2D35` | 侧边栏悬浮 |
| `--text-primary` | `#1A1D23` | 主文字 |
| `--text-secondary` | `#6B7280` | 次要文字 |
| `--text-sidebar` | `#E5E7EB` | 侧边栏文字 |
| `--accent` | `#D4763C` | **主强调色（橙色）** |
| `--accent-light` | `#E8945A` | 强调色浅色 |
| `--accent-bg` | `rgba(212,118,60,0.08)` | 强调色背景 |

### 语义色

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--success` | `#3B9B6D` | 成功/通过（绿） |
| `--success-bg` | `rgba(59,155,109,0.08)` | 成功背景 |
| `--warning` | `#D4963C` | 警告（橙黄） |
| `--warning-bg` | `rgba(212,150,60,0.08)` | 警告背景 |
| `--danger` | `#C75450` | 危险/不通过（红） |
| `--danger-bg` | `rgba(199,84,80,0.08)` | 危险背景 |
| `--info` | `#4A7FC7` | 信息（蓝） |
| `--info-bg` | `rgba(74,127,199,0.08)` | 信息背景 |

### Tailwind 映射

在 `app.css` 的 `@theme` 中注册这些颜色：

```css
@import "tailwindcss";

@theme {
  --color-bg-primary: #F7F5F2;
  --color-bg-card: #FFFFFF;
  --color-bg-sidebar: #1A1D23;
  --color-bg-sidebar-hover: #2A2D35;
  --color-text-primary: #1A1D23;
  --color-text-secondary: #6B7280;
  --color-accent: #D4763C;
  --color-accent-light: #E8945A;
  --color-success: #3B9B6D;
  --color-warning: #D4963C;
  --color-danger: #C75450;
  --color-info: #4A7FC7;
  --color-border: #E8E5E0;
}
```

---

## 3. 字体系统

| 用途 | 字体 | 大小 | 字重 |
|------|------|------|------|
| 正文 | Noto Sans SC | 14px | 400 |
| 侧边栏导航 | Noto Sans SC | 13.5px | 400 (常规) / 500 (选中) |
| 品牌标题 | Playfair Display | 22px | 700 |
| 页面标题 | Noto Sans SC | 16px | 600 |
| 小标签/徽章 | Noto Sans SC | 11px | 500 |
| 按钮文字 | Noto Sans SC | 13px | 500 |

**字体加载:**
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
```

**Tailwind 配置:**
```css
@theme {
  --font-sans: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: 'Playfair Display', serif;
}
```

---

## 4. 间距与圆角

| Token | 值 | 用途 |
|-------|------|------|
| `--radius` | `10px` | 普通卡片、按钮 |
| `--radius-lg` | `16px` | 大卡片、模态框 |
| 内边距-卡片 | `24px` | 卡片内边距 |
| 内边距-侧边栏项 | `11px 14px` | 导航项 |
| 间距-卡片之间 | `16px` | 卡片网格间距 |

---

## 5. 阴影

| Token | 值 | 用途 |
|-------|------|------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.04)` | 微阴影（输入框） |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.06)` | 标准阴影（卡片） |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.08)` | 强阴影（弹出层） |

**原则:** 阴影要轻，几乎看不出来，但能感觉到层次。

---

## 6. 动效

| 属性 | 值 |
|------|------|
| 默认过渡 | `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` |

**原则:**
- 所有交互元素（按钮、卡片、导航）都带过渡
- 悬浮变化微妙（轻微提亮或阴影加深）
- 不用弹跳、不用闪烁、不用 3D 翻转

---

## 7. 布局结构

```
┌──────────┬──────────────────────────────────┐
│          │  顶栏 (面包屑 + 操作按钮)          │
│  侧边栏   │──────────────────────────────────│
│  240px   │                                    │
│  暗色     │  内容区 (浅暖色背景)                │
│          │  - 卡片网格                         │
│          │  - 表格                             │
│          │  - 表单                             │
│          │                                    │
│          │                                    │
│  用户信息  │                                    │
└──────────┴──────────────────────────────────┘
```

- 侧边栏固定 240px，暗色背景
- 内容区可滚动，浅暖色背景 `#F7F5F2`
- 卡片白色背景，10px 圆角，轻阴影

---

## 8. 图标

**图标库:** iconfont (阿里巴巴图标库)
```html
<link rel="stylesheet" href="https://at.alicdn.com/t/c/font_4786498_1s0g2h9lafi.css">
```

使用方式: `<i class="iconfont icon-xxx"></i>`

**风格:** 线性图标，18px 大小，与文字对齐

---

## 9. 组件规范

### 按钮

```
主要按钮: bg-accent text-white, 圆角 radius, padding 10px 20px
次要按钮: bg-transparent border-border text-primary
危险按钮: bg-danger text-white
```

### 卡片

```
bg-white rounded-[10px] shadow-md p-6
hover: shadow-lg (微妙提升)
```

### 输入框

```
border border-border rounded-[10px] px-4 py-2.5
focus: border-accent ring-1 ring-accent/20
placeholder: text-secondary
```

### 徽章/标签

```
text-[11px] font-medium px-2 py-0.5 rounded-full
成功: bg-success-bg text-success
警告: bg-warning-bg text-warning
危险: bg-danger-bg text-danger
```

---

## 10. 禁止事项（红线）

- ❌ 不得使用纯黑 `#000000` 作为文字颜色
- ❌ 不得使用纯白 `#FFFFFF` 作为页面背景（用 `#F7F5F2`）
- ❌ 不得使用蓝色作为主强调色（主色是橙色 `#D4763C`）
- ❌ 不得使用尖角（所有元素至少 6px 圆角）
- ❌ 不得使用重阴影（最大不超过 `--shadow-lg`）
- ❌ 不得在侧边栏用浅色背景
- ❌ 不得自创颜色，所有颜色必须从上方色板中选取
- ❌ 不得使用花哨动效（抖动、弹跳、闪烁）
