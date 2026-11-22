---
layout: post
title: "Hardening a Static Site on Cloudflare Pages: What It Actually Took"
date: 2026-11-22 10:00:00 +0530
tags: [Cloudflare, Content Security Policy, HSTS, Web Security, DevSecOps]
description: "A strict CSP with no unsafe-inline, HSTS that covers the redirect, security.txt, DNS hygiene and the account itself: the complete hardening of this site, with the config."
---

A static site has a small attack surface. No database, no login, no server-side code.

Small is not zero. My own [dangling-DNS incident](/blog/2026/08/08/dangling-dns-attack/) happened to a static site, and nothing in that attack touched the site's code at all. It went through DNS and a third-party platform.

So I went through this site, `cswithvarun.com`, layer by layer: the browser, the edge, DNS and the accounts that control all of it. This post is the result: what I changed, the actual configuration, and the parts that weren't obvious.

The site is Jekyll, built and hosted on Cloudflare Pages, with Cloudflare DNS in front.

## 1. A Content Security Policy With No `unsafe-inline`

The CSP is the most valuable header a content site can send. If someone ever manages to inject HTML, through a compromised dependency, a malicious pull request or a bug, a strict CSP decides whether that becomes running script.

Cloudflare Pages reads response headers from a `_headers` file in the build output. Mine starts like this:

```text
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://static.cloudflareinsights.com; style-src 'self'; font-src 'self'; img-src 'self' data: https:; connect-src 'self' https://cloudflareinsights.com; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://api.web3forms.com; upgrade-insecure-requests
```

The important part is what's missing: no `'unsafe-inline'` in `script-src` or `style-src`, and the only third-party script host allowed is Cloudflare's own analytics.

Writing that header takes a minute. Making the site work under it took most of the effort:

- **Every font is self-hosted.** `font-src 'self'` means no web-font CDN.
- **Icons are inline SVG**, generated at build time from a data file, instead of an icon font from a CDN.
- **No inline JavaScript.** Even the tiny script that applies the saved light or dark theme before first paint lives in its own file in `<head>`. The only inline `<script>` blocks left are JSON-LD metadata, which is data and never executes.
- **No `style="..."` attributes.** `style-src 'self'` blocks those too. Anything that used to be an inline width or colour became a CSS class. Setting `element.style` from JavaScript is still allowed, because the CSP restricts markup, not the CSSOM.
- **The contact form posts to one named service**, which `form-action` allows explicitly.

A few directives that are easy to forget:

- `object-src 'none'` shuts off plugins entirely.
- `base-uri 'self'` stops an injected `<base>` tag from redirecting every relative URL.
- `frame-ancestors 'self'` is the modern replacement for `X-Frame-Options` (I send both).

> [!TIP]
> Test under the real policy. While making these changes, I served the built site locally with the same headers as production and ran browser checks against it, failing on any CSP violation in the console. A CSP you only test in production is a CSP you'll eventually loosen in a hurry.

## 2. Adding Search Without Weakening the CSP

The blog's search uses Pagefind, which builds a static index at deploy time and runs a small WebAssembly module in the browser. WebAssembly needs one addition to `script-src`:

```text
'wasm-unsafe-eval'
```

Despite the scary name, this only permits compiling WebAssembly. It does not allow JavaScript `eval()`, `new Function()` or inline scripts. It's a much narrower permission than `'unsafe-eval'`, which I would not add.

The other risk with search is the results themselves. Search excerpts come back as HTML with `<mark>` around the matching words. Dropping that into `innerHTML` would make the search index an injection path. Instead, the excerpt is parsed and only text and `<mark>` are copied across:

```js
const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
doc.body.childNodes.forEach((node) => {
  if (node.nodeName === 'MARK') {
    const mark = document.createElement('mark');
    mark.textContent = node.textContent;
    p.append(mark);
  } else {
    p.append(node.textContent);
  }
});
```

Nothing from the index is ever inserted as markup.

## 3. The Rest of the Headers

```text
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()
  Cross-Origin-Resource-Policy: same-origin
  Cross-Origin-Opener-Policy: same-origin
```

None of these are exotic. `Permissions-Policy` switches off browser features a blog never needs. The two cross-origin policies stop other sites from embedding my resources or keeping a handle on my window.

One exception: images under `/assets/images/` send `Cross-Origin-Resource-Policy: cross-origin`, so feed readers and other sites can display them. In Cloudflare's `_headers` syntax, a `!` line removes a header inherited from the `/*` block before setting the new value:

```text
/assets/images/*
  ! Cross-Origin-Resource-Policy
  Cross-Origin-Resource-Policy: cross-origin
```

## 4. HSTS Where `_headers` Can't Reach

My canonical host is `www.cswithvarun.com`. The bare domain, `cswithvarun.com`, redirects there with a Cloudflare Redirect Rule.

I had HSTS in `_headers`. But when I checked the redirect itself, it had no HSTS header:

```bash
curl -sI https://cswithvarun.com/ | grep -iE "^HTTP|strict-transport"
```

The reason: the redirect happens at Cloudflare's edge. The request never reaches Pages, so the `_headers` file never applies to it. And the bare domain is exactly where most people start typing.

The fix was to enable HSTS at the zone level (SSL/TLS → Edge Certificates → HTTP Strict Transport Security), which applies to every response Cloudflare sends, redirects included:

```text
HTTP/2 301
location: https://www.cswithvarun.com/
strict-transport-security: max-age=63072000; includeSubDomains
```

Two years, including subdomains. I deliberately did **not** enable `preload`. Preloading bakes the domain into browsers' HTTPS-only lists, and the preload list's own guidance says removal can take 6 to 12 weeks to reach most Chrome users, and longer for other browsers. That's a commitment worth making deliberately, not as a side effect of a cleanup.

Alongside HSTS: **Always Use HTTPS** is on, and the **minimum TLS version is 1.2**. TLS 1.0 and 1.1 connections are refused.

## 5. security.txt, From One Place

`/.well-known/security.txt` (RFC 9116) tells researchers how to report a vulnerability. Cloudflare can serve one for you from Security Center, which is what I use.

Two things weren't obvious:

- **The apex redirect got there first.** With the redirect rule matching every path, `cswithvarun.com/.well-known/security.txt` answered with a redirect instead of the file. RFC 9116 permits a redirect, but I wanted both hostnames to serve the file directly, so the rule now excludes that path:

```text
(http.request.full_uri wildcard r"https://cswithvarun.com/*")
  and not (http.request.uri.path eq "/.well-known/security.txt")
```

- **Two sources is one too many.** I already had a `security.txt` in the repository, which the site had been serving on `www`. Once Cloudflare's version was switched on, it took precedence. The repository file silently stopped being the one visitors got, and its contents no longer matched what was live. I deleted the repo copy so there is one source of truth.

The file has an `Expires` field, and RFC 9116 recommends keeping it less than a year ahead. That means a yearly calendar reminder.

## 6. Bot Fight Mode vs a Strict CSP

On Cloudflare's free plan, Bot Fight Mode automatically turns on JavaScript Detections, which injects a small inline script into every HTML page. My CSP has no `'unsafe-inline'`, so the browser blocked that script, and every page logged a CSP error in the console.

Cloudflare's documented answer is a nonce-based CSP: if your policy uses nonces, Cloudflare adds the nonce to the scripts it injects. A static `_headers` file can't produce a fresh nonce for each request, so on this site the choice was between the bot script and the strict CSP.

For a site with no logins, no checkout and no forms I process myself, bot challenges protect very little, and DDoS protection applies to proxied traffic regardless. I turned Bot Fight Mode off. The console errors disappeared.

That's a trade-off, not a universal recommendation. On a site with a login page, I'd keep bot protection and move to a nonce-based CSP instead.

## 7. DNS Hygiene

DNS is where my real incident happened, so it got the most scrutiny:

- **Every record has a reason to exist.** I deleted leftover NS records from a previous DNS provider, and two old mail-autoconfiguration records I no longer needed. Any record that points at someone else's infrastructure is a potential dangling record later.
- **No records point at platforms I've left.** That was the root cause of my takeover, and it's the first thing I check after any migration.
- **Email authentication.** SPF and DKIM are in place. DMARC is at `p=none` with aggregate reports, so I can confirm that only my mail provider sends as my domain before moving to `p=quarantine`. Jumping straight to an enforcing policy without the reports is how legitimate mail goes missing.

## 8. The Account That Controls Everything

All of the above can be undone by anyone who gets into the Cloudflare account. That account can repoint DNS, issue certificates and redirect email.

- **MFA is on.** If you do one thing from this post, do this one.
- **API tokens are short-lived and IP-restricted.** I made the zone changes in this post through Cloudflare's API, with tokens that only work from my IP address and expire after a week. Give a token only the permissions the job needs, too: a broad token that leaks is as good as the account password.

## 9. A Caching Gotcha

This one isn't security, but it's easy to trip over.

Images could stay in Cloudflare's edge cache for up to a day. After I redesigned the site's share image, the edge was still serving a copy it had cached more than seven hours earlier, long after the new image was deployed. Anyone sharing a link in that time would have got the previous design.

Now images and downloadable files are cached in browsers for a day but at the edge for only five minutes, using Cloudflare's own header. I timed it: cache hits up to 274 seconds, then a revalidation at 306.

```text
/assets/images/*
  Cache-Control: public, max-age=86400, must-revalidate
  Cloudflare-CDN-Cache-Control: max-age=300
```

CSS and JavaScript have a version in their URLs, so they can safely be cached for a year.

## The Checklist

```text
Browser
[ ] CSP without 'unsafe-inline'; test it locally under the real headers
[ ] object-src 'none', base-uri 'self', frame-ancestors set
[ ] nosniff, Referrer-Policy, Permissions-Policy, COOP/CORP

Edge
[ ] HSTS at the zone level, so redirects carry it too (preload only on purpose)
[ ] Always Use HTTPS, minimum TLS 1.2
[ ] security.txt from one source, reachable on every hostname, Expires < 1 year

DNS
[ ] No records pointing at platforms you've left
[ ] Leftover records from old providers deleted
[ ] DMARC with reports, then tightened

Accounts
[ ] MFA on the DNS provider and registrar
[ ] API tokens least-privilege, IP-restricted and expiring
```

## What I Learned

The headers were the easy part. The work was in the gaps between systems: a redirect that never reaches the host that sets the headers, a `security.txt` that existed in two places, a bot-protection feature fighting the CSP, an edge cache holding on to old content.

Each layer looked fine on its own. The problems only showed up when I checked what a real request actually received.

**Check from the outside, not from the dashboard.**
