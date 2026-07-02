# 开发经验与踩坑记录

> 格式：`## YYYY-MM-DD 标题`，按时间倒序追加。

---

## 2026-07 PGY 蒲公英博主搜索技能（huo15-xhs-pgy-test v0.1.0）

### 场景

用户需要在小红书蒲公英平台（pgy.xiaohongshu.com）按关键词和地区搜索探店博主，提取粉丝数、笔记数据、粉丝画像、报价等信息，整理成结构化报告。

### 核心经验

#### 1. Vue 搜索框 type 不生效

PGY 平台基于 Vue，`browser kind=type` 直接填充搜索框不触发响应式更新。必须用 native setter：

```javascript
const input = document.querySelector('input[placeholder*="笔记关键词"]');
const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
setter.call(input, '韩国探店');
input.dispatchEvent(new Event('input', { bubbles: true }));
input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', keyCode: 13 }));
```

**通用规律**：所有 Vue/React SPA 的输入框，都不能直接赋值，必须用 native setter + dispatchEvent。

#### 2. SPA 页面 snapshot 不完整

PGY 博主详情页是 SPA 布局，aria snapshot 只显示视口内元素，大量数据（粉丝画像、报价等）在滚动区域外不可见。

**解决方案**：用 `evaluate` 提取 `document.body.innerText`，一次获取全部文本内容：

```javascript
() => document.body.innerText.substring(0, 8000)
```

**通用规律**：对于数据提取类任务，`evaluate innerText` 比 `snapshot` 更可靠，snapshot 适合定位交互元素。

#### 3. 点击博主打开新标签页

搜索结果中点击博主头像/昵称会在新标签页打开详情页，不是在当前页面跳转。操作前必须用 `browser action=tabs` 获取新标签页的 targetId。

**通用规律**：SPA 中点击链接类元素后，先检查 tabs 是否有新标签页，不要假设还在原页面。

#### 4. ref 过期问题

页面任何 DOM 变化（导航、弹窗、滚动加载）后 aria ref 都可能失效。每次操作前先 `snapshot` 获取最新 ref。

#### 5. 截图依赖图像模型

当前模型（如 GLM-5.2）不支持图像分析时，`browser action=screenshot` 会失败。用 `evaluate innerText` 提取数据代替截图验证。

### 登录流程要点

1. 登录弹窗默认是「短信登录」，需点击「账号登录」切换
2. 先勾选用户协议复选框，再填写邮箱密码
3. 首次登录后有引导教程（1/7），需点击「跳过」

### 数据字段提取映射

从 innerText 文本中识别字段的标识词：

| 字段 | 文本标识 |
|------|----------|
| 小红书号 | "小红书号：" 后的数字 |
| 粉丝数 | "粉丝数" 后的数值（如 4.1w） |
| 获赞与收藏 | "获赞与收藏" 后的数值 |
| 图文报价 | "图文笔记一口价" 后的金额 |
| 视频报价 | "视频笔记一口价" 后的金额 |
| 笔记数据 | 每条笔记的「阅读/点赞/收藏/发布时间」依次排列 |
| 性别分布 | "女性居多，占比XX.X%" |
| 年龄分布 | "18-24居多，占比XX.X%" |
| 地域分布 | "国内最高的三个省份：" 后的列表 |

### 限制

- **二次使用授权报价**：PGY 平台不公开展示，需通过「发起邀约」与博主/机构单独沟通
- **账号 URL**：PGY 只展示小红书号（数字ID），不直接提供小红书 App 主页 URL
- **数据更新延迟**：平台数据标注「数据更新至」日期，非实时

### 发布记录

- 2026-07-03 发布到 clawhub：`huo15-xhs-pgy-test@0.1.0`（k9790bm7sfx2ps117v8fx53df189r4yq）

---

## 2026-05 ClawHub 发布常见坑（v0.8.0）

### 必须绝对路径

`clawhub publish .` 报 `SKILL.md required`，必须用 `clawhub publish "$(pwd)/<slug>"`。

### 幽灵占用版本号

`inspect` 显示 Latest=X.Y.Z，但 publish 同版本号报 `Version already exists`。
**应对**：直接 +1 patch 跳过，同步更新 `_meta.json` 和 `SKILL.md`，不要重试同一版本号。

### `_meta.json` 不自动同步

`clawhub publish` 成功后 `_meta.json` 中的 version 字段**不会自动更新**，必须手动 bump + 单独 `chore` commit。

### SKILL.md token 超限

嵌入上限 8192 tokens（约 25KB）。超限报 `Embedding failed`。
优先砍：历史 changelog 章节 / 重复 CLI 示例 / frontmatter 超长触发词。
详细内容挪到 `README.md` 或 `templates/README.md`（不参与嵌入）。

### 每小时新 slug 配额 5 个

只对首次 publish 计数，存量 slug 升版本不占额度。撞限流时切换到升版本策略，**不要 sleep 轮询重试**。

---

## 2026-05 openclaw-bootstrap v2.0 架构迁移经验

- v1.x 产 `profile.md`，v2.0 改产原生五件套（`SOUL/IDENTITY/USER/TOOLS/AGENTS.md`）
- 完成信号从"写完文件"改为"删 `BOOTSTRAP.md`"，openclaw workspace state 才转 complete
- 删 L1 龙虾 memory 写盘：原生 file→memory 链路自己工作，不要复制

---

## 2026-05 品牌词替换规则

对外文档（README / SKILL.md / docs/）中：

- `uniapp` / `uni-app` / `uniapp-x` / `跨平台框架` → 原生 Swift（iOS）/ 原生 Kotlin（Android）开发
- `Odoo` / `odoo` / `ODOO` / `欧度` → 辉火云企业套件
- `OWL (Odoo Web Library)` → 辉火云前端组件库

发版前自查命令：

```bash
grep -riE "odoo|uniapp|uni-app|欧度" README.md SKILL.md docs/
```

---

## 2026-05 openclaw Plugin 开发教训

- `compat.pluginApi` 一定要用 range（`>=X.Y.Z`），裸版本 runtime 升小版本就 install 失败
- `child_process` / `execSync` 部分企业 npm 扫描器整包拦截，改用 return-cliCmd 模式
- `registerMemoryCorpusSupplement` 是单参，不要传 pluginId
