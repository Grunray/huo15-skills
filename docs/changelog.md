# 仓库级变更记录

> 记录仓库整体架构、新 skill 上架、重大策略调整等，各 skill 自身变更见 `<slug>/docs/changelog.md`。

---

## 2026-08-01

- 新增 `huo15-dingtalk-agent-isolation` v1.0.0（钉钉智能体隔离技能）：为每个钉钉用户创建独立 Agent 工作空间、记忆和会话历史。支持手动绑定（Mode A，零代码）和动态创建（Mode B，自动 patch）两种模式 + 混合模式最佳实践。含 patch 脚本、验证脚本、配置生成器。README 技能总数更新至 34

---

## 2026-05-31

- `huo15-wvi` v1.1.0：流程重构为五步走（评分→追求的点→不愿放弃的点→保留三项→满足度），新增 Gap 分析与流失风险预警 + `docs/WVI理论报告.md`
- 新增 `huo15-wvi` v1.0.0（火一五工作价值观量表技能）：Super WVI 17维度一问一答 HR 调研工具，含报告生成
- 初始化 `docs/` 目录（experience.md / changelog.md / README.md）
- 创建仓库级 `CLAUDE.md`，加入版权原则、项目铁律、OpenClaw 全局原则
- 补充 `.gitignore`：secrets / credentials / env files / coverage / docs/private
- README 新增辉火云企业套件章节（3个 skill）和 HR 章节，技能总数更新至 33

---

## 2026-05

- `huo15-openclaw-bootstrap` v2.0.0：对齐 openclaw 2026.5+ 原生目录约定，改产原生五件套
- `huo15-markdown-export` v0.4.0：主题系统重构，新增 4 个预设主题
- `huo15-xiaohongshu` v3.10.0：第六层创作哲学（能量与持续力）+ 浏览器桥接 11 道防封闸门
