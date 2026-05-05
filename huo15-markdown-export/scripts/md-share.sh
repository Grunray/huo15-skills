#!/usr/bin/env bash
# md-share.sh — 渲染 + 输出 share-ready JSON(给 AI 接力)
#
# 设计原则:**capability detection,零硬依赖**
# - 不 import / 不依赖 huo15-openclaw-enhance
# - 仅渲染产物 + 输出 JSON,把"如何分享"留给调用 skill 的 AI
# - AI 在场看见 enhance 的 enhance_share_file 工具 → chain 调用拿公网 URL
# - AI 看不见 enhance(独立装本 skill) → 直接把本地路径给用户/落盘归档
#
# 用法:
#   ./md-share.sh <input.md> [--mode pdf|image|html|wechat|all]
#                            [--theme <name>]
#                            [--label "展示名"]
#                            [--output-dir /tmp/...]
#                            [--expire-hours 24]
#
# 输出:JSON 到 stdout,渲染日志到 stderr
#
# JSON schema:
#   {
#     "status": "render_complete" | "error",
#     "files": [{ "path", "kind", "label", "size_kb", "mime" }],
#     "next_actions": [
#       { "priority": 1, "tool": "enhance_share_file", "args": {...}, "when": "OpenClaw + enhance 在场" },
#       { "priority": 2, "tool": null, "fallback": "直接把 path 告诉用户", "when": "无 enhance" }
#     ],
#     "ai_instruction": "..."
#   }

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

INPUT="${1:-}"
[[ -z "$INPUT" ]] && {
  cat >&2 <<'EOF'
用法: md-share.sh <input.md> [--mode MODE] [--theme NAME] [--label TEXT] [--output-dir DIR] [--expire-hours N]

  --mode MODE    pdf|image|html|wechat|all  (默认 pdf)
  --theme NAME   主题名(默认按 mode 选;见 templates/README.md)
  --label TEXT   展示名(传给 enhance_share_file,仅记录用)
  --output-dir DIR  渲染产物落盘目录(默认 mktemp 临时目录)
  --expire-hours N  enhance 链接有效期建议(传给 next_actions,默认 24)

输出:JSON 到 stdout,日志到 stderr。
EOF
  exit 1
}
shift

[[ -f "$INPUT" ]] || { echo "× 找不到输入: $INPUT" >&2; exit 1; }
ABS_INPUT="$(cd "$(dirname "$INPUT")" && pwd)/$(basename "$INPUT")"

MODE="pdf"
THEME=""
LABEL=""
OUTPUT_DIR=""
EXPIRE_HOURS="24"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --theme) THEME="$2"; shift 2 ;;
    --label) LABEL="$2"; shift 2 ;;
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --expire-hours) EXPIRE_HOURS="$2"; shift 2 ;;
    --*) echo "未知选项: $1" >&2; exit 1 ;;
    *) echo "未知参数: $1" >&2; exit 1 ;;
  esac
done

# 默认主题按 mode 选
default_theme_for() {
  case "$1" in
    pdf) echo "huo15-brand" ;;
    image) echo "xiaohongshu" ;;
    html) echo "typora-newsprint" ;;
    wechat) echo "wechat" ;;
    *) echo "typora-newsprint" ;;
  esac
}

# 输出目录
if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR="$(mktemp -d -t huo15-md-share.XXXXXX)"
fi
mkdir -p "$OUTPUT_DIR"

BASENAME="$(basename "$ABS_INPUT" .md)"
TS="$(date +%Y%m%d-%H%M%S)"
LABEL="${LABEL:-$BASENAME}"

# JSON file accumulator (jq 不一定装,纯 bash 拼)
FILES_JSON=""

render_one() {
  local kind="$1"
  local theme="${2:-$(default_theme_for "$kind")}"
  local out_path="$OUTPUT_DIR/${BASENAME}-${TS}"
  local mime=""
  local script=""
  case "$kind" in
    pdf)
      out_path="${out_path}.pdf"
      script="md2pdf-puppet.js"
      mime="application/pdf"
      [[ ! -d "$ROOT/node_modules" ]] && { echo "× node_modules 缺失;先 bash $SCRIPT_DIR/install-deps.sh" >&2; exit 2; }
      node "$SCRIPT_DIR/md2pdf-puppet.js" "$ABS_INPUT" "$out_path" --theme "$theme" >&2
      ;;
    image)
      out_path="${out_path}.png"
      mime="image/png"
      [[ ! -d "$ROOT/node_modules" ]] && { echo "× node_modules 缺失;先 bash $SCRIPT_DIR/install-deps.sh" >&2; exit 2; }
      node "$SCRIPT_DIR/md2image.js" "$ABS_INPUT" "$out_path" --theme "$theme" >&2
      ;;
    html)
      out_path="${out_path}.html"
      mime="text/html"
      [[ ! -d "$ROOT/node_modules" ]] && { echo "× node_modules 缺失;先 bash $SCRIPT_DIR/install-deps.sh" >&2; exit 2; }
      node "$SCRIPT_DIR/md2html.js" "$ABS_INPUT" "$out_path" --theme "$theme" >&2
      ;;
    wechat)
      out_path="${out_path}.wechat.html"
      mime="text/html"
      [[ ! -d "$ROOT/node_modules" ]] && { echo "× node_modules 缺失;先 bash $SCRIPT_DIR/install-deps.sh" >&2; exit 2; }
      node "$SCRIPT_DIR/md2wechat.js" "$ABS_INPUT" "$out_path" >&2
      ;;
    docx)
      out_path="${out_path}.docx"
      mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      command -v pandoc >/dev/null || { echo "× pandoc 未装;跳过 docx 输出" >&2; return 0; }
      bash "$SCRIPT_DIR/md2docx.sh" "$ABS_INPUT" "$out_path" >&2
      ;;
    *)
      echo "× 未知 kind: $kind" >&2; return 1 ;;
  esac

  [[ -f "$out_path" ]] || { echo "× 渲染失败: $out_path" >&2; return 1; }

  local size_kb
  size_kb="$(( $(stat -f%z "$out_path" 2>/dev/null || stat -c%s "$out_path") / 1024 ))"

  # JSON-escape path
  local esc_path; esc_path="$(printf '%s' "$out_path" | python3 -c 'import sys,json;print(json.dumps(sys.stdin.read()),end="")')"
  local esc_label; esc_label="$(printf '%s' "$LABEL ($kind)" | python3 -c 'import sys,json;print(json.dumps(sys.stdin.read()),end="")')"

  local entry
  entry=$(printf '{"path": %s, "kind": "%s", "label": %s, "size_kb": %s, "mime": "%s", "theme": "%s"}' \
    "$esc_path" "$kind" "$esc_label" "$size_kb" "$mime" "$theme")

  if [[ -z "$FILES_JSON" ]]; then
    FILES_JSON="$entry"
  else
    FILES_JSON="${FILES_JSON},${entry}"
  fi
}

case "$MODE" in
  pdf|image|html|wechat|docx)
    render_one "$MODE" "$THEME"
    ;;
  all)
    for k in pdf image html wechat; do
      render_one "$k" "" || true
    done
    ;;
  *)
    echo "× 未知 mode: $MODE(允许 pdf|image|html|wechat|docx|all)" >&2
    exit 1
    ;;
esac

# 输出 share-ready JSON
cat <<EOF
{
  "status": "render_complete",
  "skill": "huo15-markdown-export",
  "input": "$ABS_INPUT",
  "output_dir": "$OUTPUT_DIR",
  "files": [$FILES_JSON],
  "next_actions": [
    {
      "priority": 1,
      "tool": "enhance_share_file",
      "args_per_file": {"filePath": "<file.path>", "label": "<file.label>", "expireHours": $EXPIRE_HOURS},
      "result_field": "structuredContent.url",
      "when": "huo15-openclaw-enhance 插件在场(检测到 enhance_share_file 工具可调用)",
      "rationale": "拿到 https://<bot_base_url>/plugins/enhance-share/<token>-<filename> 公网 URL,跨企微/钉钉/微信通用",
      "warning": "严禁手写/拼接/猜测 URL — 必须从工具返回的 structuredContent.url 取"
    },
    {
      "priority": 2,
      "tool": null,
      "fallback": "直接把每个 file.path 告诉用户(本地路径)",
      "when": "未装 enhance / enhance_share_file 工具不可见 / 工具调用失败",
      "rationale": "本 skill 独立可用,不强依赖 enhance"
    }
  ],
  "ai_instruction": "对 files[] 逐个尝试 priority=1 的 enhance_share_file 工具;成功则把每个 url 组装成消息发给用户(注明展示名 label 和 kind);若工具不存在或失败,降级 priority=2 把本地 path 告知用户。"
}
EOF
