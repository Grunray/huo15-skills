// huo15-markdown-export — markdown 渲染核心
// 所有脚本(md2pdf / md2html / md2image / md2wechat)共用此模块,保证渲染一致

const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const anchor = require('markdown-it-anchor');
const attrs = require('markdown-it-attrs');
const emoji = require('markdown-it-emoji').full;
const footnote = require('markdown-it-footnote');
const taskLists = require('markdown-it-task-lists');
const { mark } = require('@mdit/plugin-mark');
const { sub } = require('@mdit/plugin-sub');
const { sup } = require('@mdit/plugin-sup');
const { katex } = require('@mdit/plugin-katex');
const hljs = require('highlight.js');
const katexLib = require('katex');

const THEMES_DIR = path.resolve(__dirname, '..', '..', 'themes');
const TEMPLATES_DIR = path.resolve(__dirname, '..', '..', 'templates');

const AVAILABLE_THEMES = [
  'typora-newsprint',
  'typora-night',
  'github',
  'academic',
  'wechat',
  'xiaohongshu',
  'huo15-brand',
];

function buildMd(opts = {}) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    breaks: false,
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const out = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
          return `<pre class="hljs"><code class="language-${lang}">${out}</code></pre>`;
        } catch (_) {}
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    },
  });

  md.use(anchor, { permalink: anchor.permalink.headerLink({ safariReaderFix: true }) })
    .use(attrs)
    .use(emoji)
    .use(footnote)
    .use(taskLists, { enabled: true })
    .use(mark)
    .use(sub)
    .use(sup)
    .use(katex, { katex: katexLib });

  // mermaid 占位:把 ```mermaid 块原样保留 div,前端有 mermaid.js 时再激活
  const fence = md.renderer.rules.fence.bind(md.renderer.rules);
  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const tok = tokens[idx];
    if (tok.info && tok.info.trim() === 'mermaid') {
      return `<div class="mermaid">${md.utils.escapeHtml(tok.content)}</div>\n`;
    }
    return fence(tokens, idx, options, env, slf);
  };

  return md;
}

function readTheme(name) {
  const safe = AVAILABLE_THEMES.includes(name) ? name : 'typora-newsprint';
  const file = path.join(THEMES_DIR, `${safe}.css`);
  return fs.readFileSync(file, 'utf8');
}

function readPrintCss() {
  return fs.readFileSync(path.join(TEMPLATES_DIR, 'pdf-print.css'), 'utf8');
}

function readKatexCss() {
  // 内嵌 KaTeX 样式 — 从 node_modules 取,导出时离线可用
  const katexCss = require.resolve('katex/dist/katex.min.css');
  return fs.readFileSync(katexCss, 'utf8');
}

function readHljsCss(style = 'github') {
  // highlight.js 自带样式表
  const cssPath = require.resolve(`highlight.js/styles/${style}.css`);
  return fs.readFileSync(cssPath, 'utf8');
}

// 从 markdown 抽取首段非空文本作为 OG description 兜底
function extractFirstParagraph(markdown, maxLen = 150) {
  const md = buildMd();
  const tokens = md.parse(markdown, {});
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'inline' && tokens[i].content && tokens[i].content.trim()) {
      const text = tokens[i].content
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')   // 去图片
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // 链接保留文字
        .replace(/[*_`~#>]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length >= 10) return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
    }
  }
  return '';
}

// 从 markdown 抽取首个 H1 作为 title 兜底
function extractFirstH1(markdown) {
  const m = markdown.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

function buildHtml({
  markdown,
  theme = 'typora-newsprint',
  title = 'Document',
  includePrint = false,
  includeMermaid = true,
  hljsStyle,
  // OG / Twitter card meta(默认从 markdown 抽,显式传入覆盖)
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogSiteName = '青岛火一五信息科技',
}) {
  const md = buildMd();
  const body = md.render(markdown);
  const themeCss = readTheme(theme);
  const printCss = includePrint ? readPrintCss() : '';
  const katexCss = readKatexCss();
  const codeStyle = hljsStyle || (theme === 'typora-night' ? 'github-dark' : 'github');
  const hljsCss = readHljsCss(codeStyle);
  const mermaidScript = includeMermaid
    ? `<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
mermaid.initialize({ startOnLoad: true, securityLevel: 'loose' });
</script>`
    : '';

  // OG meta:用户没传就从 markdown 抽
  const ogT = ogTitle || extractFirstH1(markdown) || title;
  const ogD = ogDescription || extractFirstParagraph(markdown);
  const ogTags = [
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${escapeHtml(ogT)}">`,
    ogD ? `<meta property="og:description" content="${escapeHtml(ogD)}">` : '',
    ogUrl ? `<meta property="og:url" content="${escapeHtml(ogUrl)}">` : '',
    ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : '',
    `<meta property="og:site_name" content="${escapeHtml(ogSiteName)}">`,
    `<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${escapeHtml(ogT)}">`,
    ogD ? `<meta name="twitter:description" content="${escapeHtml(ogD)}">` : '',
    ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}">` : '',
  ].filter(Boolean).join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="generator" content="huo15-markdown-export">
${ogTags}
<style>
${katexCss}
${hljsCss}
${themeCss}
${printCss}
</style>
</head>
<body class="theme-${theme}">
<article class="markdown-body">
${body}
</article>
${mermaidScript}
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// QR code SVG dataURL — 给 puppeteer footerTemplate 用
async function buildQrSvgDataUrl(url, opts = {}) {
  const QRCode = require('qrcode');
  const svg = await QRCode.toString(url, {
    type: 'svg',
    width: opts.width || 60,
    margin: opts.margin ?? 0,
    errorCorrectionLevel: opts.ecl || 'M',
    color: { dark: '#000000', light: '#ffffff' },
  });
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

module.exports = {
  buildMd,
  buildHtml,
  readTheme,
  readPrintCss,
  buildQrSvgDataUrl,
  extractFirstParagraph,
  extractFirstH1,
  escapeHtml,
  AVAILABLE_THEMES,
  THEMES_DIR,
  TEMPLATES_DIR,
};
