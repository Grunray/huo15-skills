# 变更历史 · huo15-juxingyi-configure

---

## v1.1.1（2026-07-19）

**健壮性增强与代码质量提升。**（远程 1.1.0 已被 7-11 旧内容占用，跳 +1 patch 发布）

### 新增

- **`--help` / `-h` 子命令**：显示完整用法说明
- **`--version` / `-v` 子命令**：从 `_meta.json` 读取并显示版本号
- **`--selftest` 子命令**：不联网、不读写配置的内置自检（19 项断言），验证 `classifyModel` / `guessTier` / `resolveModelId` / `fmtModelName` / `tierWeight` 等纯函数逻辑
- **`--switch` 前缀匹配**：`resolveModelId` 按 精确 → 大小写不敏感 → 前缀唯一 三级解析，歧义时列出候选并退出
- **Node 版本检查**：Node < 18 时给出友好提示（而非 `fetch is not defined`）
- **API Key 格式校验**：`fsk-` 后必须有内容
- **`fetchModels` 增强**：15s 超时（AbortController）+ 错误分类（401 密钥无效 / 403 权限不足 / 5xx 服务异常 / 超时）+ 空模型列表防护

### 变更

- **根治 MiniMax 误判**：`data/model-heuristics.json` 的 `tierPatterns.flash` 里 `Mini` 改为 `\bMini\b`（词边界匹配），`MiniMax-*` 不再被误判为 flash
- **删除死代码**：移除从未调用的 `deepMerge` 函数

### 文档

- 同步 `CLAUDE.md` / `docs/dev-guide.md` 的脚本行数（385 → 561）、架构图、关键函数表、踩坑记录
- `dev-guide.md` 自查 checklist 与测试段补充 `--selftest`
- `SKILL.md` §四命令速查表补充 `--help` / `--version` / `--selftest`

---

## v1.0.0（2026-07-11）

**首版发布。**

### 新增

- **动态模型获取**：每次运行脚本调 `GET /v1/models`，确保模型列表最新
- **启发式分类**：`data/model-heuristics.json` 提供已知模型元数据 + 未知模型模式匹配
- **自动配置**：写入 `~/.openclaw/openclaw.json` 的 `models.providers.fireworks-hub` 段
- **默认主模型**：`DeepSeek-V4-Flash`（快速、支持推理）
- **备选链**：其余文本模型自动加入 fallbacks
- **模型别名**：每个模型自动生成 alias
- **子命令**：
  - `<fsk-key>` — 配置 provider + 全部模型
  - `<fsk-key> --list` — 列出可用模型
  - `<fsk-key> --json` — 输出 JSON 片段
  - `<fsk-key> --env` — 环境变量引用存储密钥
  - `--switch <model-id>` — 切换主模型
  - `--show` — 查看当前配置
- **安全**：写入前自动备份 `openclaw.json.bak.<timestamp>`
- **分类**：自动跳过生图/视频模型，按 tier（flash/pro/reasoner）排序
- **SKILL.md**：嵌入完整配置流程，指导 AI 配置后询问用户是否切换
- **文档**：PRD、用户手册 SOP、开发者 SOP
