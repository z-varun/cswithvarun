# cswithvarun.com

Personal site and blog of Varun Bhandari: a static [Jekyll](https://jekyllrb.com/) site hosted on Cloudflare Pages.

## Stack

- **Jekyll 4.4** on Ruby 3.2 (`.ruby-version`), with `jekyll-feed`, `jekyll-seo-tag` and `jekyll-sitemap`.
- **Fonts and icons:** self-hosted. Geist (all text) and JetBrains Mono (code) live in `assets/fonts/`
  (SIL OFL, licences alongside). Icons are inline SVGs in `_data/icons.yml`: Lucide outline icons (ISC) plus
  Font Awesome Free brand logos (CC BY 4.0), rendered with `{% include icon.html name="rocket" %}`.
  No third-party CSS, fonts or scripts.
- **CSS:** hand-written, no preprocessor. `assets/css/main.css` concatenates the shared partials
  (`variables.css`, `theme.css`, `components.css`, `animations.css`) at build time; each page adds its own
  stylesheet through `custom_css` in its front matter. All colour values live in `palette.css` (light and dark); `theme.css` derives the rest.
- **JavaScript:** vanilla, no bundler. `theme-init.js` runs in `<head>`; `utils.js` must load before the others.
  Pages add their own script through `custom_js` in front matter.
- **Hosting:** Cloudflare Pages. Response headers (including the CSP) live in `_headers`, short links in `_redirects`.
  The apex-to-www redirect is a Cloudflare Redirect Rule, not part of this repo.
- **Contact form:** [Web3Forms](https://web3forms.com/), plain HTML POST.
- **Search:** [Pagefind](https://pagefind.app/) (pinned in `package.json`) indexes the built site; see Search below.

## Local development

```bash
bundle install
bundle exec jekyll serve --livereload
```

The site is then at <http://localhost:4000>. Drafts live in `_drafts/`; preview them with `--drafts`.

`jekyll serve` doesn't build the search index, so blog search says it's unavailable there. To try search
locally, build the whole thing and serve `_site` with any static server:

```bash
npm install
npm run build                      # jekyll build, then Pagefind indexes _site
python3 -m http.server -d _site 4001
```

## Writing posts

Create `_posts/YYYY-MM-DD-slug.md`:

```yaml
---
title: "Post title"
date: 2026-01-31 09:00:00 +0530
tags: [Kubernetes, DevSecOps]
excerpt: "One or two sentences for the blog index, feed and search results."
---
```

The layout adds the title, so don't start the body with a `#` heading.

Posts with three or more `##` sections get a table of contents automatically, headings get shareable `#` links,
and code blocks get a Copy button (`assets/js/post.js`). Use fenced code with a language for highlighting:
` ```bash `, ` ```yaml `, ` ```rego `.

Callouts use GitHub's syntax:

```markdown
> [!WARNING]
> Rotate the credentials before you delete the old record.
```

Supported types: `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`.

### Share images

Each post gets its own Open Graph image from `assets/images/og/<slug>.png` (wired up by `_plugins/og_image.rb`).
After adding or retitling a post, regenerate them locally (needs Chrome) and commit the PNGs. The same script rebuilds the logo and favicons from the palette:

```bash
node scripts/generate-brand-assets.mjs
```

To feature a post on the home page, add its slug to `featured_posts` in `_config.yml`. For a post that lives elsewhere, add
`external_url:` and `platform:` (for example `Medium` or `Substack`); the index links straight to it.

## Colour themes

The palette is one file, `assets/css/palette.css`. Alternative palettes live on `theme/*` branches
(`theme/soft`, `theme/signal-green`, `theme/amber`, `theme/oxblood`, `theme/mono`; `theme/soft` also changes
the font, icon set and shapes) that differ only in that file and the
images generated from it. To switch, merge the branch you want. To try your own, edit `palette.css`, run
`node scripts/generate-brand-assets.mjs` to rebuild the logo, favicons and share images, and check contrast:
text needs 4.5:1 against its background.

### Visitor colour palettes

Mint (`palette.css`) is the default. Visitors can switch to Rose, Sky, Slate, Lavender, Graphite or Mauve (one
`palette-<name>.css` each) with the picker in the footer;
the choice is stored in `localStorage` and applied before first paint by `theme-init.js`. A new palette is another
`:root[data-palette='name']` block (plus a `:root[data-palette='name'][data-theme='dark']` block) using the same tokens, a
button in `_includes/footer.html`, its name in `PALETTES` in `theme-toggle.js` and in the check in `theme-init.js`,
and an `include_relative` line in `main.css`. Favicons and share images stay
mint.

## Search

Search lives on the Blog page. After `jekyll build`, Pagefind reads `_site` and writes a static index to
`_site/pagefind/`; the browser downloads only the small parts of it a query needs. There is no server and no
third-party service.

- Cloudflare Pages build command: `bundle exec jekyll build && node_modules/.bin/pagefind --site _site`
  (Pages installs `package.json` dependencies first).
- Only posts are indexed: `_layouts/post.html` marks the article with `data-pagefind-body`, and the meta line,
  tag list and footer with `data-pagefind-ignore`. Posts hosted elsewhere (`external_url`) aren't on this site,
  so they aren't searchable.
- Searches are shareable: `/blog/?q=kubernetes`. Press `/` to jump to the search box.
- The CSP allows `'wasm-unsafe-eval'` because Pagefind runs a small WebAssembly module. It does not permit
  `eval()` or inline scripts.

## security.txt

`/.well-known/security.txt` is served by Cloudflare's Security Center feature on both the apex and `www` (the apex
redirect rule exempts that path), not from this repo. Renew its `Expires` there before 21 November 2027 (keep it under a year ahead).

## Content security policy

`_headers` allows no inline scripts, inline styles or `style=""` attributes, and no third-party scripts except
Cloudflare Web Analytics. Put styles in a stylesheet and behaviour in a `.js` file under `assets/js/`; setting
`element.style` from JavaScript is fine.

## Analytics

Cookie-free Cloudflare Web Analytics is allowed by the CSP but switched on in the dashboard, not in code:
Cloudflare dashboard → Workers & Pages → this project → Metrics → Web Analytics → Enable. No token goes in the repo.
