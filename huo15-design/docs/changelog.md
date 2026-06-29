# huo15-design 变更历史

## v1.0.0（2026-06-30）— 首版

从 `aliyun-oss-and-design`（辉火云物料工程）沉淀而来，定位**生产交付层**（与 `huo15-openclaw-frontend-design` 美学层互补、不重复）。

- **SKILL.md**：方法论总览 + 七条铁律 + 分场景指路。
- **data/**：poster（原研哉/赛博风 + 截图出图）、card（A4 拼版/双面对齐免镜像/极浅细线剪裁/印刷可读性/名片尺寸）、web-delivery（og 分享卡/截图存档）、brand（配色/字体/口径/logo 资产）、oss（上传/清单/凭据）。
- **scripts/**：`cap_poster.js`（HTML→4K 截图）、`render_pdf.js`（HTML→A4 PDF + 分页）、`make_card.py`（卡片拼版，CONFIG 参数化 + 二维码 base64 内嵌）、`oss_upload.py`（OSS 上传，凭据走环境变量）。
- **templates/**：`poster_hara.html`（原研哉极简海报起手式）。
- 知识来源：原研哉极简 6 铁律（老人友好可读性）、双面名片拼版会话（对齐/裁切/可读性迭代）、OSS 资产工作流。
