#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
卡片 / 名片 A4 双面拼版生成器（火一五物料生产技能）
原研哉极简风 + 印刷可读性 + 双面对齐免镜像 + 零间隙极浅细线剪裁。

用法：
  1) 改下面 CONFIG（尺寸 / 行列 / 二维码）与 FRONT_HTML / BACK_HTML（正反文案）
  2) python3 make_card.py            # 生成 card_sheet.html（二维码 base64 内嵌，自包含）
  3) node render_pdf.js card_sheet.html card.pdf landscape 2   # → A4 PDF（双面+分页）

排版铁律见 ../data/card.md：双面对齐用「居中对称栅格 + 同面每张相同」免镜像；
打印务必 100% 不缩放；印刷可读性 颜色≥#666 / 字号≥6.5px / 小字 weight 500。
"""
import os, base64

# ============================ CONFIG ============================
CARD_W, CARD_H = 90, 54      # 单卡 mm（90×54 = 中国标准名片）
COLS,  ROWS    = 3, 3        # A4 横向每页行列（90×54 → 3×3=9 张）
QR_PATH        = ""          # 二维码图片路径（留空=不放二维码）；如 "yxzk_qrcode.jpg"
OUT            = os.path.join(os.path.dirname(os.path.abspath(__file__)), "card_sheet.html")
ACCENT         = "#A83A2C"   # 朱红点睛（全卡唯一彩色）
CUT_LINE       = "#d2cfc8"   # 极浅裁切细线
# ================================================================

qr_uri = ""
if QR_PATH and os.path.exists(QR_PATH):
    qr_uri = "data:image/jpeg;base64," + base64.b64encode(open(QR_PATH, "rb").read()).decode()

# 正面：左上小品牌 / 中部主题大字 + 寄语（占大版面）。替换为你的文案。
FRONT_HTML = f"""
      <div class="brand"><b>品牌名称</b><span class="mid">·</span>子标题</div>
      <div class="body">
        <div class="tlabel">2026 年主题 · THEME 2026</div>
        <div class="hero">主题词<span class="hero-en">THEME</span></div>
        <div class="tag">一句中文寄语</div>
        <div class="tag-en">One line of English tagline</div>
      </div>"""

# 反面：右上小品牌块 / 中部主题 + 寄语 / 右下角二维码（若 QR_PATH 设置）
BACK_HTML = f"""
      <div class="corner-tr"><b>品牌名称</b><div class="ctr-en">SUB · BRAND</div></div>
      {'<img class="qr" src="'+qr_uri+'">' if qr_uri else ''}
      <div class="body">
        <div class="tlabel">2026 年主题 · THEME 2026</div>
        <div class="hero">主题词<span class="hero-en">THEME</span></div>
        <div class="tag">中文寄语第一行<br>中文寄语第二行</div>
        <div class="tag-en">English tagline line one<br>line two</div>
      </div>"""

CARD = lambda inner: f'<div class="card">{inner}</div>'
N = COLS * ROWS

CSS = f"""
  @page {{ size: A4 landscape; margin: 0; }}
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  html,body {{ width:297mm; background:#fff;
    font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
    -webkit-font-smoothing:antialiased; }}
  .sheet {{ width:297mm; height:210mm; display:flex; align-items:center; justify-content:center; }}
  .sheet.front {{ page-break-after:always; }}
  .grid {{ display:grid; grid-template-columns:repeat({COLS},{CARD_W}mm);
    grid-template-rows:repeat({ROWS},{CARD_H}mm); column-gap:0; row-gap:0; }}
  /* 零间隙共用极浅细线，剪刀沿线一刀分两张 */
  .card {{ position:relative; width:{CARD_W}mm; height:{CARD_H}mm; background:#fff;
    display:flex; flex-direction:column; padding:6mm 6mm 4mm 6mm;
    outline:0.2mm solid {CUT_LINE}; outline-offset:-0.1mm; }}
  /* 品牌（小，角落）*/
  .brand {{ font-size:11px; font-weight:500; color:#222; letter-spacing:.02em; }}
  .brand .mid, .hero .mid {{ color:{ACCENT}; margin:0 .1em; }}
  .corner-tr {{ position:absolute; top:5mm; right:6mm; text-align:right; line-height:1.3; }}
  .corner-tr b {{ font-size:10px; font-weight:600; color:#222; }}
  .ctr-en {{ font-size:6.5px; font-weight:500; color:#666; letter-spacing:.12em; text-transform:uppercase; }}
  /* 主体：主题大字 + 寄语，垂直居中占大版面 */
  .body {{ flex:1; display:flex; flex-direction:column; justify-content:center; }}
  .tlabel {{ font-size:8px; font-weight:500; color:#555; letter-spacing:.14em; }}
  .hero {{ font-size:28px; font-weight:600; color:#111; letter-spacing:.05em;
    margin:.6mm 0 2.4mm; display:flex; align-items:baseline; gap:3mm; }}
  .hero-en {{ font-size:10px; font-weight:500; color:#6a6a6a; letter-spacing:.18em; }}
  /* 寄语：印刷可读性——色不浅于 #1a1a1a/#6a6a6a、小字 weight 500 */
  .tag {{ font-size:11px; font-weight:450; color:#1a1a1a; line-height:1.6; }}
  .tag-en {{ font-size:7.5px; font-weight:500; color:#6a6a6a; font-style:italic;
    margin-top:1.4mm; line-height:1.5; }}
  /* 角落极小二维码（能扫即可）*/
  .qr {{ position:absolute; bottom:4mm; right:5mm; width:11mm; height:11mm; object-fit:contain; }}
"""

HTML = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>{CSS}</style></head>
<body>
  <div class="sheet front"><div class="grid">{CARD(FRONT_HTML)*N}</div></div>
  <div class="sheet back"><div class="grid">{CARD(BACK_HTML)*N}</div></div>
</body></html>"""

open(OUT, "w", encoding="utf-8").write(HTML)
print("written:", OUT, f"({CARD_W}×{CARD_H}mm × {N}/页，双面)")
