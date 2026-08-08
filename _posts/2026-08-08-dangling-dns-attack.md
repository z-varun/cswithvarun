---
layout: post
title: "How a Dangling DNS Record Led to a Google Search Console Takeover"
date: 2026-08-08
categories: [Security, DNS, DevOps]
tags: [DNS Takeover, Dangling DNS, GitHub Pages, Cloudflare Pages, Google Search Console]
excerpt: "How an abandoned GitHub Pages DNS record allowed an attacker to serve content from my domain and verify ownership in Google Search Console."
---


# How a Dangling DNS Record Led to a Google Search Console Takeover

It started with two automated emails from Google Search Console.

The first was a security alert: an unknown email address, `celanaaming@gmail.com`, had successfully verified themselves as an owner of my domain, `cswithvarun.com`.

The second reported that Googlebot was getting a `404` while trying to access this unusual URL:

```text
https://cswithvarun.com/google8403cdd115b351b5.html
```

That immediately looked suspicious.

My first thought was a compromised GitHub repository, CI/CD pipeline, or Cloudflare account. I checked the GitHub repository and found no suspicious commits or deployments. Cloudflare audit logs also showed no unauthorized account activity or DNS changes.

So how had someone managed to serve a file from my domain?

The answer was a **dangling DNS record**.

---
## TL;DR

I migrated my Jekyll website from GitHub Pages to Cloudflare Pages but forgot to remove legacy GitHub Pages A records from my apex domain.

An attacker discovered the dangling DNS configuration, claimed `cswithvarun.com` on their own GitHub Pages repository, and gained the ability to serve content from my domain.

They then uploaded a Google Search Console verification file to their repository and successfully verified themselves as an owner of `https://cswithvarun.com/`.

I detected the incident through Google Search Console alerts, removed the dangling DNS records, revoked the unauthorized Search Console ownership, and configured the apex domain to redirect safely to my Cloudflare Pages deployment.

**The key lesson:** migrating an application isn't enough. When decommissioning infrastructure, you also need to remove the DNS records and external service relationships associated with the old deployment.

```text
Migration mistake
      ↓
Old GitHub Pages DNS records
      ↓
Dangling DNS configuration
      ↓
Attacker claims GitHub Pages domain
      ↓
Attacker controls HTTP content
      ↓
Google Search Console verification
      ↓
Unauthorized domain ownership
```

---

## The Root Cause

My website is a Jekyll site hosted on **Cloudflare Pages**.

Previously, however, it was hosted on GitHub Pages.

When I migrated to Cloudflare Pages, I updated the DNS configuration for my active `www` hostname. What I forgot to do was completely remove the old GitHub Pages A records for the apex domain.

My Cloudflare DNS configuration still contained legacy GitHub Pages addresses:

```text
185.199.108.153
185.199.109.153
185.199.110.153
```

These are GitHub Pages IP addresses.

The problem wasn't the IP addresses themselves. The problem was that my domain was still pointing to GitHub Pages infrastructure even though I was no longer actively using or claiming the domain there.

This created a dangling DNS configuration:

```text
cswithvarun.com
       |
       v
GitHub Pages infrastructure
       |
       X
No longer claimed by me
```

A dangling DNS record can become a security issue when an external service allows another user to claim the resource associated with that hostname.

That's exactly what happened.

---

## The Attack

The attack required no access to my GitHub, Cloudflare, or Google accounts.

### 1. Domain Discovery

The attacker — or an automated scanner — identified that `cswithvarun.com` was still pointing to GitHub Pages infrastructure.

The important observation was that the DNS configuration still existed, while the corresponding GitHub Pages domain was no longer actively claimed by me.

### 2. The Attacker Claimed the Domain

The attacker created their own GitHub repository and configured:

```text
cswithvarun.com
```

as the repository's custom domain.

Because my DNS records were still pointing the domain toward GitHub Pages, GitHub's Pages routing layer could associate the hostname with the attacker's repository.

This is an important distinction:

**DNS did not directly point to the attacker's repository.**

DNS pointed the domain to GitHub's infrastructure. GitHub then handled the hostname-to-Pages-site association.

The attacker had effectively inserted their own GitHub Pages site into an abandoned trust relationship.

### 3. The Attacker Controlled the Website

Once the custom domain was associated with the attacker's Pages site, they could serve content from:

```text
https://cswithvarun.com/
```

That gave them control over the HTTP response for my domain without compromising my actual accounts.

### 4. Google Search Console Verification

The attacker then created the following file in their repository:

```text
google8403cdd115b351b5.html
```

They used it as a Google Search Console ownership verification file.

The resulting flow looked like this:

```text
Google
   |
   | GET /google8403cdd115b351b5.html
   v
cswithvarun.com
   |
   v
GitHub Pages
   |
   v
Attacker's repository
   |
   v
Verification file
```

Google's crawler could access the expected verification file through my domain.

That was sufficient for the attacker to verify ownership of the URL-prefix property:

```text
https://cswithvarun.com/
```

At this point, the attacker had Google Search Console ownership of my domain.

They still hadn't compromised my Google account or Cloudflare account.

They had abused the dangling DNS configuration to temporarily control the content served from my domain.

---

## The Second Alert

After establishing Search Console ownership, the attacker removed the custom domain from their GitHub repository.

That caused the verification file to disappear.

Googlebot later attempted to access:

```text
https://cswithvarun.com/google8403cdd115b351b5.html
```

and received:

```text
404 Not Found
```

That generated the second Search Console notification.

So the two emails were actually connected:

```text
Attacker claims domain
        ↓
Uploads GSC verification file
        ↓
Verifies domain ownership
        ↓
Removes custom domain
        ↓
Verification file disappears
        ↓
Googlebot receives 404
```

---

## What Was the Attacker Trying to Do?

I can't say with certainty what the attacker's final objective was.

A plausible motivation is **black-hat SEO**.

Search Console ownership could potentially be useful for abusing an established domain's search reputation, submitting spam URLs or sitemaps, or manipulating how search engines interact with the site.

The important point is that the attacker didn't need to compromise the application itself.

They found a way to control the **domain's HTTP content**.

---

# How I Fixed It

Once I identified the root cause, the remediation was straightforward.

## 1. Removed the Dangling DNS Records

I immediately removed the legacy GitHub Pages A records from Cloudflare DNS.

This broke the connection between:

```text
cswithvarun.com
        |
        X
GitHub Pages
```

The attacker could no longer use GitHub Pages to serve content for the domain.

---

## 2. Removed the Unauthorized Search Console Owner

I added the affected URL-prefix property to my own Search Console account:

```text
https://cswithvarun.com/
```

I then went to:

**Settings → Users and permissions**

and removed the unauthorized owner.

I also verified that the attacker's HTML verification file was no longer accessible through the domain, preventing the same verification method from being reused.

---

## 3. Configured the Apex Redirect

My actual website is hosted on Cloudflare Pages at:

```text
https://www.cswithvarun.com/
```

I wanted the apex domain to safely redirect there:

```text
https://cswithvarun.com/
        |
        | 301
        v
https://www.cswithvarun.com/
```

I configured a Cloudflare Redirect Rule to perform the redirect at the edge.

For the apex hostname, I used a proxied DNS record pointing to `192.0.2.1`, an address from the TEST-NET-1 documentation range.

The purpose of the record isn't to provide a real origin. It allows Cloudflare to receive the request and process the redirect at the edge.

I verified the result with:

```bash
curl -I https://cswithvarun.com
```

which returned:

```text
HTTP/2 301
location: https://www.cswithvarun.com/
```

The attack path was now broken.

---

# What I Got Wrong

The biggest lesson for me wasn't about GitHub Pages or Cloudflare.

It was about **decommissioning**.

I successfully migrated the website from GitHub Pages to Cloudflare Pages.

I moved the application.

I moved the deployment.

I updated the active DNS configuration.

But I didn't completely remove the old trust relationship.

In other words:

> **I moved the application, but I didn't fully decommission the old infrastructure.**

The migration wasn't complete.

---

# Key Takeaways

### 1. DNS is part of your security perimeter

A DNS record pointing to an external service creates a relationship between your domain and that service.

When you stop using that service, the DNS record should be removed as part of the decommissioning process.

### 2. Don't forget the old infrastructure

When migrating between:

* GitHub Pages
* Cloudflare Pages
* Netlify
* Vercel
* S3
* Azure Storage
* CDN providers
* Load balancers
* SaaS platforms

don't just move the application.

Review and remove the old DNS records and external integrations as well.

### 3. Verify ownership with services you use

If you actively use GitHub Pages, GitHub provides domain verification mechanisms that help prevent another GitHub user from claiming your domain.

### 4. Treat unexpected Search Console alerts as security signals

The first Google Search Console email was effectively an intrusion-detection signal.

Without it, I might not have noticed the dangling DNS configuration for much longer.

---

# Final Thoughts

This wasn't a sophisticated exploit.

The attacker didn't steal my credentials.

They didn't compromise my GitHub account.

They didn't compromise Cloudflare.

They didn't break into my CI/CD pipeline.

They found an old DNS record.

That was enough.

The attack chain was:

```text
Dangling DNS
     ↓
Attacker claims GitHub Pages domain
     ↓
Attacker controls HTTP content
     ↓
Google verification file
     ↓
Google Search Console ownership
```

The vulnerability wasn't in my application.

It was in the **gap between infrastructure I had stopped using and infrastructure I had forgotten to remove**.

And that's why dangling DNS records should be treated as a security issue — not just an infrastructure cleanup task.
