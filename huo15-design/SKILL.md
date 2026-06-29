---
name: huo15-design
displayName: 火一五物料生产技能
description: 把设计稿（HTML）生产成可交付物料的「出图 / 印刷 / 拼版 / 上线」流水线。HTML→无头 Chrome 截图（4K 海报、横竖版、视频帧）；HTML→PDF + A4 拼版（卡片 / 名片 / 易拉宝，双面对齐免镜像、零间隙极浅细线剪裁、印刷可读性硬规则）；原研哉极简印刷风配方；微信分享卡（og 1200×630）产出；位图复刻成 SVG（PIL 先量后画）；所有 Web 资产走阿里云 OSS（上传→刷新清单→用返回 URL）。Use when：做海报/易拉宝/展架要导出成图或 PDF、做卡片/名片/印刷品要 A4 拼版打印裁切、把网页/图/视频/SVG/PDF 上 OSS 拿公网 URL、给网页配微信分享卡、把位图 logo 复刻成 SVG、原研哉极简风印刷物料。Do NOT use for：网页/H5/小程序/APP 的 UI 美学设计、design tokens、配色字体方向选型（那是 huo15-openclaw-frontend-design / design-director 的活，本 skill 负责把它们的产出「出图、印刷、拼版、上线」）。触发词：出海报、导出海报、海报截图、做卡片、做名片、A4 拼版、双面打印、裁切、印刷、易拉宝、HTML 转 PDF、HTML 转图片、无头截图、分享卡、og image、微信预览、上 OSS、传 OSS、图片转 SVG、logo 矢量化、原研哉、极简风印刷。
version: 1.0.0
homepage: https://cnb.cool/huo15/ai/huo15-skills
aliases:
  - 火一五物料生产技能
  - 火一五出图技能
  - 火一五印刷拼版技能
  - 火一五海报卡片技能
metadata: { "openclaw": { "emoji": "🖨️", "requires": { "bins": ["node", "python3"] } } }
---

# 火一五物料生产技能（huo15-design）

> **定位**：设计→**生产交付**层。美学/UI/tokens 交给 `huo15-openclaw-frontend-design` 与 `huo15-openclaw-design-director`；本 skill 负责把 HTML/SVG **出图、转 PDF、A4 拼版印刷、配分享卡、上 OSS**。
> 公司：青岛火一五信息科技有限公司 ｜ 品牌：辉火云 / 逸寻智库 / 龙虾管家。

## 何时用

- 把一张 HTML 设计稿**导出成 4K 海报图 / 横竖版**（投放、朋友圈、抖音封面）。
- 做**卡片 / 名片 / 易拉宝**：A4 一页排多张、双面、留裁切线、打印后裁切。
- 把**图 / 视频 / SVG / PDF** 传阿里云 OSS，拿公网 URL 给网页/文档用。
- 给网页配**微信分享卡**（og:title/description/image）。
- 把**位图 logo 复刻成 SVG**（可缩放/改色/极小体积）。

## 技术底座

```
HTML/CSS/SVG  ──(Puppeteer 无头 Chrome)──▶  PNG 截图 / PDF
                                              │
                          ffmpeg(可选,视频)   ▼
                                         成品 ──▶ 阿里云 OSS ──▶ 公网 URL
```
- 渲染引擎：`puppeteer-core` + 本机 Google Chrome（路径硬编码，换机改）。
- 脚本（本 skill `scripts/` 自带，零/轻依赖）：
  - `cap_poster.js` — HTML→静态截图（等 `fonts.ready`，支持 `deviceScaleFactor` 出 4K）。
  - `render_pdf.js` — HTML→A4 PDF（含 `pageRanges` 分页导出正/反单页）。
  - `make_card.py` — 卡片 A4 双面拼版生成器（尺寸/张数/正反文案参数化，二维码 base64 内嵌）。
  - `oss_upload.py` — 上传 OSS（凭据走环境变量，绝不写进 skill）。
- 模板：`templates/poster_hara.html`（原研哉极简海报起手式）。

## 七条铁律（最易踩坑）

1. **图标只用内联 SVG，禁图标 webfont** —— 无头截图必丢字形（Tabler/FontAwesome webfont 渲染为空）。
2. **印刷可读性（老人友好）** —— 纸上可读文本：颜色**不浅于 `#666`**、字号**≥ ~6.5px**、小字 `font-weight:500`（细笔画印刷会丢）。浅灰小字在屏幕好看、打印发虚。
3. **双面拼版对齐** —— **居中对称栅格**（列/行对称）+ 同面每张内容相同 ⇒ 翻页**免镜像**，长边/短边翻都对齐；零间隙相邻卡**共用一条极浅细线**（`outline:0.2mm #d2cfc8`）剪刀沿线一刀两张；打印务必 **100% 不缩放**。
4. **网页必配微信分享卡** —— og:title / og:description / og:image（**1200×630 不透明 jpg、绝对 URL**），否则微信转发无缩略图。
5. **所有 Web 资产走 OSS** —— 传 `huo15-odoo` 桶（青岛）→ 刷新清单 → 用返回 URL；大文件不进 git。
6. **复刻位图先量后画** —— 用 PIL 逐像素采样颜色/坐标，再写 `<rect>`/`<path>`，不靠肉眼估。
7. **横竖版同步改** —— 改文案时横版/竖版两份都要改；预览截图视口要等于 CSS 像素（A4 横向=1122×794px@96dpi）否则误判排版。

## 分场景指南（按需展开读 data/）

| 场景 | 读这个 |
|------|--------|
| 海报：风格配方 / 截图出图 / 横竖版 / 4K | `data/poster.md` |
| 卡片名片：A4 拼版 / 双面对齐 / 裁切线 / 印刷可读性 / 名片尺寸 | `data/card.md` |
| 网页交付：og 分享卡 / 截图存档 / 字体图标 | `data/web-delivery.md` |
| 品牌规范：配色 / 字体 / 口径 / logo 资产 / 公司信息 | `data/brand.md` |
| OSS 工作流：上传 / 刷新清单 / URL 规则 / 凭据 | `data/oss.md` |

## 快速上手

```bash
# 0) 首次：装无头 Chrome 驱动
cd <skill>/scripts && npm i puppeteer-core   # 或复用项目已装的

# 1) 海报：HTML → 4K 横版
node scripts/cap_poster.js my_poster.html my_poster.png 1920 1080 2

# 2) 卡片：编辑 scripts/make_card.py 顶部 CONFIG（尺寸/张数/正反文案）后
python3 scripts/make_card.py            # 生成拼版 HTML
node scripts/render_pdf.js card_sheet.html card.pdf   # → A4 PDF（双面+分页）

# 3) 上 OSS 拿 URL
export OSS_KEY_ID=... OSS_KEY_SECRET=... OSS_ENDPOINT=... OSS_BUCKET=...
python3 scripts/oss_upload.py my_poster.png 图片/my_poster.png   # 打印公网 URL
```

## 与其它技能接力

- **`huo15-openclaw-frontend-design`** 出设计稿（HTML + design tokens）→ 本 skill 出图/印刷/上线。
- **`huo15-openclaw-design-director`** 定风格方向 → frontend-design 落地 → 本 skill 交付。

---

**技术支持：** 青岛火一五信息科技有限公司
