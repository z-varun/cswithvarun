---
layout: post
title: "How a Dangling DNS Record Led to a Google Search Console Takeover"
date: 2026-08-08
categories: [Security, DNS, DevOps]
tags: [DNS Takeover, Dangling DNS, GitHub Pages, Cloudflare Pages, Google Search Console]
description: "How an abandoned GitHub Pages DNS record allowed an attacker to serve content from my domain and verify ownership in Google Search Console."
---

It started with two automated emails from Google Search Console.

The first was a security alert: an unknown email address, `celanaaming@gmail.com`, had successfully verified themselves as an owner of my domain, `cswithvarun.com`.

The second reported that Googlebot was receiving a `404` while trying to access:

```text
https://cswithvarun.com/google8403cdd115b351b5.html
```

That immediately looked suspicious.

My first thought was a compromised GitHub repository, CI/CD pipeline, or Cloudflare account. I checked the GitHub repository and found no suspicious commits or deployments. Cloudflare audit logs also showed no unauthorized activity.

So how had someone managed to serve a file from my domain?

The answer was a **dangling DNS record**.

## TL;DR

I migrated my Jekyll website from GitHub Pages to Cloudflare Pages but forgot to remove legacy GitHub Pages A records from my apex domain.

An attacker discovered the dangling DNS configuration, claimed `cswithvarun.com` through their own GitHub Pages repository, and gained the ability to serve content from my domain.

They then uploaded a Google Search Console verification file and successfully verified themselves as an owner of `https://cswithvarun.com/`.

I removed the dangling DNS records, revoked the unauthorized Search Console ownership, and configured the apex domain to redirect safely to my Cloudflare Pages deployment.

The attack chain was:

```text
Dangling DNS
     ↓
Attacker claims GitHub Pages domain
     ↓
Attacker controls HTTP content
     ↓
GSC verification file
     ↓
Unauthorized Search Console ownership
```

The key lesson: migrating an application isn't enough. When decommissioning infrastructure, you also need to remove the DNS records and external service relationships associated with the old deployment.

## What Happened

My website is a Jekyll site hosted on Cloudflare Pages.

Previously, it was hosted on GitHub Pages.

During the migration, I updated the DNS configuration for my active `www` hostname but forgot to remove the old GitHub Pages A records for the apex domain.

My Cloudflare DNS still contained:

```text
185.199.108.153
185.199.109.153
185.199.110.153
```

These are GitHub Pages IP addresses.

At the time, I didn't think much of those records because the website itself had already been moved to Cloudflare Pages. The problem was that the DNS records were still pointing `cswithvarun.com` toward GitHub Pages infrastructure, even though I was no longer using or claiming the domain there.

That left a dangling DNS configuration.

## How the Attacker Used It

I don't know exactly how the attacker found the configuration. Most likely it was automated scanning, since dangling DNS and service takeover conditions are relatively easy to identify.

What I do know is that they created their own GitHub repository and configured:

```text
cswithvarun.com
```

as the repository's custom domain.

DNS did not directly point my domain to their repository. Instead, the DNS records pointed the domain to GitHub's infrastructure, and GitHub's Pages routing layer associated the hostname with the attacker's Pages site.

That gave the attacker the ability to serve content from:

```text
https://cswithvarun.com/
```

without having access to my GitHub or Cloudflare accounts.

### The Google Search Console Part

The attacker then uploaded a Google Search Console verification file to their repository:

```text
google8403cdd115b351b5.html
```

They used that file to verify ownership of:

```text
https://cswithvarun.com/
```

The verification request effectively looked like:

```text
Google
   ↓
cswithvarun.com
   ↓
GitHub Pages
   ↓
Attacker's repository
   ↓
Google verification file
```

Google could retrieve the verification file through my domain, so the attacker was able to establish ownership of the URL-prefix property in Search Console.

This was the part that initially made me think that one of my actual accounts had been compromised. In reality, none of them had.

### The Second Alert

The two Search Console emails turned out to be related.

After the ownership verification, the custom domain was removed from the attacker's repository. The verification file disappeared with it.

Googlebot then tried to access:

```text
https://cswithvarun.com/google8403cdd115b351b5.html
```

and received a `404`.

That generated the second Search Console alert.

So the sequence was:

```text
Domain claimed
      ↓
GSC verification file uploaded
      ↓
Search Console ownership obtained
      ↓
Custom domain removed
      ↓
Verification file disappears
      ↓
Googlebot receives 404
```

I can't say with certainty what the attacker's final objective was. One possibility is black-hat SEO, where an established domain is abused for spam pages, malicious content, or search-engine manipulation.

## How I Found the Root Cause

Once I confirmed that my GitHub repository and Cloudflare account hadn't been compromised, I started looking at the DNS configuration.

That's when I noticed the old GitHub Pages records.

A quick lookup confirmed them:

```bash
dig cswithvarun.com A
```

The records were still pointing to GitHub Pages.

At that point the rest of the incident made sense.

I had migrated the site, but I hadn't completely removed the old infrastructure relationship.

## How I Fixed It

### 1. Removed the Old DNS Records

I deleted the legacy GitHub Pages A records from Cloudflare DNS.

This broke the connection between my domain and GitHub Pages.

### 2. Removed the Unauthorized Search Console Owner

I added the affected URL-prefix property to my own Search Console account:

```text
https://cswithvarun.com/
```

I then went to **Settings → Users and permissions** and removed the unauthorized owner.

I also verified that the attacker's HTML verification file was no longer accessible through the domain.

### 3. Redirected the Apex Domain

My actual site is hosted at:

```text
https://www.cswithvarun.com/
```

I wanted the apex domain to redirect there:

```text
https://cswithvarun.com/
          ↓
        301
          ↓
https://www.cswithvarun.com/
```

I configured a Cloudflare Redirect Rule to handle this at the edge.

For the apex hostname, I used a proxied DNS record pointing to `192.0.2.1`, which is from the TEST-NET-1 documentation range. The address isn't being used as a real origin; it allows Cloudflare to receive the request and apply the redirect.

Finally, I verified the result:

```bash
curl -I https://cswithvarun.com
```

which returned:

```text
HTTP/2 301
location: https://www.cswithvarun.com/
```

## What I Learned

The interesting part of this incident is that there was no sophisticated exploit.

I didn't have a compromised GitHub account.

Cloudflare wasn't compromised.

There were no suspicious CI/CD deployments.

The attacker found an old DNS record that I had forgotten to remove.

I had successfully migrated the application from GitHub Pages to Cloudflare Pages, but I hadn't completely decommissioned the old infrastructure.

That is the part I got wrong.

When migrating or decommissioning infrastructure, DNS cleanup needs to be part of the process. An unused DNS record pointing to an external service isn't just technical debt.

**It can become an attack surface.**
