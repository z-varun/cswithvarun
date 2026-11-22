# cswithvarun.com

Personal site and blog of Varun Bhandari: a static [Jekyll](https://jekyllrb.com/) site hosted on Cloudflare Pages.

## Stack

- **Jekyll 4.4** on Ruby 3.2 (`.ruby-version`), with `jekyll-feed`, `jekyll-seo-tag` and `jekyll-sitemap`.
- **Fonts and icons:** self-hosted. IBM Plex Sans (headings) and JetBrains Mono (code) live in `assets/fonts/`
  (SIL OFL, licences alongside). Icons are inline SVGs from Font Awesome Free 6.4.0 (CC BY 4.0) stored in
  `_data/icons.yml` and rendered with `{% include icon.html name="rocket" %}`. No third-party CSS, fonts or scripts.
- **CSS:** hand-written, no preprocessor. `assets/css/main.css` concatenates the shared partials
  (`variables.css`, `theme.css`, `components.css`, `animations.css`) at build time; each page adds its own
  stylesheet through `custom_css` in its front matter. All colour values live in `palette.css` (light and dark); `theme.css` derives the rest.
- **JavaScript:** vanilla, no bundler. `theme-init.js` runs in `<head>`; `utils.js` must load before the others.
  Pages add their own script through `custom_js` in front matter.
- **Hosting:** Cloudflare Pages. Response headers (including the CSP) live in `_headers`, short links in `_redirects`.
  The apex-to-www redirect is a Cloudflare Redirect Rule, not part of this repo.
- **Contact form:** [Web3Forms](https://web3forms.com/), plain HTML POST.

## Local development

```bash
bundle install
bundle exec jekyll serve --livereload
```

The site is then at <http://localhost:4000>. Drafts live in `_drafts/`; preview them with `--drafts`.

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
(`theme/signal-green`, `theme/amber`, `theme/oxblood`, `theme/mono`) that differ only in that file and the
images generated from it. To switch, merge the branch you want. To try your own, edit `palette.css`, run
`node scripts/generate-brand-assets.mjs` to rebuild the logo, favicons and share images, and check contrast:
text needs 4.5:1 against its background.

## Content security policy

`_headers` allows no inline scripts, inline styles or `style=""` attributes, and no third-party scripts except
Cloudflare Web Analytics. Put styles in a stylesheet and behaviour in a `.js` file under `assets/js/`; setting
`element.style` from JavaScript is fine.

## Analytics

Cookie-free Cloudflare Web Analytics is allowed by the CSP but switched on in the dashboard, not in code:
Cloudflare dashboard → Workers & Pages → this project → Metrics → Web Analytics → Enable. No token goes in the repo.
