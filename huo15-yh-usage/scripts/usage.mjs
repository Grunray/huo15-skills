#!/usr/bin/env node
// 烟花智汇 model usage —— 凭客户 API Key 查该 Key 的 token 用量与费用,输出中文报告。
// 用法: node usage.mjs <fsk-key> [days=30] [--json]
// 数据源: GET https://fireworks-simulator-api.huo15.com/v1/usage?days=N  (Authorization: Bearer fsk-...)
// 端点按 apiKeyId 聚合,返回 totals / byModel / daily,费用单位 CNY(¥)。

const BASE = process.env.YH_BASE || 'https://fireworks-simulator-api.huo15.com/v1'

const args = process.argv.slice(2)
const json = args.includes('--json')
const rest = args.filter((a) => !a.startsWith('--'))
const key = rest[0]
const days = Math.min(90, Math.max(1, parseInt(rest[1], 10) || 30))

if (!key || !key.startsWith('fsk-')) {
  console.error('用法: node usage.mjs <fsk-...key> [天数=30] [--json]\n缺少有效的烟花智汇 API Key(fsk- 开头)。')
  process.exit(1)
}

const n = (x) => Number(x || 0)
const fmtTok = (t) => (t >= 1e6 ? (t / 1e6).toFixed(2) + 'M' : t >= 1e3 ? (t / 1e3).toFixed(1) + 'K' : String(t))
const yuan = (c) => '¥' + n(c).toFixed(n(c) < 1 ? 4 : 2)
const pad = (s, w) => { s = String(s); return s + ' '.repeat(Math.max(0, w - [...s].reduce((a, ch) => a + (ch.charCodeAt(0) > 255 ? 2 : 1), 0))) }

const r = await fetch(`${BASE}/usage?days=${days}`, { headers: { authorization: `Bearer ${key}` } }).catch((e) => {
  console.error('请求失败:', e.message); process.exit(2)
})
if (!r.ok) {
  const body = await r.text().catch(() => '')
  console.error(`烟花智汇返回 ${r.status}: ${body.slice(0, 300)}`)
  process.exit(2)
}
const d = await r.json()
if (json) { console.log(JSON.stringify(d, null, 2)); process.exit(0) }

const t = d.totals || {}
const lines = []
lines.push(`## 🎆 烟花智汇 用量账单 · ${d.key?.masked || key.slice(0, 8) + '…'}`)
lines.push(`> 统计区间:近 **${d.range?.days ?? days}** 天 · 费用单位 **${d.currency || 'CNY'}(¥)** · 数据源:平台服务端计费(权威)`)
lines.push('')
lines.push('### 总览')
lines.push(`- 调用次数:**${n(t.calls)}** 次`)
lines.push(`- Token:输入 **${fmtTok(n(t.promptTokens))}** · 输出 **${fmtTok(n(t.completionTokens))}**` +
  (n(t.cachedTokens) ? ` · 命中缓存 **${fmtTok(n(t.cachedTokens))}**` : '') + ` · 合计 **${fmtTok(n(t.totalTokens))}**`)
lines.push(`- 费用合计:**${yuan(t.cost)}**`)
lines.push('')

const bm = d.byModel || []
if (bm.length) {
  lines.push('### 按模型(按费用降序)')
  lines.push('| 模型 | 调用 | 输入 | 输出 | 总Token | 费用 |')
  lines.push('|---|--:|--:|--:|--:|--:|')
  for (const m of bm) {
    lines.push(`| ${m.model} | ${n(m.calls)} | ${fmtTok(n(m.promptTokens))} | ${fmtTok(n(m.completionTokens))} | ${fmtTok(n(m.totalTokens))} | ${yuan(m.cost)} |`)
  }
  lines.push('')
}

const dl = (d.daily || []).filter((x) => n(x.calls) > 0)
if (dl.length) {
  const max = Math.max(...dl.map((x) => n(x.cost)), 0.0001)
  lines.push('### 按天趋势(费用)')
  lines.push('```')
  for (const x of dl) {
    const bar = '█'.repeat(Math.max(1, Math.round((n(x.cost) / max) * 24)))
    lines.push(`${x.day}  ${pad(yuan(x.cost), 9)} ${pad(fmtTok(n(x.tokens)) + 'tok', 8)} ${bar}`)
  }
  lines.push('```')
}
lines.push('')
lines.push('> 费用为烟花智汇按你的套餐/分组计费的实际金额(已含缓存折价、分组倍率)。如需明细按调用查看,用 `/me/usages`(需登录控制台)。')
console.log(lines.join('\n'))
