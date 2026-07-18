#!/usr/bin/env python3
"""douyin_summary.py — 抖音视频下载去水印 + 语音转写 + LLM 总结文稿

零第三方依赖（仅标准库），外部命令依赖 yt-dlp + ffmpeg。
ASR / LLM 通过 OpenAI 兼容 API 调用（平台网关 / 自托管均可）。

用法:
  python3 douyin_summary.py download  <抖音链接> [-o 输出目录]
  python3 douyin_summary.py transcribe <video.mp4> [--api-base URL] [--api-key KEY]
  python3 douyin_summary.py summarize <transcript.json> [--api-base URL] [--api-key KEY] [--model MODEL]
  python3 douyin_summary.py all <抖音链接> [-o 输出目录] [--api-base URL] [--api-key KEY] [--model MODEL]

环境变量:
  DY_API_BASE    OpenAI 兼容 API 地址（如 https://xxx/v1）
  DY_API_KEY     API Key
  DY_ASR_MODEL   转写模型名（默认 whisper-1 / SenseVoice）
  DY_LLM_MODEL   总结模型名（默认 gpt-4o-mini）
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# ── 工具函数 ──

def run(cmd, **kw):
    """运行外部命令，失败抛异常。"""
    print(f"  $ {' '.join(cmd)}")
    return subprocess.run(cmd, check=True, **kw)


def check_bin(name):
    """检查命令是否存在。"""
    return shutil.which(name) is not None


def api_base_url(flag_value):
    """获取 API base（命令行 > 环境变量）。"""
    url = flag_value or os.environ.get("DY_API_BASE", "")
    if not url:
        die("缺少 API base，请用 --api-base 或设置 DY_API_BASE 环境变量")
    return url.rstrip("/")


def api_key_value(flag_value):
    """获取 API key。"""
    key = flag_value or os.environ.get("DY_API_KEY", "")
    if not key:
        die("缺少 API key，请用 --api-key 或设置 DY_API_KEY 环境变量")
    return key


def die(msg, code=1):
    print(f"❌ {msg}", file=sys.stderr)
    sys.exit(code)


def http_post_json(url, headers, payload):
    """POST JSON 并返回响应 JSON。"""
    data = json.dumps(payload).encode("utf-8")
    req = Request(url, data=data, headers=headers, method="POST")
    with urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_post_multipart(url, fields, files):
    """POST multipart/form-data（用于音频上传）。纯标准库实现。"""
    boundary = f"----dy{int(time.time() * 1000)}"
    body = b""
    # 普通字段
    for k, v in fields.items():
        body += f"--{boundary}\r\n".encode()
        body += f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode()
        body += f"{v}\r\n".encode()
    # 文件字段
    for field_name, (filename, filebytes, content_type) in files.items():
        body += f"--{boundary}\r\n".encode()
        body += (
            f'Content-Disposition: form-data; name="{field_name}"; '
            f'filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n"
        ).encode()
        body += filebytes + b"\r\n"
    body += f"--{boundary}--\r\n".encode()

    req = Request(
        url,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    with urlopen(req, timeout=300) as resp:
        return json.loads(resp.read().decode("utf-8"))


# ── 阶段 1：下载无水印视频 ──

def download_video(url, out_dir):
    """用 yt-dlp 下载抖音无水印视频。

    yt-dlp 的 Douyin extractor 默认从抖音 API 获取 play_addr（无水印源），
    所以下载下来的就是无水印视频。需要浏览器 cookies（fresh cookies 即可，无需登录态）。
    """
    if not check_bin("yt-dlp"):
        die("yt-dlp 未安装。macOS: brew install yt-dlp")
    if not check_bin("ffmpeg"):
        die("ffmpeg 未安装。macOS: brew install ffmpeg")

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    video_path = out_dir / "video.mp4"

    if video_path.exists():
        print(f"  ↳ 视频已存在，跳过下载: {video_path}")
        return str(video_path)

    print(f"  ↳ 下载视频: {url}")
    cmd = [
        "yt-dlp",
        "-o", str(video_path),
        "--no-playlist",
        "--no-warnings",
        "-f", "best[ext=mp4]/best",
    ]

    # 抖音需要浏览器 cookies
    if "douyin" in url or "v.douyin" in url:
        print("  ↳ 检测到抖音链接，自动从浏览器导入 cookies")
        # 尝试 Chrome → Safari → Firefox
        for browser in ("chrome", "safari", "firefox"):
            test_cmd = ["yt-dlp", "--cookies-from-browser", browser, "--no-warnings",
                        "-F", url]
            try:
                subprocess.run(test_cmd, capture_output=True, timeout=30)
                cmd.extend(["--cookies-from-browser", browser])
                print(f"  ↳ 使用 {browser} cookies")
                break
            except Exception:
                continue

    cmd.append(url)
    run(cmd)
    print(f"  ✅ 已下载: {video_path}")
    return str(video_path)


def extract_audio(video_path, out_dir):
    """用 ffmpeg 提取音频（16kHz 单声道 wav，适配 ASR）。"""
    audio_path = Path(out_dir) / "audio.wav"
    if audio_path.exists():
        print(f"  ↳ 音频已存在: {audio_path}")
        return str(audio_path)
    print(f"  ↳ 提取音频: {video_path} → {audio_path}")
    run([
        "ffmpeg", "-i", video_path,
        "-vn", "-ac", "1", "-ar", "16000",
        "-f", "wav", "-y", str(audio_path),
    ], capture_output=True)
    print(f"  ✅ 音频: {audio_path}")
    return str(audio_path)


# ── 阶段 2：语音转写（ASR） ──

def transcribe_audio(audio_path, api_base, api_key, model=None):
    """调 OpenAI 兼容 /v1/audio/transcriptions 转写。

    兼容：
      - OpenAI Whisper
      - 自托管 SenseVoice（FunAudioLLM）
      - 聚星逸平台 /v1/audio/transcriptions
    """
    model = model or os.environ.get("DY_ASR_MODEL", "whisper-1")
    url = api_base + "/audio/transcriptions"

    print(f"  ↳ 语音转写: {audio_path} → {url} (model={model})")
    with open(audio_path, "rb") as f:
        audio_bytes = f.read()

    result = http_post_multipart(
        url,
        fields={"model": model},
        files={"file": ("audio.wav", audio_bytes, "audio/wav")},
    )

    # 兼容多种返回格式
    text = result.get("text", "")
    segments = result.get("segments", [])

    transcript = {
        "text": text,
        "segments": segments,
        "model": model,
        "audioPath": str(audio_path),
    }
    print(f"  ✅ 转录完成 ({len(text)} 字)")
    return transcript


# ── 阶段 3：LLM 总结 ──

SUMMARY_PROMPT = """你是一个专业的视频内容总结专家。下面是一个视频的完整语音转录文本。请生成一份结构化的内容总结文稿。

## 转录文本
{transcript}

## 输出要求
请用 Markdown 格式输出，包含以下部分：

### 📌 一句话总结
（用一句话概括视频核心内容）

### 📝 详细总结
（按逻辑段落组织，提炼视频的主要观点和信息，300-600 字）

### 🔑 关键要点
（用 bullet list 列出 3-8 个关键要点）

### 🏷️ 标签
（3-5 个相关话题标签，用 # 开头）

请直接输出 Markdown，不要加额外说明。"""

CHAPTER_PROMPT = """你是一个视频结构分析专家。下面是一个视频的完整语音转录文本。请分析其结构并输出 JSON。

## 转录文本
{transcript}

## 输出要求
严格输出 JSON（不要 markdown 代码块）:
{{
  "title": "视频标题（从内容推断）",
  "topic": "主题（一句话）",
  "type": "视频类型（知识科普/产品评测/教程/种草/娱乐等）",
  "chapters": [
    {{
      "chapterId": 1,
      "title": "章节标题",
      "summary": "该章节内容摘要（1-2句话）",
      "keyPoints": ["要点1", "要点2"]
    }}
  ],
  "overallSummary": "整体内容描述（2-3句话）"
}}"""


def summarize_transcript(transcript_text, api_base, api_key, model=None):
    """调 LLM 生成总结文稿。"""
    model = model or os.environ.get("DY_LLM_MODEL", "gpt-4o-mini")
    url = api_base + "/chat/completions"
    print(f"  ↳ LLM 总结: (model={model}, {len(transcript_text)} 字)")

    # 总结文稿
    summary_result = http_post_json(
        url,
        {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        {
            "model": model,
            "messages": [{"role": "user", "content": SUMMARY_PROMPT.format(transcript=transcript_text)}],
            "temperature": 0.3,
        },
    )
    summary_md = summary_result["choices"][0]["message"]["content"]
    print(f"  ✅ 总结文稿完成")

    # 章节分析
    chapter_result = http_post_json(
        url,
        {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        {
            "model": model,
            "messages": [{"role": "user", "content": CHAPTER_PROMPT.format(transcript=transcript_text)}],
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        },
    )
    chapter_text = chapter_result["choices"][0]["message"]["content"]
    chapter_text = chapter_text.strip()
    if chapter_text.startswith("```"):
        chapter_text = chapter_text.split("\n", 1)[1].rsplit("```", 1)[0]

    try:
        chapters = json.loads(chapter_text)
    except json.JSONDecodeError:
        chapters = {"raw": chapter_text}

    print(f"  ✅ 章节分析完成")
    return {"summary": summary_md, "chapters": chapters, "model": model}


# ── 主入口 ──

def cmd_download(args):
    out_dir = args.output or "./output"
    video_path = download_video(args.url, out_dir)
    audio_path = extract_audio(video_path, out_dir)
    print(f"\n📦 下载完成:")
    print(f"   视频: {video_path}")
    print(f"   音频: {audio_path}")


def cmd_transcribe(args):
    out_dir = Path(args.video).parent
    audio_path = extract_audio(args.video, out_dir)
    transcript = transcribe_audio(
        audio_path, api_base_url(args.api_base), api_key_value(args.api_key), args.asr_model
    )
    out_path = out_dir / "transcript.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(transcript, f, ensure_ascii=False, indent=2)
    # 纯文本
    with open(out_dir / "transcript.txt", "w", encoding="utf-8") as f:
        f.write(transcript["text"])
    print(f"\n📦 转录完成:")
    print(f"   JSON: {out_path}")
    print(f"   文本: {out_dir / 'transcript.txt'}")


def cmd_summarize(args):
    with open(args.transcript, "r", encoding="utf-8") as f:
        transcript = json.load(f)
    text = transcript.get("text", "")
    if not text:
        die("转录文件中没有 text 字段")
    result = summarize_transcript(
        text, api_base_url(args.api_base), api_key_value(args.api_key), args.model
    )
    out_dir = Path(args.transcript).parent
    with open(out_dir / "summary.md", "w", encoding="utf-8") as f:
        f.write(result["summary"])
    with open(out_dir / "chapters.json", "w", encoding="utf-8") as f:
        json.dump(result["chapters"], f, ensure_ascii=False, indent=2)
    print(f"\n📦 总结完成:")
    print(f"   文稿: {out_dir / 'summary.md'}")
    print(f"   章节: {out_dir / 'chapters.json'}")
    print(f"\n{'=' * 50}")
    print(result["summary"])
    print(f"{'=' * 50}")


def cmd_all(args):
    out_dir = args.output or "./output"
    # 1. 下载
    print("\n[1/3] 下载视频 + 提取音频")
    video_path = download_video(args.url, out_dir)
    audio_path = extract_audio(video_path, out_dir)

    # 2. 转录
    print("\n[2/3] 语音转写")
    transcript = transcribe_audio(
        audio_path, api_base_url(args.api_base), api_key_value(args.api_key), args.asr_model
    )
    out_dir_path = Path(out_dir)
    with open(out_dir_path / "transcript.json", "w", encoding="utf-8") as f:
        json.dump(transcript, f, ensure_ascii=False, indent=2)
    with open(out_dir_path / "transcript.txt", "w", encoding="utf-8") as f:
        f.write(transcript["text"])

    # 3. 总结
    print("\n[3/3] LLM 总结")
    result = summarize_transcript(
        transcript["text"], api_base_url(args.api_base), api_key_value(args.api_key), args.model
    )
    with open(out_dir_path / "summary.md", "w", encoding="utf-8") as f:
        f.write(result["summary"])
    with open(out_dir_path / "chapters.json", "w", encoding="utf-8") as f:
        json.dump(result["chapters"], f, ensure_ascii=False, indent=2)

    print(f"\n{'═' * 50}")
    print(f"  🎉 全流程完成！")
    print(f"{'═' * 50}")
    print(f"  📹 无水印视频: {video_path}")
    print(f"  🎵 音频:       {audio_path}")
    print(f"  📝 转录:       {out_dir_path / 'transcript.txt'}")
    print(f"  📋 总结文稿:   {out_dir_path / 'summary.md'}")
    print(f"  📑 章节分析:   {out_dir_path / 'chapters.json'}")
    print(f"{'═' * 50}\n")
    print(result["summary"])
    print(f"\n{'═' * 50}\n")


def main():
    parser = argparse.ArgumentParser(
        description="抖音视频下载去水印 + 语音转写 + LLM 总结文稿",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # download
    p = sub.add_parser("download", help="下载无水印视频 + 提取音频")
    p.add_argument("url", help="抖音视频链接")
    p.add_argument("-o", "--output", default="./output", help="输出目录")
    p.set_defaults(func=cmd_download)

    # transcribe
    p = sub.add_parser("transcribe", help="语音转写（需先下载）")
    p.add_argument("video", help="视频文件路径")
    p.add_argument("--api-base", help="API base（或 DY_API_BASE）")
    p.add_argument("--api-key", help="API key（或 DY_API_KEY）")
    p.add_argument("--asr-model", help="ASR 模型名（默认 whisper-1）")
    p.set_defaults(func=cmd_transcribe)

    # summarize
    p = sub.add_parser("summarize", help="LLM 总结文稿（需先转录）")
    p.add_argument("transcript", help="transcript.json 路径")
    p.add_argument("--api-base", help="API base")
    p.add_argument("--api-key", help="API key")
    p.add_argument("--model", help="LLM 模型名（默认 gpt-4o-mini）")
    p.set_defaults(func=cmd_summarize)

    # all
    p = sub.add_parser("all", help="一键全流程：下载→转录→总结")
    p.add_argument("url", help="抖音视频链接")
    p.add_argument("-o", "--output", default="./output", help="输出目录")
    p.add_argument("--api-base", help="API base")
    p.add_argument("--api-key", help="API key")
    p.add_argument("--asr-model", help="ASR 模型名")
    p.add_argument("--model", help="LLM 模型名")
    p.set_defaults(func=cmd_all)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
