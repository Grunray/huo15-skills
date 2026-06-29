# 阿里云 OSS 资产工作流（全局规则）

> 所有 Web 资产（图 / 视频 / SVG / PDF / 音频）一律走 OSS 拿公网 URL；大文件不进 git。

## 桶信息

- Bucket：`huo15-odoo` ｜ Region：青岛 ｜ Endpoint：`oss-cn-qingdao.aliyuncs.com`
- **URL 规则**：`https://huo15-odoo.oss-cn-qingdao.aliyuncs.com/<对象路径>`
  - 含中文路径按 UTF-8 百分号编码后仍可直接访问；个别平台需纯 ASCII 时对中文段编码。
- 目录约定：`图片/`（海报/Logo/二维码/分享卡）、`成品/`（成片视频）、`素材/`（源素材）、`音频/`、`宣传页/`（可下载 PDF）、`video/`（官网在用·保持原位）。

## 上传

```bash
# 凭据走环境变量（绝不写进 skill / 不提交 git）；项目里通常放 gitignored .env
export OSS_KEY_ID=...  OSS_KEY_SECRET=...
export OSS_ENDPOINT=https://oss-cn-qingdao.aliyuncs.com  OSS_BUCKET=huo15-odoo

python3 scripts/oss_upload.py <本地文件> <对象路径>
python3 scripts/oss_upload.py poster.png 图片/my-poster.png   # stdout 打印公网 URL
```
- 自动设 `x-oss-object-acl: public-read` + 正确 `Content-Type`；大文件断点续传分片上传。

## 刷新清单（若项目维护 oss-files.md）

- 项目级 `oss_table.py` 拉全桶对象生成 `oss-files.md`（名称/路径/ACL/大小/日期/URL）。
- 新对象先在该脚本 `NAMES` 字典补「友好名/用途」再生成，清单才有可读说明。
- 本 skill 只带 `oss_upload.py`（通用上传）；清单维护是项目级动作，按需在项目内做。

## 凭据安全

- AccessKey **只**在环境变量 / 项目 gitignored `.env` / 用户记忆里；**绝不**写进 skill、README、提交历史。
- 校验上线：`curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download}\n" <URL>` 期望 `200`。
