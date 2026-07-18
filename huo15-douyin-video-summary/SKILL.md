---
name: huo15-douyin-video-summary
displayName: 抖音视频去水印总结
version: 1.0.0
description: "给一个抖音视频链接，自动下载无水印视频、提取音频、语音转写(ASR)、LLM总结内容文稿与章节结构。支持一键全流程或分步执行。兼容OpenAI Whisper/SenseVoice等转写模型及任意OpenAI兼容LLM。触发词：抖音总结、抖音文稿、视频总结、视频转文字、去水印下载、douyin summary。"
homepage: https://cnb.cool/huo15/ai/huo15-skills
metadata: { "openclaw": { "emoji": "🎬", "requires": { "bins": ["yt-dlp", "ffmpeg"] } } }
aliases:
  - 抖音视频去水印总结
  - 抖音视频总结
  - 抖音文稿
  - 视频总结
  - 视频转文字
  - 去水印下载
  - douyin summary
  - 抖音下载
---

# 抖音视频去水印 + 内容总结

> 给一个抖音视频链接 → 下载无水印视频 → 语音转写 → LLM 总结文稿 + 章节分析

---

## 能力

| 功能 | 说明 |
|---|---|
| 下载去水印 | yt-dlp 从抖音 API 获取无水印源，自动导入浏览器 cookies |
| 提取音频 | ffmpeg 转 16kHz 单声道 wav（适配 ASR） |
| 语音转写 | OpenAI 兼容 `/v1/audio/transcriptions`（Whisper / SenseVoice 等） |
| 内容总结 | LLM 生成结构化 Markdown 文稿（一句话总结 + 详细总结 + 要点 + 标签） |
| 章节分析 | LLM 输出 JSON 章节结构（标题 / 摘要 / 要点） |

---

## 依赖

```bash
# 必需命令
brew install yt-dlp ffmpeg        # macOS
# pip install yt-dlp               # 或 pip

# API 配置（二选一）
export DY_API_BASE=https://your-api/v1    # OpenAI 兼容 API 地址
export DY_API_KEY=sk-xxx                  # API Key

# 可选模型覆盖
export DY_ASR_MODEL=whisper-1             # 转写模型（默认 whisper-1）
export DY_LLM_MODEL=gpt-4o-mini           # 总结模型（默认 gpt-4o-mini）
```

> **零 Python 第三方依赖**：仅用标准库（urllib/json/subprocess），无需 pip install。

---

## 用法

### 一键全流程（推荐）

```bash
python3 scripts/douyin_summary.py all "https://v.douyin.com/xxxxx/" \
  --api-base https://api.example.com/v1 \
  --api-key sk-xxx
```

输出：
```
output/
├── video.mp4          无水印视频
├── audio.wav          音频
├── transcript.json    逐句转录（带 segments）
├── transcript.txt     纯文本转录
├── summary.md         总结文稿（Markdown）
└── chapters.json      章节结构（JSON）
```

### 分步执行

```bash
# 1. 仅下载去水印视频 + 提取音频
python3 scripts/douyin_summary.py download "https://v.douyin.com/xxxxx/" -o ./output

# 2. 仅语音转写（需先有视频/音频）
python3 scripts/douyin_summary.py transcribe ./output/video.mp4 \
  --api-base https://api.example.com/v1 --api-key sk-xxx

# 3. 仅 LLM 总结（需先有 transcript.json）
python3 scripts/douyin_summary.py summarize ./output/transcript.json \
  --api-base https://api.example.com/v1 --api-key sk-xxx --model gpt-4o-mini
```

---

## 输出说明

### summary.md（总结文稿）

```markdown
### 📌 一句话总结
（视频核心内容）

### 📝 详细总结
（300-600 字逻辑段落）

### 🔑 关键要点
- 要点 1
- 要点 2

### 🏷️ 标签
#话题1 #话题2
```

### chapters.json（章节结构）

```json
{
  "title": "视频标题",
  "topic": "主题",
  "type": "知识科普",
  "chapters": [
    { "chapterId": 1, "title": "章节标题", "summary": "摘要", "keyPoints": ["要点"] }
  ]
}
```

---

## 兼容的 ASR 服务

| 服务 | api_base | asr_model |
|---|---|---|
| OpenAI Whisper | `https://api.openai.com/v1` | `whisper-1` |
| 自托管 SenseVoice | `http://sensevoice:9080/v1` | `SenseVoice` |
| SiliconFlow | `https://api.siliconflow.cn/v1` | `FunAudioLLM/SenseVoiceSmall` |
| 聚星逸平台 | `https://fireworks-simulator-api.huo15.com/v1` | `SenseVoice` |

---

## 注意事项

1. **抖音 cookies**：yt-dlp 下载抖音需要 fresh cookies，脚本自动从浏览器导入（Chrome 优先），无需登录态
2. **无水印原理**：yt-dlp 的 Douyin extractor 从抖音 API 获取 `play_addr`（无水印源），非录屏去水印
3. **音频上限**：OpenAI Whisper 限 25MB；长视频建议用自托管 SenseVoice（无限制）
4. **合规**：仅用于个人学习分析，不二次分发原视频；总结文稿为 AI 生成

---

## 版本历史

- **v1.0.0**（2026-07）— 首版：下载去水印 + ASR 转录 + LLM 总结 + 章节分析
