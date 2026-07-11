# PRD · 聚星逸配置 Skill（huo15-juxingyi-configure）

> 产品需求文档 · v1.0.0 · 2026-07-11

---

## 一、产品定位

**聚星逸配置**是 OpenClaw 生态专用 skill，帮助用户将聚星逸（Juxingyi）大模型聚合平台接入 OpenClaw 运行时。

**核心价值**：用户只需提供一个 `fsk-` 密钥，skill 动态拉取最新模型列表，自动写入 `~/.openclaw/openclaw.json`，无需手动查文档、记模型 ID、写 JSON。

---

## 二、背景与问题

### 痛点

1. **模型列表变化频繁**：聚星逸平台不断新增模型（从 30+ 到 40+ 到 50+），硬编码列表很快过期
2. **手动配置易出错**：openclaw.json 结构复杂（providers / models / agents.defaults / fallbacks / aliases），手写容易漏字段或拼错模型 ID
3. **每次探索浪费 token**：不沉淀配置知识，每次都要消耗 LLM token 去搜索文档、探索配置格式
4. **不知道有哪些模型可用**：用户不清楚平台有哪些模型，也不知道哪些适合文本对话、哪些是生图/视频

### 解决方案

| 痛点 | 解决方式 |
|------|---------|
| 模型列表过期 | 每次运行脚本动态调 `GET /v1/models` |
| 手动配置易错 | 脚本自动生成完整 JSON 片段并写入 |
| token 浪费 | SKILL.md 嵌入完整配置知识，0 次 API 探索 |
| 不知有哪些模型 | `--list` 模式列出全部，自动分 tier 展示 |

---

## 三、用户故事

### US-1：首次配置

> 作为 OpenClaw 用户，我想用聚星逸的密钥接入平台，这样就能调用 50+ 大模型。

**验收**：
- ✅ 用户提供 `fsk-` 密钥后，脚本动态拉取模型列表
- ✅ 自动写入 `~/.openclaw/openclaw.json` 的 `models.providers.fireworks-hub` 段
- ✅ 默认设 `DeepSeek-V4-Flash` 为主模型
- ✅ 写入前自动备份原配置
- ✅ 配置完成后主动询问用户是否切换模型

### US-2：切换主模型

> 作为已配置用户，我想切换默认主模型（比如从 DeepSeek-V4-Flash 切到 claude-opus-4-8）。

**验收**：
- ✅ `--switch <model-id>` 一键切换
- ✅ 旧主模型自动加入 fallbacks 链
- ✅ 切换前自动备份

### US-3：查看可用模型

> 作为潜在用户，我想看看聚星逸有哪些模型可用，再决定是否配置。

**验收**：
- ✅ `--list` 模式动态获取并展示，按 tier 分组
- ✅ 标注默认模型
- ✅ 生图/视频模型单独列出（标注"不配置文本对话"）

### US-4：查看当前配置

> 作为已配置用户，我想看看当前聚星逸配了什么。

**验收**：
- ✅ `--show` 模式展示 provider 信息、主模型、备选链、全部已配模型
- ✅ 密钥脱敏显示

### US-5：安全存储密钥

> 作为安全敏感用户，我不想把 API Key 明文写在配置文件里。

**验收**：
- ✅ `--env` 模式用环境变量引用（`FIREWORKS_API_KEY`）
- ✅ 配置文件中只存 `{ source: "env", id: "FIREWORKS_API_KEY" }`，不存明文

---

## 四、功能需求

### F1：动态模型获取

- **输入**：`fsk-` 密钥
- **API**：`GET https://fireworks-simulator-api.huo15.com/v1/models`
- **鉴权**：`Authorization: Bearer <fsk-key>`
- **输出**：模型列表 JSON（`{ object: "list", data: [{ id, owned_by, ... }] }`）

### F2：模型分类

| 类别 | 判定规则 | 处理方式 |
|------|---------|---------|
| 生图/视频 | ID 含 `Image` / `Seedream` / `T2V` / `I2V` / `happyhorse` | 跳过，不配置文本对话 |
| 已知文本模型 | `data/model-heuristics.json` 的 `knownModels` 中有精确元数据 | 用精确参数 |
| 未知文本模型 | 不在 knownModels，也不匹配 skipPatterns | 按名称模式匹配推断 tier，用默认参数 |

### F3：tier 分类

| Tier | 含义 | 匹配关键词 | 排序权重 |
|------|------|-----------|---------|
| flash | 快速、便宜 | `Flash` / `Turbo` / `lite` / `highspeed` / `Mini` | 0 |
| pro | 主力 | `Pro` / `Max` / `Opus` / `Plus` / `Sonnet` | 1 |
| reasoner | 深度推理 | `R1` / `reasoner` / `thinking` / `o1` / `o3` | 2 |

### F4：openclaw.json 写入

写入以下段：

```
models.providers.fireworks-hub     ← provider 配置 + 全部文本模型
agents.defaults.model.primary      ← 默认 fireworks-hub/DeepSeek-V4-Flash
agents.defaults.model.fallbacks    ← 其余文本模型列表
agents.defaults.models             ← 每个模型的 alias
```

**安全规则**：
- 只操作 `fireworks-hub` provider，不碰其他 provider
- 合并 `agents.defaults.models` 时，保留非 `fireworks-hub/` 前条的已有条目
- 写入前自动备份 `openclaw.json.bak.<timestamp>`

### F5：子命令

| 命令 | 功能 |
|------|------|
| `<fsk-key>` | 配置 provider + 全部模型 |
| `<fsk-key> --list` | 列出可用模型（不写文件） |
| `<fsk-key> --json` | 输出 JSON 配置片段（不写文件） |
| `<fsk-key> --env` | 用环境变量引用存储密钥 |
| `--switch <model-id>` | 切换主模型 |
| `--show` | 查看当前配置 |

---

## 五、非功能需求

| 项 | 要求 |
|----|------|
| 运行时 | Node.js 18+（自带 fetch），零依赖 |
| 安全 | 密钥不硬编码，不出现在 commit/log/PR |
| 可逆 | 每次写入前备份 |
| 品牌合规 | 对外文档无 `odoo` / `uniapp` / `uni-app` / `欧度` |
| 体积 | SKILL.md ≤ 25KB（8192 tokens 限制） |
| 可维护 | 平台新增模型后无需更新 skill（动态发现） |

---

## 六、技术约束

- **API 协议**：OpenAI 兼容（`openai-completions`）
- **Provider 名称**：`fireworks-hub`（openclaw.json 中的 key）
- **密钥格式**：`fsk-` 开头
- **Base URL**：`https://fireworks-simulator-api.huo15.com/v1`

---

## 七、不做什么

- ❌ 不查用量账单（走 `huo15-yh-usage` skill）
- ❌ 不配置生图/视频模型为文本对话（跳过）
- ❌ 不修改 openclaw.json 中其他 provider 配置
- ❌ 不自动重启 OpenClaw（只提示用户手动重启）
- ❌ 不缓存模型列表（每次都动态获取，确保最新）

---

## 八、里程碑

| 版本 | 日期 | 内容 |
|------|------|------|
| v1.0.0 | 2026-07-11 | 首版：动态获取、自动分类、配置写入、切换、show、list、json、env |

---

## 九、后续规划

- v1.1：支持配置指定 agent 的模型（非 defaults）
- v1.2：支持配置模型路由（`modelRouter` auto-task 模式）
- v1.3：模型健康检查（测试每个模型是否可调用）
