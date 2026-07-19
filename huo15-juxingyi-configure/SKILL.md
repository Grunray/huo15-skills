---
name: huo15-juxingyi-configure
displayName: 聚星逸配置
version: 1.1.1
description: "将聚星逸大模型聚合平台接入 OpenClaw——动态拉取最新可用模型列表，自动写入 openclaw.json 的 providers 段，默认设 DeepSeek-V4-Flash 为主模型，配好后询问用户是否切换。一个 fsk- 密钥调 50+ 顶级大模型。"
homepage: https://github.com/zhaobod1/huo15-skills
metadata: { "openclaw": { "emoji": "🛰️", "requires": { "bins": ["node"] } } }
aliases:
  - 聚星逸配置
  - 聚星逸
  - juxingyi
  - 配置聚星逸
  - 聚星逸接入
  - 聚星逸模型
  - fireworks-hub
  - 烟花智汇配置
  - fsk配置
---

# 聚星逸配置 · huo15-juxingyi-configure

> 动态拉取聚星逸最新模型列表 → 自动写入 `~/.openclaw/openclaw.json` → 默认 DeepSeek-V4-Flash → 询问是否切换。
> 青岛火一五信息科技有限公司 · OpenClaw 生态

---

## 一、什么时候用

✅ **触发**:
- 用户说"配置聚星逸"/"接入聚星逸"/"juxingyi"/"fireworks-hub"
- 用户提供了 `fsk-` 开头的聚星逸 API Key，想接入 OpenClaw
- 用户说"把聚星逸的模型配到 openclaw"
- 用户想查看或切换聚星逸已配的模型

❌ **不触发**:
- 用户只是问聚星逸是什么（直接回答即可）
- 用户想查用量账单（走 `huo15-yh-usage` skill）

---

## 二、前置知识

**聚星逸**（Juxingyi）是青岛火一五的大模型聚合平台：
- **Base URL**: `https://fireworks-simulator-api.huo15.com/v1`
- **API 协议**: OpenAI 兼容（`openai-completions`）
- **密钥格式**: `fsk-` 开头
- **模型列表端点**: `GET /v1/models`（动态返回最新可用模型）
- **一个 Key** 可调 50+ 主流大模型（DeepSeek / GPT / Claude / Qwen / GLM / Gemini / Kimi / MiniMax / 豆包等）

在 OpenClaw 中，聚星逸作为一个 **provider**（`fireworks-hub`）配置在 `~/.openclaw/openclaw.json` 的 `models.providers` 段。

---

## 三、配置流程（3 步）

### Step 1 · 获取用户的 API Key

向用户索要聚星逸 API Key（`fsk-` 开头）。如果用户没有，引导去 [聚星逸控制台](https://fireworks-simulator.huo15.com/app/) →「API 密钥」页创建。

### Step 2 · 运行配置脚本

```bash
node <skill_dir>/scripts/configure.mjs <fsk-key>
```

脚本会：
1. **动态调用** `GET /v1/models` 拉取最新模型列表
2. 自动分类：文本对话模型 vs 生图/视频模型（跳过后者）
3. 按 tier 排序（flash → pro → reasoner）
4. 写入 `~/.openclaw/openclaw.json`：
   - `models.providers.fireworks-hub`（provider + 全部文本模型）
   - `agents.defaults.model.primary` = `fireworks-hub/DeepSeek-V4-Flash`（默认）
   - `agents.defaults.model.fallbacks` = 其余文本模型
   - `agents.defaults.models` = 每个模型的 alias
5. 自动备份原配置到 `openclaw.json.bak.<timestamp>`

脚本输出示例：
```
✅ 聚星逸配置完成！
   备份: ~/.openclaw/openclaw.json.bak.2026-07-11T...
   模型数: 18 个文本对话模型
   主模型: fireworks-hub/DeepSeek-V4-Flash
   备选链: 17 个模型
```

### Step 3 · 询问用户是否切换主模型

**配置完成后，必须主动问用户**：

```
🛰️ 聚星逸配置完成！默认主模型是 DeepSeek-V4-Flash（快速、支持推理）。

需要切换到其他模型吗？可选：
  ⚡ Flash（快速）: DeepSeek-V4-Flash, Gemini-3.5-Flash, GLM-5-Turbo, Qwen3.7-Plus
  🚀 Pro（主力）: DeepSeek-V4-Pro, DeepSeek-V3.2, GPT-5.5, claude-opus-4-8, Qwen3.7-Max ...
  🧠 Reasoner（深度推理）: DeepSeek-R1-0528, GPT-5.4, claude-opus-4-7 ...

回复模型名即可切换，如 "DeepSeek-V4-Pro"。
或回复 "列出全部" 看完整列表。不切换就回 "不用了"。
```

**如果用户要切换**：
```bash
node <skill_dir>/scripts/configure.mjs --switch <model-id>
```

**如果用户想看完整列表**：
```bash
node <skill_dir>/scripts/configure.mjs <fsk-key> --list
```

**如果用户想看当前配置**：
```bash
node <skill_dir>/scripts/configure.mjs --show
```

---

## 四、脚本命令速查

| 命令 | 用途 |
|------|------|
| `node configure.mjs <fsk-key>` | 配置 provider + 全部模型，默认 DeepSeek-V4-Flash |
| `node configure.mjs <fsk-key> --list` | 动态获取并列出所有可用模型 |
| `node configure.mjs <fsk-key> --json` | 输出 JSON 配置片段（不写文件） |
| `node configure.mjs <fsk-key> --env` | 用环境变量引用存储密钥（更安全） |
| `node configure.mjs --switch <model-id>` | 切换主模型（支持前缀匹配） |
| `node configure.mjs --show` | 查看当前聚星逸配置 |
| `node configure.mjs --help` / `-h` | 显示帮助 |
| `node configure.mjs --version` / `-v` | 显示版本号 |
| `node configure.mjs --selftest` | 内置自检（不联网，不读写配置） |

> `<skill_dir>` = 本 skill 安装目录，通常为 `~/.openclaw/workspace/skills/huo15-juxingyi-configure`

---

## 五、模型分类规则

脚本从 `/v1/models` 动态获取后，用 `data/model-heuristics.json` 分类：

1. **跳过模型**（生图/视频）：含 `Image` / `Seedream` / `T2V` / `I2V` / `happyhorse` 的模型 ID 不配置文本对话
2. **已知模型**：`knownModels` 中有精确元数据（reasoning / contextWindow / maxTokens / tier）
3. **未知模型**（平台新加的）：按名称模式匹配推断 tier（`Flash/Turbo` → flash，`R1/reasoner` → reasoner，`Pro/Max/Opus` → pro），用默认参数
4. **排序**：flash → pro → reasoner，同 tier 按字母序

> 这意味着**平台新增模型后，无需更新本 skill**——脚本会自动发现并分类。

---

## 六、openclaw.json 配置结构

配置完成后，`~/.openclaw/openclaw.json` 中新增/更新的段：

```json
{
  "models": {
    "mode": "replace",
    "providers": {
      "fireworks-hub": {
        "baseUrl": "https://fireworks-simulator-api.huo15.com/v1",
        "apiKey": "fsk-你的密钥",
        "api": "openai-completions",
        "models": [
          {
            "id": "DeepSeek-V4-Flash",
            "name": "DeepSeek V4 Flash (聚星逸)",
            "reasoning": true,
            "contextWindow": 131072,
            "maxTokens": 8192,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "fireworks-hub/DeepSeek-V4-Flash",
        "fallbacks": ["fireworks-hub/DeepSeek-V4-Pro", "..."]
      },
      "models": {
        "fireworks-hub/DeepSeek-V4-Flash": { "alias": "DeepSeek V4 Flash (聚星逸)" }
      }
    }
  }
}
```

---

## 七、安全注意

- API Key 默认**明文写入** openclaw.json。如需更安全，加 `--env` 用环境变量引用：
  ```bash
  node configure.mjs <fsk-key> --env
  # 然后设置: export FIREWORKS_API_KEY=fsk-你的密钥
  ```
- 脚本每次写入前自动备份 `openclaw.json.bak.<timestamp>`
- **密钥禁止出现在 commit / log / PR / 任何 LLM 上下文**

---

## 八、硬红线

1. ❌ **不在任何文件中硬编码 API Key** — 用户每次提供
2. ❌ **不跳过动态获取** — 必须调 `/v1/models`，不用过期列表
3. ❌ **配置完不问就结束** — 必须主动问用户是否切换模型
4. ❌ **不破坏其他 provider** — 只改 `fireworks-hub` 段
5. ❌ **不忘记备份** — 写入前必须备份 openclaw.json

---

## 九、文件清单

```
huo15-juxingyi-configure/
├── SKILL.md                       # 你正在看的这个（≤ 25KB）
├── _meta.json                     # ClawHub 元数据
├── README.md                      # 详细文档
├── CLAUDE.md                      # 开发规范（内部）
├── LICENSE                        # MIT
├── .gitignore
├── data/
│   └── model-heuristics.json      # 模型分类启发式数据
├── scripts/
│   └── configure.mjs              # 零依赖配置脚本（Node 18+）
└── docs/
    ├── prd.md                     # 产品需求文档
    ├── user-guide.md              # 用户手册 SOP
    ├── dev-guide.md               # 开发者 SOP
    └── changelog.md               # 版本变更历史
```

---

## 十、版本

- **v1.1.1**（2026-07-19）: 健壮性增强 — 删除死代码 `deepMerge`；加 Node 版本检查与密钥格式校验；`fetchModels` 加 15s 超时 + 错误分类（401/403/5xx）+ 空列表防护；新增 `--help`/`--version`/`--selftest` 子命令；`--switch` 支持前缀匹配；根治 MiniMax 误判（`Mini` → `\bMini\b`）。（注：远程 1.1.0 已被 7-11 旧内容占用，跳 +1 patch 发布）
- **v1.0.0**（2026-07-11）: 首版 — 动态获取模型列表，自动配置 openclaw.json，默认 DeepSeek-V4-Flash，支持切换

---

**公司:** 青岛火一五信息科技有限公司 · postmaster@huo15.com · QQ群 1093992108
