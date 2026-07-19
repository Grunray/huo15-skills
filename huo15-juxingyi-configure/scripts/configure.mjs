#!/usr/bin/env node
/**
 * configure.mjs — 聚星逸(Juxingyi) OpenClaw 配置脚本
 *
 * 动态从 /v1/models 端点拉取最新可用模型列表，自动分类并写入
 * ~/.openclaw/openclaw.json 的 models.providers.fireworks-hub 段。
 *
 * 用法:
 *   node configure.mjs <fsk-key>                    # 配置 provider，默认 DeepSeek-V4-Flash
 *   node configure.mjs <fsk-key> --list             # 列出所有可用模型（动态获取）
 *   node configure.mjs <fsk-key> --json             # 输出 JSON 配置片段（不写文件）
 *   node configure.mjs --switch <model-id>          # 切换主模型
 *   node configure.mjs --show                       # 查看当前聚星逸配置
 *   node configure.mjs <fsk-key> --env              # 用环境变量引用存储密钥
 *   node configure.mjs --help                        # 显示帮助
 *   node configure.mjs --version                     # 显示版本号
 *   node configure.mjs --selftest                    # 运行内置自检（不联网）
 *
 * 零依赖，仅需 Node 18+（自带 fetch）。
 * 青岛火一五信息科技有限公司
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs'
import { homedir } from 'os'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OPENCLAW_JSON = join(homedir(), '.openclaw', 'openclaw.json')
const HEURISTICS_PATH = join(__dirname, '..', 'data', 'model-heuristics.json')
const META_PATH = join(__dirname, '..', '_meta.json')

// ============================================================
// Node 版本检查（需要 18+ 的原生 fetch）
// ============================================================
const NODE_MAJOR = parseInt(process.versions.node.split('.')[0], 10)
if (NODE_MAJOR < 18) {
  console.error(`\u274c 需要 Node.js 18+（当前 ${process.versions.node}）。\n   Node 18+ 自带 fetch API，请升级: https://nodejs.org/`)
  process.exit(1)
}

// ============================================================
// 参数解析
// ============================================================
const args = process.argv.slice(2)
const flags = {
  list: args.includes('--list'),
  json: args.includes('--json'),
  show: args.includes('--show'),
  env: args.includes('--env'),
  help: args.includes('--help') || args.includes('-h'),
  version: args.includes('--version') || args.includes('-v'),
  selftest: args.includes('--selftest'),
}
const switchIdx = args.indexOf('--switch')
const switchModel = switchIdx >= 0 ? args[switchIdx + 1] : null
const keyArg = args.find(a => a.startsWith('fsk-'))

// ============================================================
// 加载启发式数据
// ============================================================
const H = JSON.parse(readFileSync(HEURISTICS_PATH, 'utf8'))
const BASE_URL = H.baseUrl
const PROVIDER = H.providerName
const DEFAULT_MODEL = H.defaultModel

// ============================================================
// 工具函数
// ============================================================
function classifyModel(id) {
  // 1) 检查 skipPatterns（生图/视频模型，不配文本对话）
  const skipRe = new RegExp(H.skipPatterns.join('|'), 'i')
  if (skipRe.test(id)) return null

  // 2) 已知模型直接返回
  if (H.knownModels[id]) return H.knownModels[id]

  // 3) 模式匹配分类
  const tier = guessTier(id)
  return { ...H.defaults, tier, _inferred: true }
}

function guessTier(id) {
  for (const [tier, patterns] of Object.entries(H.tierPatterns)) {
    if (patterns.some(p => new RegExp(p, 'i').test(id))) return tier
  }
  return H.defaults.tier
}

function tierWeight(tier) {
  return { flash: 0, pro: 1, reasoner: 2 }[tier] ?? 1
}

function fmtModelName(id) {
  return id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// 模型 ID 解析：精确 → 大小写不敏感 → 前缀匹配（唯一则用，歧义则报错）
function resolveModelId(input, modelIds) {
  if (modelIds.includes(input)) return input
  const lower = input.toLowerCase()
  const ci = modelIds.find(m => m.toLowerCase() === lower)
  if (ci) return ci
  // 前缀匹配（大小写不敏感），仅当唯一时才采用
  const prefixMatches = modelIds.filter(m => m.toLowerCase().startsWith(lower))
  if (prefixMatches.length === 1) return prefixMatches[0]
  if (prefixMatches.length > 1) {
    console.error(`\u26a0\ufe0f  "${input}" 匹配到多个模型，请更精确地指定:`)
    for (const m of prefixMatches) console.error(`     ${m}`)
    process.exit(1)
  }
  return null
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

// ============================================================
// 从 API 动态获取模型列表
// ============================================================
async function fetchModels(apiKey) {
  const url = `${BASE_URL}/models`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  let resp
  try {
    resp = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: ctrl.signal,
    })
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error(`请求超时（15s）: ${url}\n   请检查网络或稍后重试。`)
    }
    throw new Error(`网络请求失败: ${e.message}\n   请检查网络连接或 Base URL 是否可达。`)
  } finally {
    clearTimeout(timer)
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    let hint = ''
    if (resp.status === 401) hint = '\n   提示: 密钥无效或已过期，请到聚星逸控制台确认。'
    else if (resp.status === 403) hint = '\n   提示: 密钥权限不足。'
    else if (resp.status >= 500) hint = '\n   提示: 聚星逸服务端异常，请稍后重试。'
    throw new Error(`API 返回 ${resp.status}: ${body.slice(0, 200)}${hint}`)
  }
  const data = await resp.json()
  const models = data.data || data.models || []
  if (!Array.isArray(models) || models.length === 0) {
    throw new Error('API 返回的模型列表为空。\n   请检查密钥权限或联系聚星逸支持。')
  }
  return models
}

// ============================================================
// 生成 provider 配置
// ============================================================
function buildProviderConfig(apiKey, rawModels) {
  const textModels = []
  for (const m of rawModels) {
    const id = m.id
    const meta = classifyModel(id)
    if (!meta) continue // 跳过生图/视频
    textModels.push({
      id,
      name: `${fmtModelName(id)} (聚星逸)`,
      reasoning: meta.reasoning,
      contextWindow: meta.contextWindow,
      maxTokens: meta.maxTokens,
      input: ['text'],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    })
  }

  // 按 tier 权重排序：flash → pro → reasoner
  textModels.sort((a, b) => {
    const ta = guessTier(a.id)
    const tb = guessTier(b.id)
    if (ta !== tb) return tierWeight(ta) - tierWeight(tb)
    return a.id.localeCompare(b.id)
  })

  const apiKeyField = flags.env
    ? { source: 'env', provider: 'default', id: H.envVarName }
    : apiKey

  return {
    baseUrl: BASE_URL,
    apiKey: apiKeyField,
    api: 'openai-completions',
    models: textModels,
  }
}

// ============================================================
// 生成 agents.defaults 配置（primary + fallbacks + aliases）
// ============================================================
function buildAgentsDefaults(textModels, primaryId) {
  const prefixed = textModels.map(m => `${PROVIDER}/${m.id}`)
  const primary = `${PROVIDER}/${primaryId}`
  const fallbacks = prefixed.filter(p => p !== primary)

  const models = {}
  for (const m of textModels) {
    models[`${PROVIDER}/${m.id}`] = { alias: m.name }
  }

  return { primary, fallbacks, models }
}

// ============================================================
// 读取/写入 openclaw.json
// ============================================================
function readOpenclawJson() {
  if (!existsSync(OPENCLAW_JSON)) {
    throw new Error(`未找到 ${OPENCLAW_JSON}\n请先运行 openclaw 初始化。`)
  }
  return JSON.parse(readFileSync(OPENCLAW_JSON, 'utf8'))
}

function backupOpenclawJson() {
  const bakPath = `${OPENCLAW_JSON}.bak.${timestamp()}`
  copyFileSync(OPENCLAW_JSON, bakPath)
  return bakPath
}

function writeOpenclawJson(config) {
  const bak = backupOpenclawJson()
  writeFileSync(OPENCLAW_JSON, JSON.stringify(config, null, 2) + '\n', 'utf8')
  return bak
}

// ============================================================
// 主逻辑
// ============================================================
async function main() {
  // --- help / version / selftest（不联网、不读写配置）---
  if (flags.help) return cmdHelp()
  if (flags.version) return cmdVersion()
  if (flags.selftest) return cmdSelftest()

  // --- show 模式 ---
  if (flags.show) {
    return cmdShow()
  }

  // --- switch 模式 ---
  if (switchModel) {
    return cmdSwitch(switchModel)
  }

  // --- 以下模式需要 API key ---
  if (!keyArg) {
    console.error(
      '用法: node configure.mjs <fsk-key> [--list|--json|--env]\n' +
      '      node configure.mjs --switch <model-id>\n' +
      '      node configure.mjs --show | --help | --version | --selftest\n\n' +
      '缺少聚星逸 API Key（fsk- 开头）。'
    )
    process.exit(1)
  }

  // 校验密钥格式（fsk- 后应有内容）
  if (keyArg.length <= 4) {
    console.error('❌ 聚星逸 API Key 格式错误: fsk- 后应有密钥内容。')
    process.exit(1)
  }

  // 动态获取模型
  const rawModels = await fetchModels(keyArg)
  const providerConfig = buildProviderConfig(keyArg, rawModels)
  const textModels = providerConfig.models
  const agentsCfg = buildAgentsDefaults(textModels, DEFAULT_MODEL)

  // --- list 模式 ---
  if (flags.list) {
    return cmdList(textModels, rawModels)
  }

  // --- json 模式 ---
  if (flags.json) {
    return cmdJson(providerConfig, agentsCfg)
  }

  // --- 默认: 配置 openclaw.json ---
  return cmdConfigure(providerConfig, agentsCfg)
}

// ============================================================
// 子命令实现
// ============================================================

function cmdList(textModels, rawModels) {
  console.log(`\n🛰️  聚星逸 · 可用模型列表（动态获取）`)
  console.log(`   共 ${rawModels.length} 个模型，其中 ${textModels.length} 个文本对话模型\n`)

  const tiers = { flash: [], pro: [], reasoner: [] }
  for (const m of textModels) {
    const tier = guessTier(m.id)
    if (!tiers[tier]) tiers[tier] = []
    tiers[tier].push(m)
  }

  const tierLabels = { flash: '⚡ Flash（快速）', pro: '🚀 Pro（主力）', reasoner: '🧠 Reasoner（深度推理）' }
  for (const [tier, models] of Object.entries(tiers)) {
    if (!models.length) continue
    console.log(tierLabels[tier] || `📌 ${tier}`)
    for (const m of models) {
      const tag = m.id === DEFAULT_MODEL ? ' ← 默认' : ''
      const ctxK = (m.contextWindow / 1024).toFixed(0)
      console.log(`  ${m.id.padEnd(28)} ${ctxK.padStart(6)}K ctx  ${m.reasoning ? '推理' : '    '}  ${m.name}${tag}`)
    }
    console.log()
  }

  const skipped = rawModels.filter(m => !textModels.find(t => t.id === m.id))
  if (skipped.length) {
    console.log('🎬 生图/视频模型（不配置文本对话）')
    for (const m of skipped) {
      console.log(`  ${m.id.padEnd(28)} ${m.owned_by || ''}`)
    }
  }
}

function cmdJson(providerConfig, agentsCfg) {
  const snippet = {
    models: { providers: { [PROVIDER]: providerConfig } },
    agents: {
      defaults: {
        model: { primary: agentsCfg.primary, fallbacks: agentsCfg.fallbacks },
        models: agentsCfg.models,
      },
    },
  }
  console.log(JSON.stringify(snippet, null, 2))
}

function cmdConfigure(providerConfig, agentsCfg) {
  const config = readOpenclawJson()

  // 合并 provider
  if (!config.models) config.models = {}
  if (!config.models.providers) config.models.providers = {}
  if (!config.models.mode) config.models.mode = 'replace'
  config.models.providers[PROVIDER] = providerConfig

  // 合并 agents.defaults
  if (!config.agents) config.agents = {}
  if (!config.agents.defaults) config.agents.defaults = {}
  config.agents.defaults.model = {
    primary: agentsCfg.primary,
    fallbacks: agentsCfg.fallbacks,
  }
  // 合并 model aliases（保留已有的非 fireworks-hub 条目）
  const existingModels = config.agents.defaults.models || {}
  // 清理旧的 fireworks-hub 条目
  for (const key of Object.keys(existingModels)) {
    if (key.startsWith(`${PROVIDER}/`)) delete existingModels[key]
  }
  // 合并新条目
  for (const [key, val] of Object.entries(agentsCfg.models)) {
    existingModels[key] = val
  }
  config.agents.defaults.models = existingModels

  const bak = writeOpenclawJson(config)

  // 输出结果
  console.log(`\n✅ 聚星逸配置完成！`)
  console.log(`   备份: ${bak}`)
  console.log(`   模型数: ${providerConfig.models.length} 个文本对话模型`)
  console.log(`   主模型: ${agentsCfg.primary}`)
  console.log(`   备选链: ${agentsCfg.fallbacks.length} 个模型`)
  console.log(`   密钥存储: ${flags.env ? `环境变量 ${H.envVarName}` : '直接写入（明文）'}\n`)

  console.log('   主模型 & 备选链:')
  console.log(`   ★ ${agentsCfg.primary}`)
  for (const f of agentsCfg.fallbacks) {
    console.log(`     ${f}`)
  }
  console.log()

  if (flags.env) {
    console.log(`⚠️  请确保环境变量 ${H.envVarName} 已设置:`)
    console.log(`   export ${H.envVarName}=fsk-你的密钥`)
    console.log()
  }

  console.log('重启 OpenClaw 后生效。')
}

function cmdSwitch(modelId) {
  const config = readOpenclawJson()
  const providers = config.models?.providers || {}
  const prov = providers[PROVIDER]

  if (!prov) {
    console.error(`未找到 ${PROVIDER} provider，请先运行配置: node configure.mjs <fsk-key>`)
    process.exit(1)
  }

  const modelIds = (prov.models || []).map(m => m.id)
  const fullId = resolveModelId(modelId, modelIds)

  if (!fullId) {
    console.error(`模型 "${modelId}" 不在聚星逸可用列表中。`)
    console.error(`可用模型: ${modelIds.join(', ')}`)
    process.exit(1)
  }

  const oldPrimary = config.agents?.defaults?.model?.primary || '(未设置)'
  const newPrimary = `${PROVIDER}/${fullId}`

  if (!config.agents) config.agents = {}
  if (!config.agents.defaults) config.agents.defaults = {}
  if (!config.agents.defaults.model) config.agents.defaults.model = {}

  config.agents.defaults.model.primary = newPrimary

  // 从 fallbacks 中移除新 primary（如果存在）
  const fallbacks = config.agents.defaults.model.fallbacks || []
  config.agents.defaults.model.fallbacks = fallbacks.filter(f => f !== newPrimary)

  // 把旧 primary 加入 fallbacks（如果不在的话）
  if (oldPrimary !== newPrimary && oldPrimary !== '(未设置)' && !fallbacks.includes(oldPrimary)) {
    config.agents.defaults.model.fallbacks.unshift(oldPrimary)
  }

  const bak = writeOpenclawJson(config)

  console.log(`\n✅ 主模型已切换`)
  console.log(`   备份: ${bak}`)
  console.log(`   旧主: ${oldPrimary}`)
  console.log(`   新主: ${newPrimary}`)
  console.log(`   备选: ${config.agents.defaults.model.fallbacks.length} 个模型\n`)
  console.log('重启 OpenClaw 后生效。')
}

function cmdShow() {
  const config = readOpenclawJson()
  const prov = config.models?.providers?.[PROVIDER]

  if (!prov) {
    console.log(`\n❌ 尚未配置聚星逸 (${PROVIDER})。`)
    console.log(`   运行: node configure.mjs <fsk-key>\n`)
    return
  }

  const primary = config.agents?.defaults?.model?.primary || '(未设置)'
  const fallbacks = config.agents?.defaults?.model?.fallbacks || []

  console.log(`\n🛰️  聚星逸当前配置`)
  console.log(`   Provider: ${PROVIDER}`)
  console.log(`   Base URL: ${prov.baseUrl}`)
  console.log(`   API 类型: ${prov.api}`)
  const keyDisplay = typeof prov.apiKey === 'string'
    ? `直接密钥 (${prov.apiKey.slice(0, 8)}…)`
    : `环境变量 ${prov.apiKey?.id || '?'}`
  console.log(`   密钥方式: ${keyDisplay}`)
  console.log(`   文本模型: ${(prov.models || []).length} 个`)
  console.log(`   主模型:   ${primary}`)

  if (fallbacks.length) {
    console.log(`   备选链:`)
    for (const f of fallbacks) console.log(`     ${f}`)
  }
  console.log()

  // 列出所有已配模型
  if (prov.models?.length) {
    console.log('   已配模型:')
    for (const m of prov.models) {
      const mark = `${PROVIDER}/${m.id}` === primary ? ' ★' : '  '
      console.log(`   ${mark} ${m.id.padEnd(28)} ${(m.contextWindow / 1024).toFixed(0).padStart(6)}K  ${m.reasoning ? '推理' : '    '}`)
    }
  }
  console.log()
}

// ============================================================
// 子命令: help / version / selftest
// ============================================================
function cmdHelp() {
  const meta = JSON.parse(readFileSync(META_PATH, 'utf8'))
  console.log(`
聚星逸配置 · huo15-juxingyi-configure v${meta.version}

用法:
  node configure.mjs <fsk-key>              配置 provider + 全部模型（默认 DeepSeek-V4-Flash）
  node configure.mjs <fsk-key> --list       动态获取并列出所有可用模型
  node configure.mjs <fsk-key> --json       输出 JSON 配置片段（不写文件）
  node configure.mjs <fsk-key> --env        用环境变量引用存储密钥（更安全）
  node configure.mjs --switch <model-id>    切换主模型（支持前缀匹配）
  node configure.mjs --show                 查看当前聚星逸配置
  node configure.mjs --help | -h            显示本帮助
  node configure.mjs --version | -v         显示版本号
  node configure.mjs --selftest             运行内置自检（不联网，不读写配置）

环境变量:
  ${H.envVarName}                 --env 模式下从此环境变量读取密钥

更多信息: https://cnb.cool/huo15/ai/huo15-skills
`)
}

function cmdVersion() {
  const meta = JSON.parse(readFileSync(META_PATH, 'utf8'))
  console.log(`huo15-juxingyi-configure v${meta.version}`)
}

function cmdSelftest() {
  let pass = 0, fail = 0
  const ok = (name, cond, detail = '') => {
    if (cond) { pass++; console.log(`  \u2713 ${name}`) }
    else { fail++; console.log(`  \u2717 ${name} ${detail}`) }
  }

  console.log('\n\ud83e\uddea 内置自检（不联网）\n')

  // 1. 启发式数据加载
  ok('model-heuristics.json 已加载', !!H.knownModels)
  ok('knownModels 非空', Object.keys(H.knownModels).length > 0)
  ok('skipPatterns 是数组', Array.isArray(H.skipPatterns) && H.skipPatterns.length > 0)
  ok('tierPatterns 三档齐全', ['flash', 'pro', 'reasoner'].every(t => H.tierPatterns[t]))

  // 2. classifyModel 分类
  ok('生图模型被跳过 (Image)', classifyModel('Foo-Image-Bar') === null)
  ok('视频模型被跳过 (T2V)', classifyModel('Foo-T2V-Bar') === null)
  ok('已知模型返回精确参数', H.knownModels['DeepSeek-V4-Flash']?.tier === 'flash')
  ok('未知模型走推断', classifyModel('SomeModel-Pro')?.tier === 'pro')

  // 3. tier 推断
  ok('guessTier Flash → flash', guessTier('X-Flash') === 'flash')
  ok('guessTier Turbo → flash', guessTier('X-Turbo') === 'flash')
  ok('guessTier R1 → reasoner', guessTier('X-R1') === 'reasoner')
  ok('guessTier Pro → pro', guessTier('X-Pro') === 'pro')
  ok('guessTier MiniMax 不误判为 flash', guessTier('MiniMax-M99') !== 'flash')

  // 4. 模型名格式化
  ok('fmtModelName 美化', fmtModelName('deepseek-v4-flash') === 'Deepseek V4 Flash')

  // 5. resolveModelId 解析
  ok('resolveModelId 精确匹配', resolveModelId('DeepSeek-V4-Flash', ['DeepSeek-V4-Flash', 'GPT-5.5']) === 'DeepSeek-V4-Flash')
  ok('resolveModelId 大小写不敏感', resolveModelId('deepseek-v4-flash', ['DeepSeek-V4-Flash']) === 'DeepSeek-V4-Flash')
  ok('resolveModelId 前缀唯一匹配', resolveModelId('gpt', ['GPT-5.5', 'DeepSeek-V4-Flash']) === 'GPT-5.5')
  ok('resolveModelId 无匹配返回 null', resolveModelId('NotExist', ['DeepSeek-V4-Flash']) === null)

  // 6. tierWeight 排序权重
  ok('tierWeight flash<pro<reasoner', tierWeight('flash') < tierWeight('pro') && tierWeight('pro') < tierWeight('reasoner'))

  console.log(`\n  结果: ${pass} 通过, ${fail} 失败\n`)
  if (fail > 0) process.exit(1)
}

// ============================================================
main().catch(err => {
  console.error(`\n❌ ${err.message}\n`)
  process.exit(1)
})
