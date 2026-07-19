# 开发者 SOP · 聚星逸配置

> 面向接手开发的工程师。涵盖架构内幕、运维流程、注意事项、踩坑经验。

---

## 一、项目概览

| 项 | 值 |
|----|-----|
| Slug | `huo15-juxingyi-configure` |
| 版本 | 1.0.0 |
| 仓库 | https://cnb.cool/huo15/ai/huo15-skills（主）/ https://github.com/zhaobod1/huo15-skills（镜像） |
| 目录 | `huo15-skills/huo15-juxingyi-configure/` |
| 技术栈 | Node.js 18+ ES Modules（零依赖） |
| 发布平台 | ClawHub |

---

## 二、架构设计

### 2.1 核心设计决策

| 决策 | 原因 |
|------|------|
| **动态获取模型列表**（而非硬编码） | 聚星逸平台模型变化频繁（30→40→50+），硬编码会过期。每次运行调 `/v1/models` 确保最新 |
| **启发式分类**（knownModels + tierPatterns） | 已知模型用精确参数，未知模型用模式匹配推断，平台新增模型无需更新 skill |
| **零依赖 Node 脚本** | 不需要 npm install，Node 18+ 自带 fetch，用户直接运行 |
| **只操作 fireworks-hub provider** | 不碰其他 provider，保证幂等安全 |
| **写入前自动备份** | 可回滚，用户放心 |
| **SKILL.md 嵌入完整流程** | LLM 加载 SKILL.md 后 0 次 API 探索即可配置，省 token |

### 2.2 文件职责

```
huo15-juxingyi-configure/
├── SKILL.md                       # LLM 嵌入源（≤25KB），指导 AI 执行配置流程
├── _meta.json                     # ClawHub 元数据（ownerId/slug/version）
├── README.md                      # 公开文档（面向用户）
├── CLAUDE.md                      # 开发规范（面向接手开发者）
├── LICENSE                        # MIT
├── data/
│   └── model-heuristics.json      # 模型分类数据（已知模型元数据 + tier 模式匹配规则）
├── scripts/
│   └── configure.mjs              # 核心脚本（561行），所有逻辑在此
└── docs/
    ├── prd.md                     # 产品需求文档
    ├── user-guide.md              # 用户手册 SOP
    ├── dev-guide.md               # 开发者 SOP（本文档）
    └── changelog.md               # 版本变更历史
```

### 2.3 configure.mjs 架构

```
参数解析 → Node 版本检查 → 加载 model-heuristics.json
    │
    ├── --help/-h      → cmdHelp()       显示帮助
    ├── --version/-v   → cmdVersion()    读 _meta.json，显示版本
    ├── --selftest     → cmdSelftest()   不联网，跑内置断言（19 项）
    ├── --show         → cmdShow()       读 openclaw.json，展示当前配置
    ├── --switch X     → cmdSwitch()     读/写 openclaw.json，切换主模型（支持前缀匹配）
    ├── <key> --list   → fetchModels() + cmdList()       动态获取，展示
    ├── <key> --json   → fetchModels() + cmdJson()       动态获取，输出 JSON
    └── <key>          → fetchModels() + cmdConfigure()  动态获取，写入 openclaw.json
```

**关键函数**：
- `fetchModels(apiKey)` — 调 `GET /v1/models`，带 15s 超时 + 错误分类（401/403/5xx）+ 空列表防护
- `classifyModel(id)` — 三级分类：skipPatterns → knownModels → tierPatterns 推断
- `guessTier(id)` / `resolveModelId(input, ids)` — tier 推断 / 模型 ID 解析（精确→大小写不敏感→前缀唯一）
- `buildProviderConfig(apiKey, rawModels)` — 生成 provider JSON 片段
- `buildAgentsDefaults(textModels, primaryId)` — 生成 primary + fallbacks + aliases
- `writeOpenclawJson(config)` — 备份 + 写入
- `cmdSelftest()` — 不联网的内置自检（19 项断言，验证分类/解析逻辑）

---

## 三、开发环境

### 3.1 准备

```bash
# 仓库
cd ~/workspace/projects/openclaw/huo15-skills
cd huo15-juxingyi-configure

# Node 版本（需 18+）
node -v

# 无需 npm install（零依赖）
```

### 3.2 测试

```bash
# 语法检查
node --check scripts/configure.mjs

# 内置自检（不联网，验证分类/解析逻辑）
node scripts/configure.mjs --selftest

# 列出模型（用真实 key 测试动态获取）
node scripts/configure.mjs fsk-测试key --list

# 查看当前配置（不需 key）
node scripts/configure.mjs --show

# 输出 JSON 片段（不写文件，安全）
node scripts/configure.mjs fsk-测试key --json
```

### 3.3 修改 model-heuristics.json

当聚星逸新增重要模型时，可以把它加入 `knownModels` 获得精确参数：

```json
{
  "knownModels": {
    "NewModel-X": {
      "reasoning": true,
      "contextWindow": 131072,
      "maxTokens": 8192,
      "tier": "pro"
    }
  }
}
```

> **注意**：不加入也能工作——脚本会用 `tierPatterns` 模式匹配推断 tier，用 `defaults` 参数。加入只是为了精确。

---

## 四、发布流程

### 4.1 标准发布（6 步）

```bash
# 1. 开发 & 测试
cd ~/workspace/projects/openclaw/huo15-skills/huo15-juxingyi-configure
node --check scripts/configure.mjs
node scripts/configure.mjs fsk-测试key --list

# 2. 自查
grep -riE "odoo|uniapp|uni-app|欧度" README.md SKILL.md CLAUDE.md docs/
wc -c SKILL.md  # 应 < 25600

# 3. 提交
cd ~/workspace/projects/openclaw/huo15-skills
git add huo15-juxingyi-configure/
git commit -m "feat(huo15-juxingyi-configure): vX.Y.Z 说明"

# 4. 推送双 remote
git push cnb main     # CNB（主）
git push origin main  # GitHub（镜像）

# 5. 发布 ClawHub
clawhub publish "$(pwd)/huo15-juxingyi-configure" \
  --slug huo15-juxingyi-configure \
  --version X.Y.Z \
  --changelog "说明"

# 6. chore commit（_meta.json 已是正确版本则跳过）
git commit --allow-empty -m "chore(huo15-juxingyi-configure): bump _meta to vX.Y.Z"
git push cnb main
```

### 4.2 版本号规则

| 变更类型 | 版本号 |
|---------|--------|
| 架构/哲学/触发器重构 | 次版本 +1（1.0 → 1.1） |
| 常规功能新增、新触发词 | 次版本 +1 |
| Bug 修复、文案调整、文档更新 | 补丁号 +1（1.0.0 → 1.0.1） |

### 4.3 ClawHub 发布六坑

| # | 坑 | 应对 |
|---|---|------|
| 1 | 必须绝对路径 | `clawhub publish "$(pwd)/huo15-juxingyi-configure"` |
| 2 | `--version` 必填 | CLI 不读 frontmatter / _meta.json |
| 3 | 新 slug 每小时 5 个配额 | 存量 slug 升版本不占额度 |
| 4 | `_meta.json` 不自动刷新 | 手动 bump + chore commit |
| 5 | 幽灵占用（inspect=2.5 但报 exists on 2.6） | 立刻跳 +1 patch，不重试 |
| 6 | Remote push 可能失败 | CNB 是主库，GitHub 镜像失败不阻塞 |

---

## 五、运维注意事项

### 5.1 密钥安全

- ❌ **密钥禁止出现在**：commit / log / PR / SKILL.md / README.md / 任何 LLM 上下文
- ✅ **用户每次运行时提供密钥**，skill 代码中不存储
- ✅ **推荐用 `--env` 模式**，配置文件中不存明文

### 5.2 openclaw.json 操作安全

- ✅ 每次写入前自动备份 `.bak.<timestamp>`
- ✅ 只操作 `fireworks-hub` provider 段
- ✅ 合并 `agents.defaults.models` 时保留非 `fireworks-hub/` 的已有条目
- ⚠️ 如果用户手动改了 openclaw.json 中 fireworks-hub 段，重新运行脚本会覆盖（但有备份）

### 5.3 模型列表维护

- **不需要定期更新** `model-heuristics.json`——脚本是动态获取的
- 只有以下情况需要更新：
  1. 平台新增了重要模型，想给它精确参数（而非用默认推断）
  2. tier 分类规则需要调整（比如新的关键词）
  3. skipPatterns 需要新增（比如新的生图/视频模型命名模式）

---

## 六、踩坑经验

### 坑 1：GitHub 推送失败

**现象**：`git push origin main` 报 `could not read Username` 或 HTTP2 framing error。

**原因**：GitHub remote 未配置凭据，或网络问题。

**解决**：CNB 是主库，GitHub 是镜像。CNB 推成功即可，GitHub 失败不阻塞发布。

### 坑 2：`deepMerge` 函数未使用（已清理）

**现象**：`configure.mjs` 中定义了 `deepMerge` 但没调用。

**原因**：开发初期设计了深度合并，后来改为直接覆盖 `fireworks-hub` 段（更安全、更可预测）。

**状态**：**v1.1.1 已删除该死代码**，不再保留。

### 坑 3：MiniMax 模型被误判为 flash

**现象**：`MiniMax-M2.7` 等模型被 `tierPatterns` 中的 `Mini` 匹配，判为 flash。

**原因**：`Mini` 关键词太宽泛。

**解决（v1.0）**：在 `knownModels` 中为每个 MiniMax 模型指定精确 tier。`tierPatterns` 只是未知模型的 fallback。

**根治（v1.1）**：`tierPatterns.flash` 里的 `Mini` 改为 `\bMini\b`（词边界匹配），`MiniMax` 不再被误匹配。`--selftest` 内置断言 `guessTier('MiniMax-M99') !== 'flash'` 持续守护。

### 坑 4：SKILL.md 中不能出现品牌违禁词

**现象**：`grep -riE "odoo|uniapp|uni-app|欧度"` 命中。

**原因**：README.md 中引用了 `huo15-odoo19-module-dev`（已发布 slug，不可改名）。

**解决**：slug 本身是例外，但描述文字不能出现违禁词。确保引用时只写 slug，不写 "odoo 模块开发" 等描述。

---

## 七、与其他 skill 的关系

| Skill | 关系 |
|-------|------|
| `huo15-yh-usage` | **互补**：本 skill 配置聚星逸接入，yh-usage 查该 key 的用量账单 |
| `huo15-openclaw-bootstrap` | **上游**：bootstrap 初始化 workspace 后，用户可能需要配置模型供应商（本 skill） |
| `huo15-token-optimizer` | **参考**：token-optimizer 的 references 中有 openclaw.json 配置格式参考 |

---

## 八、调试技巧

### 8.1 查看脚本生成的 JSON（不写文件）

```bash
node scripts/configure.mjs fsk-测试key --json | python3 -m json.tool
```

### 8.2 查看当前 openclaw.json 中的聚星逸段

```bash
cat ~/.openclaw/openclaw.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(json.dumps(d.get('models',{}).get('providers',{}).get('fireworks-hub',{}), indent=2, ensure_ascii=False))
"
```

### 8.3 测试 API 连通性

```bash
curl -s "https://fireworks-simulator-api.huo15.com/v1/models" \
  -H "Authorization: Bearer fsk-测试key" | python3 -m json.tool | head -20
```

### 8.4 查看备份文件

```bash
ls -lt ~/.openclaw/openclaw.json.bak.* | head -5
```

---

## 九、发布前自查 Checklist

```bash
# 1. 品牌词检查（必须无命中）
grep -riE "odoo|uniapp|uni-app|欧度" README.md SKILL.md CLAUDE.md docs/

# 2. SKILL.md 大小（应 < 25600 字节）
wc -c SKILL.md

# 3. 脚本语法检查
node --check scripts/configure.mjs

# 4. JSON 格式检查
python3 -c "import json; json.load(open('data/model-heuristics.json'))"
python3 -c "import json; json.load(open('_meta.json'))"

# 5. 脚本功能测试
node scripts/configure.mjs --show
node scripts/configure.mjs fsk-测试key --list

# 6. 内置自检（不联网，验证分类/解析逻辑）
node scripts/configure.mjs --selftest

# 7. git 状态
git status
```

---

## 十、后续规划

| 版本 | 计划 |
|------|------|
| v1.1 | 支持配置指定 agent 的模型（非 defaults） |
| v1.2 | 支持配置模型路由（`modelRouter` auto-task 模式） |
| v1.3 | 模型健康检查（测试每个模型是否可调用） |
| v1.4 | 支持配置 cost 字段（从平台 API 获取实时价格） |

---

**青岛火一五信息科技有限公司** · postmaster@huo15.com · QQ群 1093992108
