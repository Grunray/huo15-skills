# 聚星逸配置 · huo15-juxingyi-configure

> 动态拉取聚星逸最新模型列表，自动配置 OpenClaw —— 一个 fsk- 密钥调 50+ 顶级大模型。

---

<div align="center">

**青岛火一五信息科技有限公司** · postmaster@huo15.com · QQ群 1093992108

![Version](https://img.shields.io/badge/version-1.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0-blue)

</div>

---

## 这是什么

`huo15-juxingyi-configure` 是一个 OpenClaw 专用 skill，帮你快速接入聚星逸（Juxingyi）大模型聚合平台：

1. **动态拉取**：每次运行都从 `/v1/models` 端点获取最新可用模型列表
2. **自动分类**：文本对话模型 vs 生图/视频模型（自动跳过后者），按 tier 分组
3. **一键配置**：自动写入 `~/.openclaw/openclaw.json`，设 `DeepSeek-V4-Flash` 为主模型
4. **灵活切换**：配置后随时切换主模型，或查看当前配置

> 与手动配置的区别：不需要记住模型 ID、不需要手动写 JSON、不会漏掉新模型（平台新增后脚本自动发现）。

---

## 快速开始

### 安装

```bash
# 从 ClawHub 安装（推荐）
clawhub install huo15-juxingyi-configure --dir ~/.openclaw/workspace/skills

# 或从源码安装
git clone git@github.com:zhaobod1/huo15-skills.git
cp -r huo15-skills/huo15-juxingyi-configure/ ~/.openclaw/workspace/skills/
```

### 使用

**1. 获取聚星逸 API Key**

- 打开 [聚星逸控制台](https://fireworks-simulator.huo15.com/app/)
- 登录后进入「API 密钥」页，创建一个 `fsk-` 开头的密钥

**2. 运行配置脚本**

```bash
cd ~/.openclaw/workspace/skills/huo15-juxingyi-configure
node scripts/configure.mjs <fsk-key>
```

脚本会：
- 动态拉取最新模型列表
- 自动分类并写入 `~/.openclaw/openclaw.json`
- 默认设 `DeepSeek-V4-Flash` 为主模型
- 自动备份原配置

**3. 重启 OpenClaw**

```bash
openclaw restart
```

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

## 示例输出

### 配置成功

```
✅ 聚星逸配置完成！
   备份: ~/.openclaw/openclaw.json.bak.2026-07-11T00-00-00-000Z
   模型数: 18 个文本对话模型
   主模型: fireworks-hub/DeepSeek-V4-Flash
   备选链: 17 个模型
   密钥存储: 直接写入（明文）

   主模型 & 备选链:
   ★ fireworks-hub/DeepSeek-V4-Flash
     fireworks-hub/DeepSeek-V4-Pro
     fireworks-hub/DeepSeek-V3.2
     ...

重启 OpenClaw 后生效。
```

### 列出模型

```
🛰️  聚星逸 · 可用模型列表（动态获取）
   共 40 个模型，其中 30 个文本对话模型

⚡ Flash（快速）
  DeepSeek-V4-Flash                    128K ctx   推理     DeepSeek V4 Flash (聚星逸) ← 默认
  Gemini-3.5-Flash                     1024K ctx          Gemini 3 5 Flash (聚星逸)
  GLM-5-Turbo                          128K ctx          GLM 5 Turbo (聚星逸)
  ...

🚀 Pro（主力）
  DeepSeek-V4-Pro                      128K ctx   推理     DeepSeek V4 Pro (聚星逸)
  GPT-5.5                              128K ctx   推理     GPT 5 5 (聚星逸)
  claude-opus-4-8                      195K ctx   推理     Claude Opus 4 8 (聚星逸)
  ...

🧠 Reasoner（深度推理）
  DeepSeek-R1-0528                     128K ctx   推理     DeepSeek R1-0528 (聚星逸)
  GPT-5.4                              128K ctx   推理     GPT 5 4 (聚星逸)
  claude-opus-4-7                      195K ctx   推理     Claude Opus 4 7 (聚星逸)
  ...

🎬 生图/视频模型（不配置文本对话）
  GPT-Image-2
  Doubao-Seedream-5.0
  ...
```

---

## 模型分类规则

脚本从 `/v1/models` 动态获取后，用 `data/model-heuristics.json` 分类：

1. **跳过模型**：含 `Image` / `Seedream` / `T2V` / `I2V` / `happyhorse` 的模型 ID 不配置文本对话
2. **已知模型**：`knownModels` 中有精确元数据（reasoning / contextWindow / maxTokens / tier）
3. **未知模型**：按名称模式匹配推断 tier（`Flash/Turbo` → flash，`R1` → reasoner，`Pro/Max` → pro），用默认参数
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
├── data/
│   └── model-heuristics.json      # 模型分类启发式数据
└── scripts/
    └── configure.mjs              # 零依赖配置脚本（Node 18+）
```

---

## 与其他 skill 协作

| 场景 | 配套 skill |
|------|-----------|
| 查询 token 用量/费用 | [`huo15-yh-usage`](../huo15-yh-usage/)（凭 fsk- 查账单）|

---

## License

[MIT](LICENSE) — 自由商用 / 修改 / 再发布。需保留版权声明。

---

## 联系方式

| 项目 | 值 |
|------|-----|
| **公司** | 青岛火一五信息科技有限公司 |
| **邮箱** | postmaster@huo15.com |
| **QQ群** | 1093992108 |
| **官网** | https://www.huo15.com |

---

<div align="center">

**关注逸寻智库公众号，获取更多资讯**

</div>