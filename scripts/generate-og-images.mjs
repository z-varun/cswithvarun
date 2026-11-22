#!/usr/bin/env node
// Generates social share images (1200x630) with headless Chrome:
//   assets/images/og-default.png       site-wide default
//   assets/images/og/<slug>.png        one per published post in _posts/
// Run after adding or renaming a post:  node scripts/generate-og-images.mjs
// Set CHROME=/path/to/chrome if Chrome isn't in the default macOS location.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}. Set CHROME=/path/to/chrome.`);
  process.exit(1);
}

const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const logo = readFileSync(join(ROOT, 'assets/images/logo.svg'), 'utf8').replace(/<title>.*?<\/title>/, '');
const plex = join(ROOT, 'assets/fonts/ibm-plex-sans-latin-700-normal.woff2');

function card({ kicker, title, footer }) {
  const size = title.length > 70 ? 58 : title.length > 45 ? 66 : 76;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Plex;font-weight:700;src:url('file://${plex}') format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#0a0e27;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;position:relative;overflow:hidden}
.glow{position:absolute;width:760px;height:760px;right:-260px;top:-300px;background:radial-gradient(circle,rgba(0,217,255,.18),transparent 65%)}
.wrap{position:absolute;inset:0;padding:72px 88px;display:flex;flex-direction:column;justify-content:space-between}
.brand{display:flex;align-items:center;gap:18px;font:700 32px Plex,sans-serif}
.brand svg{width:56px;height:56px}
.kicker{color:#00d9ff;font-size:24px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;margin-bottom:20px}
h1{font:700 ${size}px/1.1 Plex,sans-serif;letter-spacing:-1px;max-width:1020px}
.foot{display:flex;justify-content:space-between;font-size:28px;color:#cbd5e1}
.url{color:#00d9ff;font-weight:600}
.bar{position:absolute;left:0;right:0;bottom:0;height:10px;background:#00d9ff}
</style></head><body><div class="glow"></div><div class="wrap">
<div class="brand">${logo}Varun Bhandari</div>
<div><p class="kicker">${escape(kicker)}</p><h1>${escape(title)}</h1></div>
<div class="foot"><div>${escape(footer)}</div><div class="url">cswithvarun.com</div></div>
</div><div class="bar"></div></body></html>`;
}

const work = mkdtempSync(join(tmpdir(), 'og-'));
function render(html, out) {
  const page = join(work, 'card.html');
  writeFileSync(page, html);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
    `--user-data-dir=${join(work, 'profile')}`, '--force-device-scale-factor=1',
    '--window-size=1200,630', `--screenshot=${out}`, `file://${page}`], { stdio: 'ignore' });
  console.log('wrote', out.replace(ROOT + '/', ''));
}

try {
  render(card({ kicker: 'Security engineering', title: 'Engineering Security at the Speed of Innovation', footer: 'Senior Security Engineer · DevSecOps · Cloud Security' }),
    join(ROOT, 'assets/images/og-default.png'));

  mkdirSync(join(ROOT, 'assets/images/og'), { recursive: true });
  for (const file of readdirSync(join(ROOT, '_posts')).filter((f) => /^\d{4}-\d{2}-\d{2}-.+\.(md|markdown|html)$/.test(f))) {
    const src = readFileSync(join(ROOT, '_posts', file), 'utf8');
    const fm = (src.match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
    const field = (k) => { const m = fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm')); return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''; };
    if (field('published') === 'false' || field('external_url')) continue;
    const [, y, mo, d, slug] = file.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.\w+$/);
    const date = new Date(`${y}-${mo}-${d}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    render(card({ kicker: 'Blog', title: field('title') || slug, footer: date }), join(ROOT, 'assets/images/og', `${slug}.png`));
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
