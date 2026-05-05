#!/usr/bin/env bash
# md-publish.sh — 渲染多端产物 + 本地 KB 归档 + 输出二阶段 share-ready JSON
#
# 设计目标:把"发出去给人看"和"给自己留档"做成同一个动作。
# 与 md-share.sh 的差别:
#   - md-share:轻量,单/多产物 + share JSON,不归档
#   - md-publish:多产物默认 + 自动 KB 归档(~/knowledge/huo15/) + 二阶段 QR PDF 提示
#
# 设计原则(同 md-share):capability detection,零硬依赖
#   - 不 import / 不 spawn enhance / 不 spawn wecom
#   - JSON 输出告诉 AI 接下来怎么 chain(优先 enhance,无则降级)
#   - 装本 skill 没装 enhance 也能跑:KB 归档照写,share URL 留 placeholder
#
# 用法:
#   ./md-publish.sh <input.md> [--mode all|pdf|image|html|wechat]
#                              [--slug my-q1-summary]    # KB 归档文件名,不传 = basename
#                              [--label "Q1 复盘"]
#                              [--with-qr]               # 启用二阶段 QR PDF(需要 enhance)
#                              [--no-archive]            # 跳过 KB 归档
#                              [--kb-dir ~/knowledge/huo15]
#                              [--expire-hours 24]
#
# 默认 mode=all:同一份 md 一次性渲染 PDF / PNG长图 / HTML / 公众号 inline
# AI 拿到 4 个 share URL 后组装"多版本菜单"消息发回当前会话,人在回路决定转发
#
# JSON 输出额外字段(相比 md-share):
#   - kb_archive: { path, slug, frontmatter_keys: [...] }
#   - post_share_actions:
#       1. 把每个 file 的 enhance URL 回写到 KB 归档 frontmatter 的 share_urls
#       2. 若 --with-qr:用第一个 PDF 的 URL 重新调 md2pdf-puppet --qr-url 生成带二维码的打印版
#       3. (可选) 把 KB 归档文件本身也 enhance_share 一次,作为"原始 markdown"备份链接

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

INPUT="${1:-}"
[[ -z "$INPUT" ]] && {
  cat >&2 <<'EOF'
用法: md-publish.sh <input.md> [--mode all|pdf|image|html|wechat] [--slug NAME] [--label TEXT]
                                [--with-qr] [--no-archive] [--kb-dir DIR] [--expire-hours N]

默认 mode=all,自动 KB 归档到 ~/knowledge/huo15/YYYY-MM-DD-<slug>.md。
EOF
  exit 1
}
shift
[[ -f "$INPUT" ]] || { echo "× 找不到输入: $INPUT" >&2; exit 1; }
ABS_INPUT="$(cd "$(dirname "$INPUT")" && pwd)/$(basename "$INPUT")"

MODE="all"
SLUG=""
LABEL=""
WITH_QR=0
NO_ARCHIVE=0
KB_DIR="$HOME/knowledge/huo15"
EXPIRE_HOURS="24"
OUTPUT_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --slug) SLUG="$2"; shift 2 ;;
    --label) LABEL="$2"; shift 2 ;;
    --with-qr) WITH_QR=1; shift ;;
    --no-archive) NO_ARCHIVE=1; shift ;;
    --kb-dir) KB_DIR="$2"; shift 2 ;;
    --expire-hours) EXPIRE_HOURS="$2"; shift 2 ;;
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --*) echo "未知选项: $1" >&2; exit 1 ;;
    *) echo "未知参数: $1" >&2; exit 1 ;;
  esac
done

BASENAME="$(basename "$ABS_INPUT" .md)"
SLUG="${SLUG:-$BASENAME}"
LABEL="${LABEL:-$SLUG}"
TODAY="$(date +%F)"
TS="$(date +%Y%m%d-%H%M%S)"

# 校验 slug 安全(只允许 [a-zA-Z0-9_一-龥-])
if [[ ! "$SLUG" =~ ^[A-Za-z0-9_-]+$ ]] && ! python3 -c "import re,sys; re.fullmatch(r'[\w-]+',sys.argv[1]) or sys.exit(1)" "$SLUG" 2>/dev/null; then
  echo "× slug 仅允许字母/数字/下划线/中划线/中文: $SLUG" >&2
  exit 1
fi

# 渲染输出目录
[[ -z "$OUTPUT_DIR" ]] && OUTPUT_DIR="$(mktemp -d -t huo15-md-publish.XXXXXX)"
mkdir -p "$OUTPUT_DIR"

# 调用 md-share 完成基础渲染 + 拿基础 JSON
echo "→ 渲染产物 (mode=$MODE)..." >&2
SHARE_JSON="$(bash "$SCRIPT_DIR/md-share.sh" "$ABS_INPUT" --mode "$MODE" --label "$LABEL" --output-dir "$OUTPUT_DIR" --expire-hours "$EXPIRE_HOURS")"

# KB 归档
KB_ARCHIVE_PATH=""
if [[ $NO_ARCHIVE -eq 0 ]]; then
  mkdir -p "$KB_DIR"
  KB_ARCHIVE_PATH="$KB_DIR/${TODAY}-${SLUG}.md"

  # 抽取首段作为 KB summary
  SUMMARY=$(awk '
    /^---$/{toggle=!toggle; next}
    toggle{next}
    /^#/{next}
    /^[[:space:]]*$/{if(found)exit; next}
    {gsub(/[*_`~#>]/,""); print; found=1; if(NR>30)exit}
  ' "$ABS_INPUT" | head -3 | tr '\n' ' ' | sed 's/  */ /g' | cut -c1-200)

  # 写归档 frontmatter + 原文
  {
    echo "---"
    echo "title: ${LABEL}"
    echo "slug: ${SLUG}"
    echo "published_at: ${TODAY}"
    echo "source: ${ABS_INPUT}"
    echo "summary: \"${SUMMARY}\""
    echo "render_outputs:"
    # 从 SHARE_JSON 抽 file paths
    echo "$SHARE_JSON" | python3 -c '
import json, sys
j = json.load(sys.stdin)
for f in j.get("files", []):
    print(f"  - kind: {f[\"kind\"]}")
    print(f"    path: {f[\"path\"]}")
    print(f"    size_kb: {f[\"size_kb\"]}")
    print(f"    theme: {f.get(\"theme\",\"\")}")
'
    echo "share_urls: []   # AI 调 enhance_share_file 后回写"
    echo "tags: [复盘, 火一五]"
    echo "---"
    echo
    cat "$ABS_INPUT"
  } > "$KB_ARCHIVE_PATH"

  echo "→ KB 归档:$KB_ARCHIVE_PATH" >&2
fi

# 拼最终 JSON:在 share JSON 基础上加 kb_archive + post_share_actions
# 用 python 做 JSON 合并保证合法
python3 - "$SHARE_JSON" "$KB_ARCHIVE_PATH" "$WITH_QR" "$EXPIRE_HOURS" "$LABEL" "$SLUG" "$ABS_INPUT" "$SCRIPT_DIR" <<'PYEOF'
import json, sys, os
share_json_str, kb_path, with_qr, expire_h, label, slug, abs_input, script_dir = sys.argv[1:9]
j = json.loads(share_json_str)

j["skill"] = "huo15-markdown-export"
j["mode"] = "publish"
j["label"] = label
j["slug"] = slug

if kb_path:
    j["kb_archive"] = {
        "path": kb_path,
        "slug": slug,
        "frontmatter_keys": ["title","slug","published_at","source","summary","render_outputs","share_urls","tags"],
    }
else:
    j["kb_archive"] = None

# 增强 next_actions:加 post_share 阶段
post_actions = [
    {
        "step": 1,
        "for_each_file": True,
        "tool": "enhance_share_file",
        "args_per_file": {"filePath": "<file.path>", "label": "<file.label>", "expireHours": int(expire_h)},
        "result_field": "structuredContent.url",
        "warning": "严禁手写/拼接/猜测 URL — 必须从工具 structuredContent.url 取真实链接",
    }
]

if kb_path:
    post_actions.append({
        "step": 2,
        "tool": "Edit (内置文件编辑)",
        "target_file": kb_path,
        "instruction": (
            "把 step 1 拿到的每个 file 的 enhance URL 回写到 KB 归档 frontmatter 的 share_urls 列表,"
            "格式:`- {kind: pdf, url: 'https://...'}`。这样未来翻档案就能直接拿到当时的公网链接。"
        ),
    })

if with_qr == "1":
    pdf_files = [f for f in j["files"] if f["kind"] == "pdf"]
    if pdf_files:
        post_actions.append({
            "step": 3,
            "for_pdf_only": True,
            "tool": f"node {script_dir}/md2pdf-puppet.js",
            "args": {
                "input": abs_input,
                "output": pdf_files[0]["path"].replace(".pdf", ".qr.pdf"),
                "--theme": pdf_files[0].get("theme", "huo15-brand"),
                "--qr-url": "<step 1 PDF 文件对应的 enhance url>",
                "--qr-label": "扫码看在线版",
            },
            "instruction": (
                "二阶段:用 step 1 拿到的 PDF 的 enhance URL 重新跑 md2pdf-puppet,生成带二维码的打印版 PDF;"
                "再调一次 enhance_share_file 把这个 .qr.pdf 也分享出去(可选,推荐打印场景使用)。"
            ),
        })

j["post_share_actions"] = post_actions

# 简化 ai_instruction
j["ai_instruction"] = (
    "1) 对 files[] 调 enhance_share_file 拿 URLs(post_share_actions[0]);"
    + (" 2) 把 URLs Edit 回写到 kb_archive.path 的 frontmatter share_urls;" if kb_path else "")
    + (" 3) (--with-qr 模式)用 PDF URL 跑 md2pdf-puppet --qr-url 生成带二维码版,再 enhance_share 一次;" if with_qr == "1" else "")
    + " 最后:把所有 URLs 组装成'多版本菜单'消息发给当前会话用户,让用户自己决定转发到哪个群"
    + "(严禁主动广播、严禁 @all、严禁假设用户的目标群)。"
)

print(json.dumps(j, ensure_ascii=False, indent=2))
PYEOF
