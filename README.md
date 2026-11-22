# cswithvarun.com

Personal site and blog of Varun Bhandari: a static [Jekyll](https://jekyllrb.com/) site hosted on Cloudflare Pages.

## Stack

- **Jekyll 4.4** on Ruby 3.2 (`.ruby-version`), with `jekyll-feed`, `jekyll-seo-tag` and `jekyll-sitemap`.
- **CSS:** hand-written, no preprocessor. `assets/css/main.css` concatenates the shared partials
  (`variables.css`, `theme.css`, `components.css`, `animations.css`) at build time; each page adds its own
  stylesheet through `custom_css` in its front matter. All colours are tokens in `theme.css`, with light and dark values.
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

The layout adds the title, so don't start the body with a `#` heading. For a post that lives elsewhere, add
`external_url:` and `platform:` (for example `Medium` or `Substack`); the index links straight to it.

## Content security policy

`_headers` allows no inline scripts, inline styles or `style=""` attributes. Put styles in a stylesheet and
behaviour in a `.js` file under `assets/js/`; setting `element.style` from JavaScript is fine.
