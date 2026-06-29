# 海报生产（出图）

> HTML 写版 → Puppeteer 无头 Chrome 截图 → 4K PNG。横竖双版、风格配方。

## 截图出图

```bash
node scripts/cap_poster.js <html> <out.png> <宽> <高> [scale]
node scripts/cap_poster.js hhk.html hhk.png 1920 1080 2   # 横版 4K(3840×2160)
node scripts/cap_poster.js hhk_v.html hhk_v.png 1080 1920 2  # 竖版 4K
```
要点（脚本已内置）：`waitUntil:'networkidle0'` + `await document.fonts.ready` + 400ms 兜底，否则字体/网图未加载就截图。`deviceScaleFactor=2` 出 2 倍图（投放清晰）。

## 交付规格

- 横版 1920×1080@2x（3840×2160）；竖版 1080×1920@2x（2160×3840，手机/抖音/朋友圈）。
- 导出 PNG（无损）+ JPG（`quality=92, optimize=True` 给微信/体积敏感场景）。
- **横竖版同步改**：改文案两份都改。

## 风格配方

### A. 原研哉极简（MUJI「空」）—— 印刷品/高端/课程首选
1. **米白底** `#f4f3ee`（不是纯白；打印到白纸自然成白）。
2. **留白 40-60%**，边距 ≥20mm，间距慷慨。
3. **极细字**：`font-weight:400`（不粗于 500）；中文 PingFang SC、英文无衬线。
4. **零装饰**：无边框/阴影/发光/网格/角标。
5. **单色系**：黑 `#1a1a1a` + 暖灰阶 `#666~#bbb`；**最多一处朱红** `#A83A2C` 点睛。
6. **图片保原比例** `object-fit:contain`，禁 `cover` 裁切。
- 反模式（赛博风→原研哉）：深蓝底→米白；Orbitron 粗体荧光→PingFang regular；glow/gradient→零特效；四角标+网格→一张白纸。

### B. 科技赛博 —— 产品/发布/炫技
- 深底 `#070b12`；标题 Orbitron / 正文 Rajdhani（Google Fonts CDN 可用）；霓虹 glow/gradient；四角标 + 网格背景。

## 老人友好（可读性，海报同样适用）
- 最小字号 ≥9px（打印后）；文字/底对比 ≥4:1；行距慷慨；一页 ≤3-4 个信息组。
- 教训：首版 7-9px + `#b0b0a8` 灰几乎看不清 → 标题 34px/400、正文 9-13px、文字色 `#666~#1a1a1a`。

## 坑
- **禁图标 webfont**（Tabler/FA webfont 无头截图丢字形）→ 一律内联 SVG。
- Chrome 路径硬编码 `/Applications/Google Chrome.app/...`，换机改。
- 预览截图视口必须 == CSS 像素，否则留白偏移、误判排版。
