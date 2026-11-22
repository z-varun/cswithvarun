---
layout: post
title: "Retiring a Domain Without Leaving It Dangling"
date: 2026-11-22 11:00:00 +0530
tags: [Dangling DNS, DNS, GitHub Pages, Cloudflare, DevSecOps]
description: "I retired my old portfolio site and almost repeated my own dangling-DNS incident. The safe order for shutting down a site, and the checklist I use now."
---

A few months ago, a forgotten DNS record let an attacker serve content from my domain and verify themselves as its owner in Google Search Console. I wrote about it in [How a Dangling DNS Record Led to a Google Search Console Takeover](/blog/2026/08/08/dangling-dns-attack/).

Recently I retired my old portfolio site, `varunbhandari.in`, and for a few minutes I recreated exactly the same condition.

Nothing bad happened. But the reason nothing happened was luck and speed, not process. This post is about the process: the order of operations that makes retiring a site safe, and why the intuitive order is the dangerous one.

## TL;DR

When you shut down a site hosted on a shared platform (GitHub Pages, Netlify, Heroku, S3 and so on), **change DNS before you remove the hosting, never after.**

```text
Wrong:  remove hosting  →  DNS still points at the platform  →  anyone can claim the name
Right:  move DNS away   →  verify                            →  remove hosting
```

I did it in the wrong order, noticed within minutes, and fixed it. The safe sequence and a checklist are at the end.

## The Setup

`varunbhandari.in` was a single-page portfolio I hadn't updated since late 2025. Everything on it had moved to `cswithvarun.com`, so the plan was simple: retire the site and redirect the domain to my About page.

A domain has three separate layers, and this one was spread across three providers:

```text
Registrar        Hostinger            who owns the name
     ↓
DNS              Cloudflare           where the name points
     ↓
Hosting          GitHub Pages         what actually serves the pages
```

The `www` record was a plain CNAME:

```text
www.varunbhandari.in   CNAME   z-varun.github.io
```

That CNAME doesn't point at *my* site. It points at GitHub's shared Pages infrastructure. GitHub decides which repository serves `www.varunbhandari.in` based on which repository has claimed that name as its custom domain.

That detail is the whole story.

## What I Did Wrong

Retiring the site felt like a hosting task, so I started with the hosting: I unpublished GitHub Pages for the portfolio repository.

The hosting was switched off. The DNS record was not.

```text
www.varunbhandari.in
        ↓  CNAME (still there)
GitHub Pages
        ↓
No repository claims this name any more
        ↓
Anyone who adds it as a custom domain gets it
```

This is the same dangling condition that caused my Search Console incident. Any GitHub user could have created a repository, set `www.varunbhandari.in` as its custom domain, and started serving content under my name.

For a few minutes afterwards the old site still loaded for me, presumably while GitHub's change took effect. That makes the problem easy to miss: you check, the site still works, and you assume nothing has changed yet.

I noticed within minutes and deleted the `www` record, which closed the window. Then I set up the redirect properly.

A few minutes is probably too short for anyone to notice. But "probably" is not a security control, and automated scanners exist precisely to find these windows.

## The Safe Order

Here is the sequence I should have followed, and the one I'll use from now on.

### 1. Put the Redirect in Front First

The goal is to move the name away from the shared platform *before* the platform forgets about you. On Cloudflare, that means replacing the CNAME with a proxied placeholder record and a redirect rule.

The placeholder records:

```text
varunbhandari.in       A   192.0.2.1   (proxied)
www.varunbhandari.in   A   192.0.2.1   (proxied)
```

`192.0.2.1` is from TEST-NET-1, a range reserved for documentation by RFC 5737. It is never a real server. The records are proxied and the redirect rule below answers every request at Cloudflare's edge, so nothing is ever sent to that address. The record only exists so Cloudflare answers for the name.

Then a Redirect Rule (Rules → Redirect Rules) that matches both hostnames:

```text
When:   (http.host in {"varunbhandari.in" "www.varunbhandari.in"})
Then:   Static redirect, 301, to https://www.cswithvarun.com/about/
```

The moment the CNAME is replaced, `www.varunbhandari.in` no longer points at GitHub. Whatever happens to the GitHub Pages site afterwards is irrelevant to the domain.

### 2. Verify From Outside

Don't trust the dashboard. Check what the internet sees:

```bash
dig +short www.varunbhandari.in CNAME     # should print nothing
curl -sI https://www.varunbhandari.in/projects | grep -iE "^HTTP|^location"
curl -sI http://varunbhandari.in/ | grep -iE "^HTTP|^location"
```

What I wanted to see, for both hostnames, on any path, was a 301 straight to the new page. Over HTTPS:

```text
HTTP/2 301
location: https://www.cswithvarun.com/about/
```

and over plain HTTP:

```text
HTTP/1.1 301 Moved Permanently
Location: https://www.cswithvarun.com/about/
```

And no CNAME to `github.io` from any public resolver. I checked `1.1.1.1` and `8.8.8.8` as well as Cloudflare's own nameservers.

### 3. Only Now, Remove the Hosting

With DNS pointing somewhere else, unpublishing GitHub Pages is just cleanup. There's no window, because there's no longer a DNS record that depends on GitHub's routing.

It's also worth archiving the repository, so it's obvious to future you that it is no longer deployed anywhere.

### 4. Clean Up What the Migration Left Behind

Looking at the zone properly turned up two more things:

- **Stale NS records** from a previous DNS provider, left over from before the domain moved to Cloudflare. They did nothing, because delegation happens at the registrar, but they were confusing and worth deleting.
- **Minimum TLS version.** A redirect-only domain still terminates TLS, so I set it to TLS 1.2, matching my main site.

I also had a second unused domain, `varunbhandari.com`, parked with no records at all. Parked with no records is harmless, but a domain that returns an error looks abandoned. I gave it the same treatment: proxied placeholders and a 301 to the same page.

### 5. Keep the Domain Itself

Retiring a site is not the same as retiring a domain.

There is a registrar-level version of the same problem. If `varunbhandari.in` lapses, anyone can register it and put up a site under my name, with no dangling record required. For someone who works in security, an impersonation site is a real reputational risk.

So the domain stays registered, renewed and redirecting. Personal-name domains are cheap to keep and expensive to lose.

## An Extra Layer: GitHub Verified Domains

GitHub lets you [verify a domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages) for your account or organization, using a TXT record. It's in your account settings, not the repository's: Settings → Pages → Add a domain. Once a domain is verified, only your own repositories can publish a Pages site to it or to its immediate subdomains.

GitHub's documentation describes exactly my mistake: takeovers can happen after any change that "disables GitHub Pages while the domain remains configured for GitHub Pages and is not verified".

That wouldn't replace the correct order of operations, but it turns a mistake like mine from "exploitable" into "harmless". If you use GitHub Pages with a custom domain, it's worth doing.

## The Checklist

This is the checklist I'll follow from now on:

```text
[ ] List every DNS record that points at the platform (CNAME, A, AAAA, ALIAS)
[ ] Replace them with the new destination or a proxied placeholder + redirect
[ ] Verify from outside: dig shows no record pointing at the platform
[ ] Verify from outside: every hostname and scheme returns the expected 301
[ ] Remove the hosting (unpublish, delete the bucket, delete the app)
[ ] Archive the source repository
[ ] Delete leftovers: stale NS, TXT verification records, unused subdomains
[ ] Keep the domain registered, with auto-renew on
```

## What I Learned

The mistake wasn't a lack of knowledge. I had literally written a post about this exact attack.

The mistake was thinking about the task as "shut down the website" instead of "change what this name points to". Hosting feels like the thing you're retiring, so it feels natural to start there. But the name is what an attacker can take, and the name lives in DNS.

**Change DNS first. Remove hosting last.**
