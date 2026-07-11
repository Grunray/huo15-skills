# huo15-juxingyi-configure 开发规范

> 聚星逸配置 skill —— 动态拉取模型列表并写入 openclaw.json

---

## 技术栈

- **脚本**: Node.js ES Modules（零依赖，需 Node 18+）
- **数据**: JSON（`data/model-heuristics.json`）
- **API**: OpenAI 兼容的 `/v1/models` 端点

---

## 核心设计

1. **动态获取模型**：每次运行脚本都调 `GET /v1/models`，而非使用硬编码列表
2. **启发式分类**：`data/model-heuristics.json` 提供已知模型元数据 + 新模型的模式匹配规则
3. **安全存储**：支持直接写入密钥或环境变量引用（`--env`）
4. **可逆操作**：写入前自动备份 `openclaw.json.bak.<timestamp>`
5. **灵活切换**：`--switch` 模式切换主模型，`--list` 查看可用模型

---

## 修改指引

### 新增已知模型

编辑 `data/model-heuristics.json` 的 `knownModels` 段：

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

### 调整 tier 判定逻辑

编辑 `tierPatterns` 段，添加新关键词：

```json
{
  "tierPatterns": {
    "flash": ["Flash", "Turbo", "Mini", "新关键词"],
    ...
  }
}
```

### 修改默认主模型

编辑 `data/model-heuristics.json` 的 `defaultModel` 字段 + `scripts/configure.mjs` 中同名字符串。

---

## 铁律

1. ❌ **不在任何文件中硬编码 API Key** — 用户每次运行时提供
2. ❌ **不跳过动态获取** — 必须调 `/v1/models`，不用过期列表
3. ✅ **每次写入前备份** — `openclaw.json.bak.<timestamp>`
4. ✅ **只操作 fireworks-hub provider** — 不破坏其他 provider 配置
5. ✅ **SKILL.md ≤ 25KB** — 检查大小：`wc -c SKILL.md`

---

## 测试

```bash
# 列出模型（仅查看）
node scripts/configure.mjs <fsk-key> --list

# 查看当前配置
node scripts/configure.mjs --show

# 切换模型
node scripts/configure.mjs --switch DeepSeek-V4-Pro

# 完整配置（会修改 openclaw.json）
node scripts/configure.mjs <fsk-key>
```

---

## 发布前自查

```bash
# 品牌词检查
grep -riE "odoo|uniapp|uni-app|欧度" README.md SKILL.md CLAUDE.md

# SKILL.md 大小（应 < 25KB）
wc -c SKILL.md

# 脚本语法检查（Node 18+）
node --check scripts/configure.mjs
```

---

## 与其他 skill 协作

| 场景 | 配套 skill |
|------|-----------|
| 查询 token 用量/费用 | [`huo15-yh-usage`](../huo15-yh-usage/)（凭 fsk- 查账单）|

---

## 联系方式

- **公司**: 青岛火一五信息科技有限公司
- **邮箱**: postmaster@huo15.com
- **QQ群**: 1093992108