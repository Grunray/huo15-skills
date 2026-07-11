# 聚星逸配置 · huo15-juxingyi-configure

---

<div align="center">

<img src="https://tools.huo15.com/uploads/images/system/logo-colours.png" alt="火一五Logo" style="width: 120px; height: auto; display: inline; margin: 0;" />

</div>

<div align="center">

<h3>一个 Key 调 50+ 顶级大模型</h3>
<h3>动态拉取 · 自动配置 · 零 token 探索</h3>

</div>

<div align="center">

| 🏫 教学机构 | 👨‍🏫 讲师 | 📧 联系方式         | 💬 QQ群      | 📺 配套视频                         |
|:-----------:|:--------:|:------------------:|:-----------:|:-----------------------------------:|
| 逸寻智库 | Job | support@huo15.com | 1093992108  | [📺 B站视频](https://space.bilibili.com/400418085) |

</div>

---

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0-blue)
![ClawHub](https://img.shields.io/badge/ClawHub-published-ff6b6b)

</div>

---

## 这是什么

`huo15-juxingyi-configure` 是 OpenClaw 专用 skill，帮你快速接入聚星逸（Juxingyi）大模型聚合平台：

1. **动态拉取**：每次运行都从 `/v1/models` 端点获取最新可用模型列表
2. **自动分类**：文本对话模型 vs 生图/视频模型（自动跳过后者），按 tier 分组
3. **一键配置**：自动写入 `~/.openclaw/openclaw.json`，设 `DeepSeek-V4-Flash` 为主模型
4. **灵活切换**：配置后询问是否切换，随时用 `--switch` 换主模型
5. **安全可靠**：写入前自动备份，支持环境变量引用存储密钥

> **不用每次消耗 token 去探索配置格式和模型列表**——SKILL.md 嵌入完整知识，脚本动态获取最新数据。

---

## 快速开始

### 安装

```bash
# 从 ClawHub 安装（推荐）
clawhub install huo15-juxingyi-configure --dir ~/.openclaw/workspace/skills

# 或从源码安装
git clone https://cnb.cool/huo15/ai/huo15-skills.git
cp -r huo15-skills/huo15-juxingyi-configure/ ~/.openclaw/workspace/skills/
```

### 使用

**1. 获取聚星逸 API Key**

打开 [聚星逸控制台](https://fireworks-simulator.huo15.com/app/) →「API 密钥」页，创建一个 `fsk-` 开头的密钥。

**2. 运行配置脚本**

```bash
cd ~/.openclaw/workspace/skills/huo15-juxingyi-configure
node scripts/configure.mjs <fsk-key>
```

脚本动态拉取最新模型列表，自动分类并写入 `~/.openclaw/openclaw.json`，默认设 `DeepSeek-V4-Flash` 为主模型。

**3. 重启 OpenClaw**

```bash
openclaw restart
```

> 完整操作流程见 [用户手册 SOP](docs/user-guide.md)

---

## 脚本命令

| 命令 | 说明 |
|------|------|
| `node configure.mjs <fsk-key>` | 配置 provider + 全部模型，默认 DeepSeek-V4-Flash |
| `node configure.mjs <fsk-key> --list` | 动态获取并列出所有可用模型 |
| `node configure.mjs <fsk-key> --json` | 输出 JSON 配置片段（不写文件） |
| `node configure.mjs <fsk-key> --env` | 用环境变量引用存储密钥（更安全） |
| `node configure.mjs --switch <model-id>` | 切换主模型 |
| `node configure.mjs --show` | 查看当前聚星逸配置 |

---

## 模型分类规则

脚本从 `/v1/models` 动态获取后，用 `data/model-heuristics.json` 分类：

1. **跳过模型**：含 `Image` / `Seedream` / `T2V` / `I2V` / `happyhorse` 的模型 ID 不配置文本对话
2. **已知模型**：`knownModels` 中有精确元数据（reasoning / contextWindow / maxTokens / tier）
3. **未知模型**：按名称模式匹配推断 tier（`Flash/Turbo` → flash，`R1` → reasoner，`Pro/Max` → pro）
4. **排序**：flash → pro → reasoner，同 tier 按字母序

> **平台新增模型后，无需更新本 skill**——脚本会自动发现并分类。

---

## 安全建议

- **默认**：API Key 明文写入 `openclaw.json`，最简单
- **更安全**：加 `--env` 用环境变量引用：
  ```bash
  node configure.mjs <fsk-key> --env
  export FIREWORKS_API_KEY=fsk-你的密钥
  ```

---

## 文件结构

```
huo15-juxingyi-configure/
├── SKILL.md                       # ClawHub 嵌入源（≤ 25KB）
├── _meta.json                     # ClawHub 元数据
├── README.md                      # 本文件
├── CLAUDE.md                      # 开发规范
├── LICENSE                        # MIT
├── .gitignore                     # skill 级忽略
├── data/
│   └── model-heuristics.json      # 模型分类启发式数据（30 个已知模型）
├── scripts/
│   └── configure.mjs              # 零依赖配置脚本（Node 18+）
└── docs/
    ├── prd.md                     # 产品需求文档
    ├── user-guide.md              # 用户手册 SOP
    ├── dev-guide.md               # 开发者 SOP
    └── changelog.md               # 版本变更历史
```

---

## 与其他 skill 协作

| 场景 | 配套 skill |
|------|-----------|
| 查询 token 用量/费用 | [`huo15-yh-usage`](../huo15-yh-usage/)（凭 fsk- 查账单）|

---

## 文档

| 文档 | 说明 |
|------|------|
| [用户手册 SOP](docs/user-guide.md) | 面向终端用户的标准操作流程 |
| [开发者 SOP](docs/dev-guide.md) | 面向接手开发的架构内幕、运维流程、踩坑经验 |
| [PRD](docs/prd.md) | 产品需求文档 |
| [变更历史](docs/changelog.md) | 版本变更记录 |

---

## License

[MIT](LICENSE) — 自由商用 / 修改 / 再发布。需保留版权声明 `Copyright (c) 2026 青岛火一五信息科技有限公司`。

---

<div align="center">

**公司名称：** 青岛火一五信息科技有限公司

**联系邮箱：** postmaster@huo15.com | **QQ群：** 1093992108

---

**关注逸寻智库公众号，获取更多资讯**

<img src="https://tools.huo15.com/uploads/images/system/qrcode_yxzk.jpg" alt="逸寻智库公众号二维码" style="width: 200px; height: auto; margin: 10px 0;" />

</div>
