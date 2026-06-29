# 火一五物料生产技能（huo15-design）

> 设计 → **生产交付**层：把 HTML/SVG 设计稿**出图 / 转 PDF / A4 拼版印刷 / 配微信分享卡 / 上 OSS**。
> 美学/UI/design tokens 交给 [`huo15-openclaw-frontend-design`](../huo15-openclaw-frontend-design)；本 skill 负责把它落地成可投放、可打印、可下载的成品。

## 能做什么

| 物料 | 能力 | 脚本 |
|------|------|------|
| 海报 / 易拉宝 | HTML → 4K PNG 截图（横竖版、等字体加载） | `scripts/cap_poster.js` |
| 卡片 / 名片 / 印刷品 | A4 双面拼版 → PDF（对齐免镜像、极浅细线剪裁、印刷可读性） | `scripts/make_card.py` + `scripts/render_pdf.js` |
| 网页 | 微信分享卡(og 1200×630)、整页截图存档 | `data/web-delivery.md` |
| Logo | 位图复刻成 SVG（PIL 先量后画） | `data/`（方法）|
| 上线 | 图/视频/SVG/PDF 上阿里云 OSS 拿公网 URL | `scripts/oss_upload.py` |

## 快速上手

```bash
cd scripts && npm i puppeteer-core            # 首次：无头 Chrome 驱动

# 海报：HTML → 4K 横版
node cap_poster.js my.html my.png 1920 1080 2

# 名片：改 make_card.py 顶部 CONFIG/文案 → 生成 → 出 PDF（双面+分页）
python3 make_card.py
node render_pdf.js card_sheet.html card.pdf landscape 2

# 上 OSS（凭据走环境变量）
export OSS_KEY_ID=... OSS_KEY_SECRET=... OSS_ENDPOINT=https://oss-cn-qingdao.aliyuncs.com OSS_BUCKET=huo15-odoo
python3 oss_upload.py my.png 图片/my.png
```

## 七条铁律

见 [`SKILL.md`](SKILL.md)：① 图标内联 SVG 禁 webfont ② 印刷可读性(色≥#666/字≥6.5px/小字 weight500) ③ 双面对齐免镜像·100% 不缩放 ④ 网页必配 og 分享卡 ⑤ 资产走 OSS ⑥ 复刻位图先量后画 ⑦ 横竖同步改。

## 结构

```
huo15-design/
├── SKILL.md            入口（方法论 + 铁律 + 指路）
├── data/               poster / card / web-delivery / brand / oss 五份参考
├── scripts/            cap_poster.js / render_pdf.js / make_card.py / oss_upload.py
└── templates/          poster_hara.html（原研哉极简起手式）
```

## 依赖

- Node.js + `puppeteer-core` + 本机 Google Chrome（路径 `CHROME_PATH` 环境变量可覆盖）。
- Python3 + `oss2`（仅上传 OSS 时）；`Pillow`（仅复刻位图量色时）。

---

**技术支持：** 青岛火一五信息科技有限公司
