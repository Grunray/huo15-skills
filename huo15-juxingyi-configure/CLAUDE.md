# CLAUDE.md · huo15-juxingyi-configure

> 聚星逸配置 skill —— 动态拉取模型列表并写入 openclaw.json
> 面向接手开发的 AI / 工程师，涵盖架构、规范、踩坑、运维。

---

## 一、项目定位

将聚星逸（Juxingyi）大模型聚合平台接入 OpenClaw。用户提供一个 `fsk-` 密钥，skill 动态拉取最新模型列表，自动写入 `~/.openclaw/openclaw.json`，默认设 `DeepSeek-V4-Flash` 为主模型，配好后询问用户是否切换。

**核心价值**：不消耗 token 去探索配置格式和模型列表——SKILL.md 嵌入完整知识，脚本动态获取最新数据。

---

## 二、技术栈

| 项 | 值 |
|----|----|
| 脚本语言 | Node.js ES Modules（零依赖，需 Node 18+） |
| 数据格式 | JSON（`data/model-heuristics.json`） |
| API 协议 | OpenAI 兼容（`openai-completions`） |
| API 端点 | `GET https://fireworks-simulator-api.huo15.com/v1/models` |
| 配置文件 | `~/.openclaw/openclaw.json` |

---

## 三、核心设计决策

| 决策 | 原因 |
|------|------|
| **动态获取**（非硬编码） | 平台模型变化频繁（30→40→50+），硬编码会过期 |
| **启发式分类** | 已知模型精确参数 + 未知模型模式匹配推断，平台新增无需更新 |
| **零依赖 Node 脚本** | 不需 npm install，用户直接运行 |
| **只操作 fireworks-hub provider** | 不碰其他 provider，幂等安全 |
| **写入前自动备份** | 可回滚 |
| **SKILL.md 嵌入完整流程** | LLM 加载后 0 次 API 探索，省 token |

---

## 四、文件结构

```
huo15-juxingyi-configure/
├── SKILL.md                       # LLM 嵌入源（≤25KB）
├── _meta.json                     # ClawHub 元数据
├── README.md                      # 公开文档（面向用户）
├── CLAUDE.md                      # 开发规范（本文档）
├── LICENSE                        # MIT
├── .gitignore                     # skill 级忽略
├── data/
│   └── model-heuristics.json      # 模型分类启发式数据（30 个已知模型 + tier 规则）
├── scripts/
│   └── configure.mjs              # 核心脚本（385 行），所有逻辑在此
└── docs/
    ├── prd.md                     # 产品需求文档
    ├── user-guide.md              # 用户手册 SOP
    ├── dev-guide.md               # 开发者 SOP（更详细的架构内幕）
    └── changelog.md               # 版本变更历史
```

---

## 五、configure.mjs 架构

```
参数解析 → 加载 model-heuristics.json
    │
    ├── --show       → cmdShow()       读 openclaw.json，展示当前配置
    ├── --switch X   → cmdSwitch()     读/写 openclaw.json，切换主模型
    ├── <key> --list → fetchModels() + cmdList()    动态获取 + 展示
    ├── <key> --json  → fetchModels() + cmdJson()    动态获取 + 输出 JSON
    └── <key>         → fetchModels() + cmdConfigure()  动态获取 + 写入
```

### 关键函数

| 函数 | 职责 |
|------|------|
| `fetchModels(apiKey)` | 调 `GET /v1/models`，返回模型数组 |
| `classifyModel(id)` | 三级分类：skipPatterns → knownModels → tierPatterns 推断 |
| `guessTier(id)` | 按名称模式匹配推断 tier |
| `buildProviderConfig()` | 生成 provider JSON 片段（含模型列表排序） |
| `buildAgentsDefaults()` | 生成 primary + fallbacks + aliases |
| `readOpenclawJson()` | 读取 `~/.openclaw/openclaw.json` |
| `writeOpenclawJson(config)` | 备份 + 写入 |

### 模型分类三级逻辑

1. **skipPatterns**：ID 含 `Image` / `Seedream` / `T2V` / `I2V` / `happyhorse` → 跳过（生图/视频）
2. **knownModels**：精确参数（reasoning / contextWindow / maxTokens / tier）
3. **tierPatterns**：未知模型按关键词推断（`Flash/Turbo` → flash，`R1` → reasoner，`Pro/Max/Opus` → pro）

---

## 六、修改指引

### 新增已知模型

编辑 `data/model-heuristics.json` 的 `knownModels`：

```json
{
  "NewModel-X": {
    "reasoning": true,
    "contextWindow": 131072,
    "maxTokens": 8192,
    "tier": "pro"
  }
}
```

> 不加入也能工作——脚本会用 `tierPatterns` 推断，用 `defaults` 参数。加入只为精确。

### 调整 tier 判定逻辑

编辑 `tierPatterns` 段，添加关键词。

### 修改默认主模型

编辑 `data/model-heuristics.json` 的 `defaultModel` 字段。

### 修改 skipPatterns（新增生图/视频模型命名模式）

编辑 `data/model-heuristics.json` 的 `skipPatterns` 数组。

---

## 七、铁律

1. ❌ **不在任何文件中硬编码 API Key** — 用户每次运行时提供
2. ❌ **不跳过动态获取** — 必须调 `/v1/models`，不用过期列表
3. ❌ **配置完不问就结束** — 必须主动问用户是否切换模型（见 SKILL.md §三 Step 3）
4. ❌ **不破坏其他 provider** — 只改 `fireworks-hub` 段
5. ❌ **不忘记备份** — 写入前必须备份 openclaw.json
6. ❌ **密钥禁止出现在 commit / log / PR / 任何 LLM 上下文**
7. ✅ **SKILL.md ≤ 25KB** — 检查：`wc -c SKILL.md`

---

## 八、踩坑经验

### 坑 1：MiniMax 模型被误判为 flash

`tierPatterns` 中 `Mini` 关键词太宽泛，`MiniMax-M2.7` 被匹配。

**解决**：在 `knownModels` 中为每个 MiniMax 模型指定精确 tier。`tierPatterns` 只是未知模型的 fallback。

### 坑 2：`deepMerge` 函数定义了但未使用

开发初期设计了深度合并，后来改为直接覆盖 `fireworks-hub` 段（更安全可预测）。函数保留但未调用。

### 坑 3：GitHub 推送可能失败

`git push origin main` 可能报 `could not read Username`。CNB 是主库，GitHub 是镜像，CNB 成功即可。

### 坑 4：品牌词检查

对外文档不能出现 `odoo` / `uniapp` / `uni-app` / `欧度`。已发布 slug `huo15-odoo19-module-dev` 本身是例外，但描述文字不能含违禁词。

---

## 九、发布前自查

```bash
# 品牌词检查（必须无命中）
grep -riE "odoo|uniapp|uni-app|欧度" README.md SKILL.md CLAUDE.md docs/

# SKILL.md 大小（应 < 25600 字节）
wc -c SKILL.md

# 脚本语法检查
node --check scripts/configure.mjs

# JSON 格式检查
python3 -c "import json; json.load(open('data/model-heuristics.json'))"

# 功能测试
node scripts/configure.mjs --show
node scripts/configure.mjs fsk-测试key --list
```

---

## 十、发布流程

```bash
# 1. 提交
cd ~/workspace/projects/openclaw/huo15-skills
git add huo15-juxingyi-configure/
git commit -m "feat(huo15-juxingyi-configure): vX.Y.Z 说明"

# 2. 推送
git push cnb main     # CNB（主）
git push origin main  # GitHub（镜像，失败不阻塞）

# 3. 发布 ClawHub
clawhub publish "$(pwd)/huo15-juxingyi-configure" \
  --slug huo15-juxingyi-configure \
  --version X.Y.Z \
  --changelog "说明"

# 4. chore commit
git commit --allow-empty -m "chore(huo15-juxingyi-configure): bump _meta to vX.Y.Z"
git push cnb main
```

**版本号规则**：架构重构/新功能 → 次版本+1；Bug修复/文案 → 补丁+1。

---

## 十一、与其他 skill 协作

| Skill | 关系 |
|-------|------|
| `huo15-yh-usage` | 互补：本 skill 配置接入，yh-usage 查用量账单 |
| `huo15-openclaw-bootstrap` | 上游：bootstrap 初始化 workspace 后配置模型供应商 |

---

## 十二、联系方式

- **公司**: 青岛火一五信息科技有限公司
- **邮箱**: postmaster@huo15.com
- **QQ群**: 1093992108
