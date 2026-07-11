# 变更历史 · huo15-juxingyi-configure

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
