# 网页交付（生产侧）

> 本 skill 只管网页的**交付/上线/分享**，不管 UI 美学（那是 frontend-design）。

## 微信分享卡（og）—— 任何对外网页必配

```html
<meta property="og:title" content="标题（≤ 20 字）">
<meta property="og:description" content="一句话简介">
<meta property="og:image" content="https://huo15-odoo.oss-cn-qingdao.aliyuncs.com/图片/xxx-分享卡.jpg">
<meta name="twitter:card" content="summary_large_image">
```
- **缩略图规格**：1200×630、**不透明 JPG**（透明 PNG 微信不显示）、**绝对 URL**（走 OSS）。
- 分享卡图可用本 skill 出图：写一张 1200×630 HTML → `cap_poster.js xxx.html 分享卡.jpg 600 315 2` → 上 OSS。
- 不配 og：微信/QQ 转发无标题无缩略图，点击率骤降。

## 字体与图标

- 图标**内联 SVG**（要被截图/存档/PDF 的页面尤其；webfont 在无头渲染丢字形）。
- 自定义中文字体子集化或用系统字（PingFang SC / Microsoft YaHei）避免大体积/缺字。

## 网页存档出图

- 整页长截图：puppeteer `fullPage:true`；固定视口区域：`clip`。
- 关键页面留 PNG 存档（改版前后对比）；视口宽度按目标设备（移动 390 / 桌面 1280）。

## 落地/上线

- 静态站资产（图/视频/SVG/PDF/BGM）**全部走 OSS**（见 `data/oss.md`），HTML 里引 OSS 返回 URL。
- 官网在用的资源**保持原位不动**，新增的走 OSS 新对象。
