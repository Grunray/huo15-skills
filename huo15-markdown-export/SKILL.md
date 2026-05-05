---
name: huo15-markdown-export
displayName: 火一五排版技能
description: 【青岛火一五】Typora 风 markdown 渲染管线 — .md 导出 PDF / Word / HTML / 长图 / 公众号 inline / changelog。7 主题(typora-newsprint/night/github/academic/wechat/xiaohongshu/huo15-brand)。Node + markdown-it + Puppeteer + qrcode。与 office-doc 互补(它走公文,本 skill 走 md 视觉美学)。capability detection 集成 enhance:装了 huo15-openclaw-enhance 时 md-share/md-publish 输出 JSON,AI chain 调 enhance_share_file 拿 bot_base_url/plugins/enhance-share/<token> 公网 URL 发企微/钉钉/微信;无 enhance 独立可跑。v0.3.0:md-publish 多端发布 + 归档 ~/knowledge/huo15/;HTML 自动 OG 卡片(微信粘贴显示标题摘要);PDF --qr-url 嵌二维码。触发词:导出 PDF、导出 Word、md 转 PDF、Typora、长图、小红书、朋友圈长图、微信公众号、博客导出、复盘、changelog、版本对比、品牌报告、发到企微、发给客户、分享链接、公网链接、发布、归档、卡片预览、二维码、排版、火一五排版。
version: 0.3.0
aliases:
  - 火一五排版技能
  - 火一五排版
  - 火一五Markdown技能
  - 火一五Typora替代
  - 火一五PDF导出技能
  - 火一五出版技能
  - 火一五发布技能
  - 火一五美化排版
  - 火一五分享文档
  - 火一五长图技能
  - 火一五二维码PDF
  - markdown 渲染
  - markdown 导出
  - md2pdf
  - md2docx
  - md2image
  - md2wechat
  - md-publish
dependencies:
  npm-packages:
    - markdown-it
    - puppeteer
    - katex
    - juice
    - highlight.js
  optional-binaries:
    - pandoc        # 仅 md2docx 必需
    - weasyprint    # 仅 --engine pandoc 走 weasyprint 路线时
---

# 火一五 Markdown 视觉渲染管线 v0.1.0

> Typora 不需要复刻——它的能力本来就是开源拼装的。这个 skill 把同一套拼装做成 AI 可调用的版本。

**愿景:** 加速企业向全场景人工智能机器人转变
**理念:** 打破信息孤岛,用一套系统驱动企业增长

---

## 〇、与 `huo15-openclaw-office-doc` 的边界(必读)

| 维度 | huo15-openclaw-office-doc | huo15-markdown-export(本 skill) |
|---|---|---|
| 输入 | 自然语言指令(写合同/写 PRD) | 已有的 markdown 文件 |
| 引擎 | python-docx + reportlab(结构化直出) | markdown-it + Puppeteer + Pandoc |
| 适用 | 合同 / PRD / 会议纪要 / 故障报告等**结构化业务公文** | 技术博客 / 复盘 / 营销文案 / 客户报告等**视觉化 markdown** |
| 主题 | 一套企业公文规范 | 7 套(报纸风/暗色/学术/公众号/小红书/品牌等) |
| 多端 | docx / PDF | docx / PDF / HTML / 长图 / 公众号 inline / live preview |

**选择规则**:用户给"目的+主题"让你**写**新文档 → office-doc;用户给一份**已有的 .md** 让你"导出/渲染/换主题/做长图" → 本 skill。

---

## 一、能干什么(7 个工具一图)

```
input.md ──┬──► md2pdf.sh        ──► input.pdf      Chromium 打印,7 主题
           │     └─ md2pdf-puppet.js  (推荐)
           │     └─ pandoc engine     (可选,需 weasyprint/xelatex)
           │
           ├──► md2docx.sh       ──► input.docx     Pandoc + reference.docx 模板
           │
           ├──► md2html.js       ──► input.html     单文件自包含,可邮件可离线
           │
           ├──► md2image.js      ──► input.png      1080px 长图(小红书/朋友圈)
           │
           ├──► md2wechat.js     ──► input.wechat.html  juice 内联,粘到公众号编辑器
           │
           ├──► md-preview.js    ──► http://localhost  改文件自动 reload + 主题热切换
           │
           └──► md-diff.sh <from> <to>  ──► changelog.pdf   git ref 之间的变更报告
```

---

## 二、最小可用流程

```bash
# 1. 第一次用先装依赖
bash scripts/install-deps.sh

# 2. 用样例文件试一发
node scripts/md2pdf-puppet.js examples/sample.md             # → examples/sample.pdf
node scripts/md2html.js       examples/sample.md             # → examples/sample.html
node scripts/md2image.js      examples/sample.md             # → examples/sample.png(小红书)
node scripts/md2wechat.js     examples/sample.md             # → examples/sample.wechat.html

# 3. 实时预览
node scripts/md-preview.js    examples/sample.md             # 浏览器开 http://127.0.0.1:7777
```

---

## 三、主题选择决策树(给 AI 用)

| 用户场景关键词 | 选哪个 | 用什么脚本 |
|---|---|---|
| "技术博客 / 长文随笔 / 个人复盘" | `typora-newsprint` | `md2pdf` 或 `md2html` |
| "夜间阅读 / 投影 / 暗色" | `typora-night` | `md2html` |
| "GitHub / 开源 / API 文档" | `github` | `md2pdf` |
| "学术论文 / IEEE / 投稿初稿" | `academic` | `md2pdf` |
| "微信公众号 / 推文" | `wechat` | `md2wechat` |
| "小红书 / 朋友圈 / 长图文" | `xiaohongshu` | `md2image` |
| "公司报告 / 客户提案 / 内部周报 / 带页眉页脚" | `huo15-brand` | `md2pdf` |
| "changelog / release notes / 版本对比" | `huo15-brand` | `md-diff` |

**用户没说就默认** `typora-newsprint`。

---

## 四、关键参数速查

### `md2pdf-puppet.js`
```bash
node scripts/md2pdf-puppet.js <input.md> [output.pdf] \
  --theme typora-newsprint     # 7 选 1
  --paper A4                   # A4 / Letter / A3 / A5
  --margin 18                  # 四边等距 mm(默认 18)
  --header "我的文档"          # 自定义页眉(huo15-brand 主题已内置)
  --footer "{pageNumber} / {totalPages}"
  --print-urls                 # 链接后追加 (URL) 文本
  --no-mermaid                 # 跳过 mermaid 等待加速
```

### `md2docx.sh`(需先装 pandoc)
```bash
bash scripts/md2docx.sh <input.md> [output.docx] \
  --no-toc                              # 不要目录
  --reference templates/reference.docx  # 自定义模板
```

### `md2image.js`
```bash
node scripts/md2image.js <input.md> [output.png] \
  --theme xiaohongshu          # 默认 xiaohongshu
  --width 1080                 # 画幅宽度
  --scale 2                    # 倍清(2 = retina)
```

### `md-diff.sh`
```bash
bash scripts/md-diff.sh <from-ref> <to-ref> [output.pdf] \
  --theme huo15-brand          # 默认 huo15-brand
  --repo /path/to/git/repo     # 默认当前目录
```

---

## 五、AI 调用模式(集成到对话流)

### 模式 A:一步导出
> 用户:"把这份分析报告导成 PDF 给我"
> AI:Bash → `bash scripts/md2pdf.sh /tmp/report.md /tmp/report.pdf --theme huo15-brand`

### 模式 B:导出 + 转发(联动 huo15-wecom)
> 用户:"复盘报告导成 PDF 发到运营群"
> 1. AI 写 `report.md` 到 `/tmp`
> 2. AI 调本 skill 导 PDF → `/tmp/report.pdf`
> 3. AI 调 `huo15-wecom` 发文件到目标群

### 模式 C:多端并行(一份 md 多种产出)
> 用户:"这篇文章我要发公众号 + 小红书 + 个人博客"
> AI 并行:
> - `md2wechat.js article.md` → 公众号粘贴版
> - `md2image.js article.md --theme xiaohongshu` → 小红书长图
> - `md2html.js article.md --theme typora-newsprint` → 博客 HTML

### 模式 D:AI 改主题
> 用户:"主题再暖一点,标题大一点"
> AI 用 Edit 工具直接改 `themes/typora-newsprint.css` 的 `--accent` 与 `h1 font-size`,**不需要写新脚本**——这是本 skill 的元能力。

### 模式 E:版本对比 PDF
> 用户:"v1.2 到 v1.3 都改了什么,出个 PDF 给客户"
> AI:`bash scripts/md-diff.sh v1.2.0 v1.3.0 release-notes.pdf --theme huo15-brand`

### 模式 F:企微/钉钉/微信对话渲染送达(配合 enhance,**最常用**)
> 用户(在企微对话框):"把这份复盘渲染成 PDF 发给我"
> 1. AI 调 `bash scripts/md-share.sh report.md --mode pdf --label "Q1 复盘报告"`
> 2. AI 拿到 stdout 的 JSON,看到 `files[0].path = /tmp/.../report-20260505.pdf`
> 3. AI 按 JSON.next_actions 顺序:**优先**调 `enhance_share_file({filePath, label, expireHours: 24})`
> 4. 拿到 `structuredContent.url = https://keepermac.huo15.com/plugins/enhance-share/<token>-report-20260505.pdf`
> 5. AI 把 url 作为 outbound 消息回到当前会话,企微用户在对话框点链接下载/查看
> **若无 enhance**:JSON 的 priority=2 fallback,AI 把本地 path 告诉用户(降级,但不报错)

### 模式 G:发布 + 多端 + 自动归档(v0.3.0,**复盘场景首选**)
> 用户:"把这份 Q1 复盘**发布**出去,我可能要发企微 + 朋友圈 + 邮件"
> 1. AI 调 `bash scripts/md-publish.sh report.md --slug q1-summary --label "Q1 复盘"`(默认 mode=all)
> 2. md-publish 一次渲染 4 端产物 + 自动写归档 `~/knowledge/huo15/2026-05-06-q1-summary.md`(带 frontmatter)
> 3. AI 看 JSON.post_share_actions:对 4 个 file 逐个调 `enhance_share_file` 拿 4 个 URL
> 4. AI 用 Edit 工具把 4 个 URL **回写**到 KB 归档 frontmatter 的 `share_urls:` 列表(未来翻档案直接拿历史链接)
> 5. AI 组装"多版本菜单"消息发回当前会话:
>    ```
>    ✓ 已发布"Q1 复盘",4 个版本可选转发(24h 内有效):
>    • 📄 PDF 版(打印/邮件):https://keepermac.huo15.com/plugins/enhance-share/<token>-...pdf
>    • 🖼️ 长图版(朋友圈/小红书):https://...-q1-summary.png
>    • 🌐 网页版(分享链接 / 微信粘贴显示卡片):https://...-q1-summary.html
>    • 📰 公众号 inline 版(粘到编辑器):https://...-q1-summary.wechat.html
>    📁 已归档:~/knowledge/huo15/2026-05-06-q1-summary.md
>    ```
> 6. **用户自己**决定哪个版本转发到哪个群——人在回路,不替用户广播
> **若 --with-qr**:AI 还会用 PDF URL 二刷一次 `md2pdf-puppet --qr-url <url>` 生成带二维码的打印版,适合线下海报/客户提案

### 模式 H:卡片预览(v0.3.0)
> 用户:"把这篇技术文章发个链接给同事,要让他在企微对话框里直接看到标题+摘要预览,不是冷链接"
> AI 自动用 `md2html.js` 生成 HTML(已默认从 markdown 抽 H1 + 首段作为 OG title/description)
> → enhance_share_file → URL → 发企微
> 同事看到的是带卡片预览的链接(微信/企微/Slack/Twitter 都支持 OG)

### 模式 I:线下纸质 ↔ 线上文档(v0.3.0)
> 用户:"把客户提案打印 50 份发线下,但要让客户能扫码看在线版"
> 两阶段:
> 1. 第一阶段:`md-publish.sh proposal.md --mode pdf --with-qr` → enhance 拿 PDF URL
> 2. 第二阶段:用 PDF URL **二刷** `md2pdf-puppet.js proposal.md proposal-print.pdf --theme huo15-brand --qr-url <PDF URL> --qr-label "扫码看完整在线版"` → 二维码嵌进每页页脚
> 3. 用户拿这份带二维码的 PDF 去打印
> 4. 客户扫码 → 跳到 enhance 公网链接 → 在线高保真 PDF
> 这是"线下材料链接到线上知识库"的标准做法

---

## 六、自定义主题(给 AI 的)

用户说"我要 X 风格" → AI 直接改 CSS,**不要重写脚本**:

1. 复制最相近的主题到新文件:`cp themes/typora-newsprint.css themes/<my-theme>.css`
2. 改 `:root` 的颜色 token / 改 `h1`/`h2` 字号字体
3. 在 `scripts/lib/render.js` 的 `AVAILABLE_THEMES` 数组加上新名字
4. 立刻可用:`--theme <my-theme>`

**主题文件不允许**塞 `<script>` / 远程 `@import` 字体(打印会卡)/ JS。

---

## 七、依赖说明

| 依赖 | 必需性 | 装法 |
|---|---|---|
| Node ≥ 18 | 必装 | https://nodejs.org/ 或 `brew install node` |
| `npm install`(本目录) | 必装 | `bash scripts/install-deps.sh` |
| Pandoc | `md2docx` 必需 | `brew install pandoc` / `apt install pandoc` |
| WeasyPrint | `md2pdf --engine pandoc` 路线可选 | `pip install weasyprint` |
| **huo15-openclaw-enhance** | **可选** — 装了启用"企微对话拿公网 URL"模式 F | `openclaw plugins install @huo15/huo15-openclaw-enhance` |

**默认路线(puppeteer)只需 npm install,不依赖 pandoc;企微集成所需的 enhance 也是可选,无 enhance 仍能用本机渲染**。

---

## 八、踩坑提示(给 AI 的预防针)

1. **微信公众号粘贴丢样式**:必须用 `md2wechat.js`(已 juice 内联),**不能**直接用 `md2html.js` 的输出粘
2. **mermaid 渲染需要联网**:`md2pdf-puppet.js` 默认从 jsdelivr CDN 加载 mermaid 运行时,离线环境加 `--no-mermaid`
3. **小红书长图过长会被压缩**:超过 5000px 时拆成两张,先用 markdown 二级标题分段后分别导
4. **学术 PDF 中文断行**:`academic` 主题用衬线英文优先,中文长段落建议手动加空格断词,或改用 `huo15-brand` 主题
5. **品牌页眉页脚只在 huo15-brand 主题生效**:其他主题想要页眉用 `--header` 参数手动加
6. **reference.docx 不存在不报错**:Pandoc 自动用内置默认。想要品牌 Word → 见 `templates/README.md`
7. **严禁手写 enhance-share URL**:配合 enhance 时,必须从 `enhance_share_file` 工具的 `structuredContent.url` 取真实链接。**不能**手写、拼接、猜测、回忆类似 `http://localhost:18789/<file>`、`/plugins/enhance-share/<filename>`(缺 token)等任何形式——它们都不是真实链接,用户点了只会 404。这条与 enhance v5.7.24+ 的规则一致
8. **md-preview.js 不要直接暴露给企微用户**:它绑 127.0.0.1,内网穿透看不见。企微场景必用 `md-share.sh` + enhance_share_file 链路
9. **md-share.sh / md-publish.sh 不调 enhance**:本 skill 输出 JSON 的 next_actions 是**指示**,不是直接调用——独立装本 skill(没装 enhance)依然能跑(降级 priority=2 输出本地路径)
10. **md-publish 不替用户广播**:即使用户说"发到所有群",也只输出 4 个 URL 让**用户自己**转发。严禁 AI 主动调 wecom 类工具广播——这是 §6.5 + memory `lesson_wecom_at_all_broadcast.md` v2.8.1 @all 事故的红线
11. **OG 卡片需要公网 URL 才显示完整**:HTML 自包含可粘到本地预览,但**只有把 HTML 通过 enhance_share_file 暴露到公网**,微信/企微/Slack 抓 OG meta 时才会渲染卡片(本机 file:// 不会触发卡片抓取)
12. **二维码两阶段不能合一**:**md2pdf-puppet --qr-url 必须传一个已存在的公网 URL**——不能在第一阶段渲染 PDF 时就嵌"未来这个 PDF 的 URL"(鸡生蛋问题)。正确流程:第一阶段 publish 拿 PDF URL → 第二阶段用该 URL 重渲染带 QR 的 PDF
13. **KB 归档 frontmatter 的 share_urls 由 AI 回写**:md-publish 写归档时 share_urls 留空数组,**AI 拿到 enhance URL 后用 Edit 工具回写**——脚本不调 enhance,所以脚本自己写不出 URL(capability detection 设计的代价)

---

## 九、企微 / 钉钉 / 微信场景:capability detection 集成 enhance

### 设计原则(与 §11.4 红线 + memory `feedback_plugins_must_be_independently_installable.md` 一致)

- ✅ 本 skill 不 import / 不依赖 enhance
- ✅ md-share.sh 仅渲染 + 输出标准 JSON
- ✅ 由调用 skill 的 AI 在运行时检测 enhance 是否在场:**enhance_share_file 工具可见 → 调它拿 URL;不可见 → 给本地路径**
- ❌ 不写跨插件 import,不写"if enhance 装了"的硬判断,不在脚本里 spawn 任何 plugin

### 工作流图

```
企微用户:"把这份分析报告导成 PDF 发我"
        │
        ▼
   OpenClaw inbound
        │
        ▼
   AI 看到 SKILL.md §九 模式 F
        │
        ▼
   bash scripts/md-share.sh report.md --mode pdf --label "..."
        │
        │ stdout: {"files":[{"path":"/tmp/.../report-TS.pdf",...}], "next_actions":[...]}
        ▼
   AI 按 next_actions priority=1 尝试:
   enhance_share_file({filePath, label, expireHours: 24})
        │
        ├─ 工具可见 ─→ 拿 structuredContent.url ─→ outbound 发链接到企微 ─→ ✓
        │
        └─ 工具不可见 / 调用失败 ─→ priority=2 fallback ─→
                                 outbound 把 file.path 告诉用户(降级)
```

### `md-share.sh` 用法速查

```bash
# 单一格式
bash scripts/md-share.sh report.md --mode pdf --label "Q1 复盘报告"
bash scripts/md-share.sh post.md   --mode image --theme xiaohongshu  # 小红书长图
bash scripts/md-share.sh news.md   --mode wechat                      # 公众号 inline

# 一份 md 多端并行(企微一次给齐 PDF + 长图 + 网页 三个链接)
bash scripts/md-share.sh report.md --mode all --label "战略分析报告"

# 长效链接(客户 30 天内可访问)
bash scripts/md-share.sh proposal.md --mode pdf --expire-hours 720 --label "客户提案 v1"
```

### `md-publish.sh` 用法速查(v0.3.0,**比 md-share 多了 KB 归档 + 多端默认**)

```bash
# 默认:mode=all,自动归档到 ~/knowledge/huo15/<日期>-<slug>.md
bash scripts/md-publish.sh report.md --slug q1-summary --label "Q1 复盘报告"

# 客户提案(打印场景):带二维码,二阶段 AI 自动二刷 PDF
bash scripts/md-publish.sh proposal.md --slug client-proposal-v1 \
  --label "客户提案 v1" --with-qr --expire-hours 720

# 不归档(纯发布,不写知识库)
bash scripts/md-publish.sh quick-note.md --no-archive

# 自定义归档目录
bash scripts/md-publish.sh internal.md --kb-dir ~/work/wiki/2026-q2

# 仅 PDF + 归档
bash scripts/md-publish.sh report.md --mode pdf --slug q1-summary
```

**md-publish vs md-share 选择**:
- 一次性"发我看看" → md-share(轻量)
- "发布出去 + 留档案" → md-publish(归档 + 多端默认 + 二维码可选)
- 复盘 / 客户提案 / 周月报 / 公司公告 → md-publish

### v0.3.0 新增 OG 卡片(企微/微信粘贴显示标题+摘要)

```bash
# md2html 自动从 markdown 抽 H1 + 首段做 OG meta
node scripts/md2html.js article.md  # 自动 og:title=H1, og:description=首段

# 显式指定
node scripts/md2html.js article.md article.html \
  --og-title "AI 时代的 Markdown 工具链" \
  --og-description "把 Typora 拆成 OpenClaw skill 的设计思考" \
  --og-image https://tools.huo15.com/uploads/cover.png \
  --og-url https://keepermac.huo15.com/plugins/enhance-share/abc-article.html
```

效果:HTML 文件粘到企微/微信/Slack 对话框,自动渲染卡片(标题+摘要[+封面图])。

### v0.3.0 新增 PDF 二维码

```bash
# 第一阶段:正常 publish,拿到 PDF URL
PDF_URL="https://keepermac.huo15.com/plugins/enhance-share/abc-report.pdf"

# 第二阶段:用 URL 二刷出带二维码的打印版
node scripts/md2pdf-puppet.js report.md report-print.pdf \
  --theme huo15-brand \
  --qr-url "$PDF_URL" \
  --qr-label "扫码看在线版"
```

二维码出现在 PDF **每页右下角页脚**(huo15-brand 主题最佳;其他主题也支持)。

输出 JSON(stdout)始终遵循 schema:

```json
{
  "status": "render_complete",
  "files": [{ "path": "/tmp/.../xxx.pdf", "kind": "pdf", "label": "...", "size_kb": 234, "mime": "...", "theme": "huo15-brand" }],
  "next_actions": [
    { "priority": 1, "tool": "enhance_share_file", "args_per_file": {...}, "result_field": "structuredContent.url", "warning": "严禁手写 URL" },
    { "priority": 2, "tool": null, "fallback": "把 path 告诉用户" }
  ],
  "ai_instruction": "对每个 file 优先 priority=1,失败降级 priority=2"
}
```

### AI 触发判断(给读 SKILL.md 的 AI)

用户出现以下意图就走模式 F:
- "**发**给我 / 发给客户 / 发到群里" — outbound 意图
- "**链接**给我 / 给我个链接 / 公网链接 / 分享链接" — URL 需求
- "**给我看看 / 看效果 / 预览**" + 渠道在 IM(企微/钉钉/微信)— 视觉送达
- 当前会话来自企微/钉钉/微信 inbound — 渠道天然适配 enhance

如果用户**只是**说"导出 PDF" 而**没有发送/链接**意图,走模式 A(纯本机文件输出);用户后续说"发我" 再切到模式 F。

---

## 十、文件清单

```
huo15-markdown-export/
├── SKILL.md                    # 你正在看的这个
├── README.md                   # 火一五品牌 README
├── package.json                # npm 依赖
├── _meta.json                  # ClawHub meta
├── LICENSE                     # MIT
├── scripts/
│   ├── install-deps.sh         # 一键装依赖
│   ├── md2pdf.sh               # PDF 入口(分发到 puppeteer/pandoc)
│   ├── md2pdf-puppet.js        # Puppeteer 实现(默认)
│   ├── md2docx.sh              # Word 导出(Pandoc)
│   ├── md2html.js              # 单文件自包含 HTML
│   ├── md2image.js              # 长图 PNG
│   ├── md2wechat.js            # 微信公众号 inline
│   ├── md-preview.js           # 本地 live preview(仅 127.0.0.1)
│   ├── md-share.sh             # 渲染 + 输出 share-ready JSON(对接 enhance,可选)
│   ├── md-publish.sh           # v0.3.0 多端发布 + KB 归档 + 二阶段 QR 提示
│   ├── md-diff.sh              # git diff → changelog PDF
│   └── lib/
│       └── render.js           # 共享渲染核心
├── themes/
│   ├── typora-newsprint.css    # 报纸风
│   ├── typora-night.css        # 暗色
│   ├── github.css              # GitHub README 风
│   ├── academic.css            # 学术论文
│   ├── wechat.css              # 微信公众号
│   ├── xiaohongshu.css         # 小红书长图
│   └── huo15-brand.css         # 火一五品牌(带页眉页脚)
├── templates/
│   ├── pdf-print.css           # @page + 打印规则
│   └── README.md               # 主题决策树 + reference.docx 自定义指南
└── examples/
    ├── sample.md               # 全功能样例
    └── chart-demo.md           # mermaid 4 种图
```

---

## 十一、版本

- **v0.3.0**(2026-05-06):
  - 新增 `md-publish.sh` — 多端发布 + 自动归档到 `~/knowledge/huo15/<date>-<slug>.md` + 二阶段 QR 提示
  - HTML 自动加 OG 卡片(从 markdown 抽 H1 + 首段),企微/微信/Slack 粘贴显示标题摘要预览;`md2html` 加 `--og-title/--og-description/--og-image/--og-url` 显式覆盖
  - PDF 加 `--qr-url` / `--qr-label`,二维码渲染到每页右下角页脚(线下纸质 ↔ 线上文档)
  - 增加 5 条踩坑 + 3 个 AI 调用模式(G/H/I)
  - 新增依赖:`qrcode`(SVG dataURL 二维码,纯 JS 无外部二进制)
- **v0.2.0**(2026-05-05):新增 `md-share.sh` + capability detection 集成 huo15-openclaw-enhance — 企微/钉钉/微信对话渲染送达,AI 自动 chain 调 `enhance_share_file` 拿公网 URL;无 enhance 优雅降级到本地路径。无硬依赖。
- **v0.1.0**(2026-05-05):首发。7 主题 + 7 脚本(pdf/docx/html/image/wechat/preview/diff)+ KaTeX + mermaid + highlight.js + 火一五品牌页眉页脚。

---

**公司:** 青岛火一五信息科技有限公司 · postmaster@huo15.com · QQ群 1093992108
