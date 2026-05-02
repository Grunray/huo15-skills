# 火一五 Skills 技能库

---

<div align="center">

<img src="https://tools.huo15.com/uploads/images/system/logo-colours.png" alt="火一五Logo" style="width: 120px; height: auto; display: inline; margin: 0;" />

</div>

<div align="center">

<h3>打破信息孤岛，用一套系统驱动企业增长</h3>
<h3>加速企业用户向全场景人工智能机器人转变</h3>

</div>

<div align="center">

| 🏫 教学机构 | 👨‍🏫 讲师 | 📧 联系方式         | 💬 QQ群      | 📺 配套视频                         |
|:-----------:|:--------:|:------------------:|:-----------:|:-----------------------------------:|
| 逸寻智库 | Job | support@huo15.com | 1093992108  | [📺 B站视频](https://space.bilibili.com/400418085) |

</div>

<div align="center">

![Skills](https://img.shields.io/badge/skills-27-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![OpenClaw](https://img.shields.io/badge/OpenClaw-compatible-orange)
![Claude Code](https://img.shields.io/badge/Claude%20Code-compatible-7c3aed)
![ClawHub](https://img.shields.io/badge/ClawHub-published-ff6b6b)

</div>

---

## 项目简介

火一五 Skills 技能库是青岛火一五信息科技有限公司为 OpenClaw / Claude Code AI
助手开发的定制化技能集合。每个技能独立模块化设计，可单独安装使用，也可协同
工作。

仓库镜像：
- **CNB.cool（主）：** [`huo15/ai/huo15-skills`](https://cnb.cool/huo15/ai/huo15-skills)
- **GitHub（同步）：** [`zhaobod1/huo15-skills`](https://github.com/zhaobod1/huo15-skills)
- **ClawHub 发布：** [clawhub.ai/skills?author=huo15](https://clawhub.ai)

---

## 快速开始

5 分钟跑起来，以"小红书创作伙伴"为例：

```bash
# 1. 装一个 skill
clawhub install huo15-xiaohongshu --dir ~/.openclaw/workspace/skills

# 2. 重启 OpenClaw / Claude Code，对话里直接说："写小红书"或"用 Allen 流"

# 3. 进阶：装一组协作的 skill（设计 + 文档 + 心法）
clawhub install huo15-openclaw-frontend-design --dir ~/.openclaw/workspace/skills
clawhub install huo15-openclaw-office-doc --dir ~/.openclaw/workspace/skills
clawhub install huo15-openclaw-mit-48h-learning-method --dir ~/.openclaw/workspace/skills
```

> **找不到自己要的能力？** 直接看下面的「技能列表」按类别索引；每个 slug 都点得开。

---

## 目录结构

```
huo15-skills/
├── README.md                   # 本文件（仓库总览）
├── SKILL.md                    # 仓库级 marketplace 描述
├── _meta.json                  # 仓库级元数据（version 4.x = marketplace 主版本）
├── scripts/                    # 仓库级开发辅助脚本
└── <slug>/                     # 27 个 skill 子目录，每个独立可发布
    ├── SKILL.md                # 该 skill 的主入口（ClawHub 嵌入源，≤ 25KB）
    ├── _meta.json              # ownerId / slug / version
    ├── README.md               # 该 skill 详细文档（不参与 ClawHub 嵌入）
    ├── CLAUDE.md               # 开发规范（仅本仓库内可见）
    ├── data/                   # 数据资产 / 知识库（人 + LLM 共读）
    ├── scripts/                # CLI 入口（Python，零依赖优先）
    └── docs/changelog.md       # 版本历史
```

**开发铁律**（详见各 skill 内 CLAUDE.md）：
- 所有改动都在本仓库做，**禁止**直接编辑 ClawHub 安装目录里的副本
- skill 走 `git push origin && git push github && clawhub publish` 三步发布
- `_meta.json` 不会自动同步线上版本，发完手动 bump

---

## 技能列表（按类别）

> 共 **27** 个 skill。全部采用 **MIT License**（可自由商用 / 修改 / 再发布，需保留版权声明 © 青岛火一五信息科技有限公司）。

### 一、OpenClaw 工程模式（PR / Plan / Verify / Explore）

| Slug | 版本 | 一句话说明 |
|------|:----:|-----------|
| [`huo15-openclaw-plan-mode`](huo15-openclaw-plan-mode/) | v1.0.2 | 结构化规划模式 — 借鉴 Claude Code Plan Agent，执行复杂任务前先做系统性规划 |
| [`huo15-openclaw-verify-mode`](huo15-openclaw-verify-mode/) | v2.2.0 | 验证模式 — 检查成果、跑测试、验证假设，借鉴 Claude Code Verification Agent |
| [`huo15-openclaw-explore-mode`](huo15-openclaw-explore-mode/) | v1.1.1 | 深度探索模式 — 系统性调研代码库 / 系统 / 话题，只读不改 |
| [`huo15-openclaw-code-review`](huo15-openclaw-code-review/) | v1.0.0 | GitHub / cnb.cool PR 五维评审（设计 / 实现 / 测试 / 安全 / 可维护），可粘贴到 PR |
| [`huo15-openclaw-security-review`](huo15-openclaw-security-review/) | v1.0.0 | 当前分支 pending 改动安全评审：密钥泄露 / SQLi / XSS / SSRF / 权限绕过 / 危险依赖 |
| [`huo15-openclaw-simplify`](huo15-openclaw-simplify/) | v1.0.0 | "复用 / 质量 / 效率"三维审查刚写完的代码 + 实际修复命中问题 |
| [`huo15-openclaw-multi-agent`](huo15-openclaw-multi-agent/) | v2.2.1 | 基于 OpenClaw sessions_spawn 的多 Agent 并行工作系统（协调者模式 / 任务分配 / 结果汇总） |

### 二、学习与知识库

| Slug | 版本 | 一句话说明 |
|------|:----:|-----------|
| [`huo15-openclaw-openai-knowledge-base`](huo15-openclaw-openai-knowledge-base/) | v2.7.0 | Karpathy LLM Knowledge Bases 方案：raw → LLM 编译 → wiki + Obsidian vault 自动同步 |
| [`huo15-openclaw-mit-48h-learning-method`](huo15-openclaw-mit-48h-learning-method/) | v3.0.0 | MIT 48 小时学习法（Ihtesham Ali 三问框架 + 反馈循环 + 完整 48h 三阶段时间线） |
| [`huo15-karpathy-guidelines`](huo15-karpathy-guidelines/) | v1.0.3 | 把 Andrej Karpathy 的 LLM 编程四大行为规范打包为可触发 skill |

### 三、龙虾身份与记忆（OpenClaw 专属）

| Slug | 版本 | 一句话说明 |
|------|:----:|-----------|
| [`huo15-openclaw-bootstrap`](huo15-openclaw-bootstrap/) | v1.1.0 | 龙虾首次开机仪式：4 步搞定身份初始化（基本信息 / 6 经典组合人设 / 领域套餐 / 沟通偏好） |
| [`huo15-openclaw-memory-curator`](huo15-openclaw-memory-curator/) | v1.1.0 | 审查结构化记忆，提取洞察，更新 MEMORY.md，清理过期条目 |

### 四、文档输出

| Slug | 版本 | 一句话说明 |
|------|:----:|-----------|
| [`huo15-openclaw-office-doc`](huo15-openclaw-office-doc/) | **v7.6.1** ⭐ | 企业级 Word & PDF 文档生成。**39 类规范**（含合同细分 7 类）+ **22 份 markdown 范本**。三条路径：Word 直出 / 原生 PDF / Word→PDF |
| [`huo15-openclaw-ppt`](huo15-openclaw-ppt/) | v3.2.1 | 21 套生产级审美方案（Apple 发布会 / Liquid Glass / Vercel / Linear 等）+ design tokens 驱动 |
| [`huo15-flow-chart`](huo15-flow-chart/) | v1.4.0 | 2026 现代美学的流程图 / 泳道图 / 系统架构 / C4 / 时序 / 状态 / ER / 甘特图（Linear / Vercel / Radix 风格） |
| [`huo15-mind-map`](huo15-mind-map/) | v1.2.0 | 思维导图生成（XMind 2021+ / OPML / FreeMind / Markdown 多格式互转） |

### 五、设计

| Slug | 版本 | 一句话说明 |
|------|:----:|-----------|
| [`huo15-openclaw-frontend-design`](huo15-openclaw-frontend-design/) | v4.7.0 | 高保真 Web UI / H5 / iOS / Android / HarmonyOS / 微信+支付宝+抖音+快手 四端小程序 原生风格原型 |
| [`huo15-openclaw-design-director`](huo15-openclaw-design-director/) | v3.0.0 | 6 大美学流派 × 24 设计哲学库 → 3 方向反差对比（hex 配色 + 字体 + 当代标杆） |
| [`huo15-openclaw-design-critique`](huo15-openclaw-design-critique/) | v2.0.0 | 6 维设计评审（美学 / 可用性 / 品牌 / 内容 / 技术 / 时代感）+ 审美档位识别（AI-Slop / Junior / Senior / Master） |
| [`huo15-openclaw-brand-protocol`](huo15-openclaw-brand-protocol/) | v1.0.0 | 抓品牌规范产出 brand-spec.md（5 步：Ask / Search / Download / Verify+Extract / Codify） |
| [`huo15-img-prompt`](huo15-img-prompt/) | v3.2.0 | 文生图提示词中枢，14 件套 + 88 预设审美锚点 + 故事板 / 品牌套件 / 风格学习 / doctor 健康检查 |

### 六、内容创作

| Slug | 版本 | 一句话说明 |
|------|:----:|-----------|
| [`huo15-xiaohongshu`](huo15-xiaohongshu/) | **v3.10.0** ⭐ | 小红书创作伙伴：六层创作哲学（含能量持续力 + 身份符号系统）+ CDP 真 Chrome 浏览（11 道防封号闸门 / `health` 体检 / 日配额）+ Allen 流诊断 + 苏格拉底案例库 |
| [`huo15-influencer-video-skill`](huo15-influencer-video-skill/) | v2.0.0 | 火山方舟 Seedance 2.0 第一人称带货短视频 + 剧本驱动配音（edge-tts / 火山 TTS）+ BGM + 字幕 |

### 七、研究与抓取

| Slug | 版本 | 一句话说明 |
|------|:----:|-----------|
| [`huo15-autoresearch-loop`](huo15-autoresearch-loop/) | v1.0.3 | Karpathy 自主研究循环：Modify → Verify → Keep / Discard → Repeat |
| [`huo15-research-pipeline`](huo15-research-pipeline/) | v1.0.3 | 从想法到论文的 6 阶段全自主研究管道（含 HITL，输出 Obsidian） |
| [`huo15-js-scraper`](huo15-js-scraper/) | v1.2.2 | JavaScript 渲染网站抓取（企微文档 / SPA / 企查查 / 反爬绕过） |
| [`huo15-searxng`](huo15-searxng/) | v1.2.2 | SearXNG 自托管元搜索引擎一键部署（Docker Compose + OpenClaw 配置自动化） |

---

## 重点更新

### `huo15-xiaohongshu` v3.10.0（2026-05）

「火一五小红书创作伙伴」延伸到**写得久**层面，并对**真实 Chrome CDP 浏览**做防封号加固：

- **创作哲学第六层「能量与持续力」**：写不出 ≠ 技法 / 节奏 > 灵感 / 发出去最后 10% / 低谷-高峰循环 / 耗尽信号 3 级 / 续命 3 工具
- **第二层 2.4 身份认同符号系统**：5 类符号（物 / 地 / 行 / 时 / 语言节奏）+ 抽象 vs 具体对照
- **浏览器桥接 11 道闸门**（v3.9 6 道 → v3.10 11 道）：日配额 100 次 / 指数退避 / 晨间缓冲 6:00-7:00 / `health` 全套体检（CDP 连接 + 登录态 + 浏览器指纹自检）
- 风控对抗依据：JA3/JA4 TLS 指纹 / `navigator.webdriver` / `cdc_*` 标记 / HTTP/2 settings —— 真实 Chrome 全规避

详见 [huo15-xiaohongshu/SKILL.md](huo15-xiaohongshu/SKILL.md)。

### `huo15-openclaw-office-doc` v7.6.1（2026-04）

企业 Word / PDF 文档生成现已支持 **39 类规范** 与 **22 份开箱即用 markdown 范本**：

- **HR**：个人简历 / 任命书 / 在职证明 / 劳动合同
- **Sales**：报价单 / 销售合同 / 招投标书
- **PM**：项目立项书 / 项目计划书 / 复盘报告 / 项目结项报告 / 会议纪要
- **Ops**：故障报告 (postmortem) / 应急预案 / 操作 SOP / 部署文档 / 风险评估报告
- **Tech**：技术方案 / 需求文档（PRD / SRS）/ 测试报告 / API 文档 / 用户手册 / 培训手册
- **Legal**：公司制度 / 备忘录 (MOU) / 信函 / 服务合同 / 技术开发合同 / 采购合同 / 保密协议 (NDA) / 合作协议
- **Reporting**：公文 / 工作报告 / 商业计划书 / 研究报告 / 验收单
- **Other**：演讲稿 / 新闻稿

每种规范按真实场景决定是否带 【内部】banner / 元数据表 / 版本历史 / 审批 /
TOC，CLI 可覆盖。三条输出路径（Word 直出 / 原生 PDF 直出 / Word→PDF），输入相同得到一致输出。

详见 [huo15-openclaw-office-doc/SKILL.md](huo15-openclaw-office-doc/SKILL.md) 与
[templates/README.md](huo15-openclaw-office-doc/templates/README.md)。

---

## 安装方式

### 方式一：从 ClawHub 安装（推荐）

```bash
# 单个安装
clawhub install <slug> --dir ~/.openclaw/workspace/skills

# 例：装文档技能 + 设计三件套
clawhub install huo15-openclaw-office-doc --dir ~/.openclaw/workspace/skills
clawhub install huo15-openclaw-frontend-design --dir ~/.openclaw/workspace/skills
clawhub install huo15-openclaw-design-director --dir ~/.openclaw/workspace/skills
clawhub install huo15-openclaw-design-critique --dir ~/.openclaw/workspace/skills
```

### 方式二：从源码安装

```bash
git clone git@github.com:zhaobod1/huo15-skills.git
cp -r huo15-skills/<技能目录>/ ~/.openclaw/workspace/skills/
# 重启 OpenClaw / Claude Code 即可生效
```

---

## 发布工作流（开发规范）

```
本地开发（cnb / GitHub 双源）→ git push → clawhub publish → clawhub install
```

**步骤**：

1. 在源仓库开发：`~/workspace/projects/openclaw/huo15-skills/<skill>/`
2. 本地测试通过后提交：
   ```bash
   git add <skill>/...
   git commit -m "feat(<skill>): vX.Y.Z 说明"
   git push origin main      # cnb.cool（主）
   git push github main      # GitHub（镜像）
   ```
3. 发布到 ClawHub：
   ```bash
   clawhub publish "$(pwd)/<skill>" \
     --slug <skill-slug> --version X.Y.Z --changelog "..."
   ```
4. ⚠️ **`_meta.json` 不会自动同步**：publish 成功后手动 Edit `_meta.json` 把
   `version` 字段同步到刚发的版本，单独 chore commit；否则下次升级时 _meta.json
   与线上脱节。

**铁律**：

- 所有技能从本仓库开发，禁止直接在 ClawHub 页面上传
- slug = 目录名，不可二次起名
- 版本号 semver；同一版本号不可重发
- 每小时新 slug 配额上限 5 个；批量首发用现有 slug 升版本不占额度
- ClawHub 嵌入 SKILL.md 上限 8192 tokens（≈ 25KB / ~5K CJK 字）；超限会报
  `Embedding failed`，砍历史 changelog / 重复示例即可

---

## ClawHub 直链

```
https://clawhub.ai/skills/huo15-openclaw-plan-mode
https://clawhub.ai/skills/huo15-openclaw-verify-mode
https://clawhub.ai/skills/huo15-openclaw-explore-mode
https://clawhub.ai/skills/huo15-openclaw-code-review
https://clawhub.ai/skills/huo15-openclaw-security-review
https://clawhub.ai/skills/huo15-openclaw-simplify
https://clawhub.ai/skills/huo15-openclaw-multi-agent
https://clawhub.ai/skills/huo15-openclaw-openai-knowledge-base
https://clawhub.ai/skills/huo15-openclaw-mit-48h-learning-method
https://clawhub.ai/skills/huo15-karpathy-guidelines
https://clawhub.ai/skills/huo15-openclaw-bootstrap
https://clawhub.ai/skills/huo15-openclaw-memory-curator
https://clawhub.ai/skills/huo15-openclaw-office-doc
https://clawhub.ai/skills/huo15-openclaw-ppt
https://clawhub.ai/skills/huo15-flow-chart
https://clawhub.ai/skills/huo15-mind-map
https://clawhub.ai/skills/huo15-openclaw-frontend-design
https://clawhub.ai/skills/huo15-openclaw-design-director
https://clawhub.ai/skills/huo15-openclaw-design-critique
https://clawhub.ai/skills/huo15-openclaw-brand-protocol
https://clawhub.ai/skills/huo15-img-prompt
https://clawhub.ai/skills/huo15-xiaohongshu
https://clawhub.ai/skills/huo15-influencer-video-skill
https://clawhub.ai/skills/huo15-autoresearch-loop
https://clawhub.ai/skills/huo15-research-pipeline
https://clawhub.ai/skills/huo15-js-scraper
https://clawhub.ai/skills/huo15-searxng
```

---

## License

全部 skill 采用 **MIT License**（[`LICENSE`](LICENSE)）。

- ✅ 可自由商用、修改、再发布、内部 / 外部部署
- ⚠️ **必须保留版权声明**：`Copyright (c) 2026 青岛火一五信息科技有限公司`
- ⚠️ **必须保留 LICENSE 文本**：在你分发的副本里附上完整的 MIT License

衍生作品 / fork / 二次封装到自家产品时，最简做法是把 `LICENSE` 文件原样带上，
或在你产品的 LICENSES / NOTICE / 关于页面里附上上述版权声明 + MIT 授权全文。

---

## 贡献与反馈

- **Bug / 建议**：在 [GitHub Issues](https://github.com/zhaobod1/huo15-skills/issues) 或 [CNB Issues](https://cnb.cool/huo15/ai/huo15-skills/-/issues) 提单
- **PR**：欢迎，但请先开 issue 对齐范围；本仓库强 monorepo 风格，每个 skill 独立可发布
- **新 skill 提案**：邮件 [support@huo15.com](mailto:support@huo15.com) 或加 QQ 群 `1093992108` 对齐
- **真实使用反馈**：B 站 [@逸寻智库](https://space.bilibili.com/400418085) 评论区，火一五会回

---

## FAQ

**Q：OpenClaw 和 Claude Code 都能装吗？**
A：能。所有 skill 走 `SKILL.md` 标准 frontmatter，OpenClaw / Claude Code / ClawHub 三家都识别同一份。

**Q：装到 `~/.openclaw/workspace/skills` 之后没生效？**
A：90% 是装错了双层 `workspace/skills/skills/` 目录。`clawhub install --dir ~/.openclaw/workspace/skills` 已经做对，但**手动 cp** 时容易嵌套。装完后重启 OpenClaw / Claude Code。

**Q：能不能不装 ClawHub，直接用源码？**
A：可以。`git clone` 后把 `<slug>/` 目录复制到 `~/.openclaw/workspace/skills/` 即可。但 ClawHub 装会自动处理元数据，推荐。

**Q：版本想固定，不想跟随升级？**
A：`clawhub install <slug>@<version>`；不传 version 默认装最新。

**Q：MIT License 能商用吗？要怎么署名？**
A：可商用、修改、再发布。**必须保留两样东西**：(1) 版权声明 `Copyright (c) 2026 青岛火一五信息科技有限公司`；(2) MIT License 全文。最简做法是直接把仓库根目录的 `LICENSE` 文件原样带到你的衍生作品里。

---

<div align="center">

**公司名称：** 青岛火一五信息科技有限公司

**联系邮箱：** postmaster@huo15.com | **QQ群：** 1093992108

---

**关注逸寻智库公众号，获取更多资讯**

<img src="https://tools.huo15.com/uploads/images/system/qrcode_yxzk.jpg" alt="逸寻智库公众号二维码" style="width: 200px; height: auto; margin: 10px 0;" />

</div>
