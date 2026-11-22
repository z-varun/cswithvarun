#!/usr/bin/env node
// Regenerates every brand image from the current palette (assets/css/palette.css)
// and monogram (_includes/logo.html), using headless Chrome:
//   assets/images/logo.svg, favicon-32.png, apple-touch-icon.png, logo-512.png
//   assets/images/og-default.png        site-wide share image
//   assets/images/og/<slug>.png         one per published post in _posts/
// Run after changing the palette, or after adding or retitling a post:
//   node scripts/generate-brand-assets.mjs
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

// --- Palette and monogram -------------------------------------------------
const palette = readFileSync(join(ROOT, 'assets/css/palette.css'), 'utf8');
const block = (selector) => {
  const start = palette.indexOf(selector);
  return palette.slice(start, palette.indexOf('}', start));
};
const token = (css, name) => {
  const m = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!m) throw new Error(`${name} not found in palette.css`);
  return m[1];
};
const light = block(':root {');
const dark = block("[data-theme='dark'] {");
// Share cards use the light palette: sage page, dark text, accent highlights.
const C = {
  accentLight: token(light, '--color-primary'),
  accentDark: token(light, '--color-primary'),
  ink: token(light, '--bg-primary'),
  paper: token(light, '--text-primary'),
  muted: token(light, '--text-secondary'),
  fill: (light.match(/--accent-fill:\s*(#[0-9a-fA-F]{3,8})/) || [])[1] || token(light, '--color-primary'),
  onFill: token(light, '--on-accent'),
};
const glyph = (readFileSync(join(ROOT, '_includes/logo.html'), 'utf8').match(/<g class="logo-mark-glyph"[^>]*>([\s\S]*?)<\/g>/) || [])[1];
if (!glyph) throw new Error('Monogram paths not found in _includes/logo.html');

const logoSvg = (radius) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>Varun Bhandari</title><rect width="64" height="64" rx="${radius}" fill="${C.fill}"/><g fill="none" stroke="${C.onFill}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${glyph}</g></svg>`;

// --- Rendering ------------------------------------------------------------
const work = mkdtempSync(join(tmpdir(), 'brand-'));
const rel = (p) => p.replace(ROOT + '/', '');
function shoot(html, width, height, out, transparent = false) {
  const page = join(work, 'page.html');
  writeFileSync(page, html);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
    `--user-data-dir=${join(work, 'profile')}`, '--force-device-scale-factor=1',
    ...(transparent ? ['--default-background-color=00000000'] : []),
    `--window-size=${width},${height}`, `--screenshot=${out}`, `file://${page}`], { stdio: 'ignore' });
  console.log('wrote', rel(out));
}
function icon(svg, size, out) {
  writeFileSync(join(work, 'icon.svg'), svg);
  shoot(`<!doctype html><body style="margin:0;background:transparent"><img src="icon.svg" width="${size}" height="${size}" style="display:block">`, size, size, out, true);
}

const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plex = join(ROOT, 'assets/fonts/geist-latin-wght-normal.woff2');
function card({ kicker, title, footer }) {
  const size = title.length > 70 ? 58 : title.length > 45 ? 66 : 76;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Geist;font-weight:100 900;src:url('file://${plex}') format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:${C.ink};color:${C.paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;position:relative;overflow:hidden}
.wrap{position:absolute;inset:0;padding:72px 88px;display:flex;flex-direction:column;justify-content:space-between}
.brand{display:flex;align-items:center;gap:18px;font:600 32px Geist,sans-serif;letter-spacing:-0.02em}
.brand svg{width:56px;height:56px}
.kicker{display:inline-block;color:${C.onFill};background:${C.fill};font-size:24px;font-weight:600;padding:6px 18px;border-radius:999px;margin-bottom:24px}
h1{font:600 ${size}px/1.05 Geist,sans-serif;letter-spacing:-0.04em;max-width:1020px}
.foot{display:flex;justify-content:space-between;font-size:28px;color:${C.muted}}
.url{color:${C.accentDark};font-weight:600}
.bar{display:none}
</style></head><body><div class="wrap">
<div class="brand">${logoSvg(14).replace(/<title>.*?<\/title>/, '')}Varun Bhandari</div>
<div><p class="kicker">${escape(kicker)}</p><h1>${escape(title)}</h1></div>
<div class="foot"><div>${escape(footer)}</div><div class="url">cswithvarun.com</div></div>
</div><div class="bar"></div></body></html>`;
}

try {
  const img = (f) => join(ROOT, 'assets/images', f);
  writeFileSync(img('logo.svg'), logoSvg(14) + '\n');
  console.log('wrote', rel(img('logo.svg')));
  icon(logoSvg(14), 32, img('favicon-32.png'));
  icon(logoSvg(0), 180, img('apple-touch-icon.png'));
  icon(logoSvg(14), 512, img('logo-512.png'));

  shoot(card({ kicker: 'DevSecOps · Cloud security', title: 'Security engineering that keeps pace with delivery', footer: 'Senior Security Engineer at Crypto.com' }),
    1200, 630, img('og-default.png'));

  mkdirSync(img('og'), { recursive: true });
  for (const file of readdirSync(join(ROOT, '_posts')).filter((f) => /^\d{4}-\d{2}-\d{2}-.+\.(md|markdown|html)$/.test(f))) {
    const src = readFileSync(join(ROOT, '_posts', file), 'utf8');
    const fm = (src.match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
    const field = (k) => { const m = fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm')); return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''; };
    if (field('published') === 'false' || field('external_url')) continue;
    const [, y, mo, d, slug] = file.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.\w+$/);
    const date = new Date(`${y}-${mo}-${d}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    shoot(card({ kicker: 'Blog', title: field('title') || slug, footer: date }), 1200, 630, img(`og/${slug}.png`));
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
