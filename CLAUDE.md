# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Static website for `saranvisa.cloud`: a single page showing live clocks for New York, India, Germany, and Australia (Sydney). Plain HTML/CSS/JS with no build step, package manager, framework, linter, or tests. Files are served as-is by an Nginx Docker container on a Hostinger VPS (see Deployment). `.htaccess` is a leftover from an Apache setup and is not used in production.

## Local preview

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

This does not apply the production Nginx config, so CSP headers, HTTPS redirects, and the custom 404 are only exercised on the VPS.

## Architecture

- `index.html` — markup for the clock cards. Each card is wired to `script.js` via `data-clock`, `data-date`, and `data-zone-abbreviation` attributes whose value matches an `id` in the `clocks` array.
- `script.js` — builds `Intl.DateTimeFormat` formatters per IANA time zone once, then updates all cards on a self-rescheduling `setTimeout` aligned to the start of each second. India's abbreviation is hardcoded to `IST` because `Intl` returns `GMT+5:30`; other zones get their abbreviation (EST/EDT, CET/CEST) from `formatToParts`. Also fills `#current-year` in the footer.
- `style.css` — theme colors are CSS custom properties on `:root`, overridden in a `prefers-color-scheme: dark` block. Layout goes from a 2-column grid to 1 column below 760px.
- `404.html` — shares `style.css`, served through Nginx `error_page 404`.

To add a city: add an entry to `clocks` in `script.js` **and** a matching `<article class="clock-card">` in `index.html` (and adjust `.clock-grid` columns if needed; it is currently 2 columns holding 4 cards).

## Deployment

Hosted on a Hostinger VPS (`2.25.251.102`) as a Docker Compose project in `/docker/saranvisa-site/` (`docker-compose.yml`, `nginx.conf`), running the `nginx:alpine` container `saranvisa-site-website-1` on ports 80/443. TLS certs come from Let's Encrypt (`/etc/letsencrypt`, ACME webroot `/var/www/certbot`).

- The container bind-mounts only four files read-only from this directory: `index.html`, `style.css`, `script.js`, `404.html`. Editing them here makes the change live; if it doesn't show, run `docker restart saranvisa-site-website-1`.
- A **new file** (image, extra CSS/JS, another page) is not served until it is added to the `volumes:` list in `/docker/saranvisa-site/docker-compose.yml` and the container is recreated (`docker compose up -d` in that directory).
- After editing `nginx.conf`: `docker exec saranvisa-site-website-1 nginx -s reload`.
- Verify: `curl -sI https://saranvisa.cloud`.

## Cache busting

CSS/JS are cached for 30 days. References carry a version query string (`style.css?v=1`, `script.js?v=1` in `index.html`; `/style.css?v=1` in `404.html`). **When changing `style.css` or `script.js`, bump `v` in both HTML files** so returning visitors get the new file.

## Constraints from `nginx.conf` (mirrors the old `.htaccess`)

- The Content-Security-Policy (set in `nginx.conf`) is `'self'` only for scripts, styles, and images (plus `data:` images). **No inline `<script>`/`<style>`, `style=""` attributes, event-handler attributes, or third-party CDNs/fonts** — they will be blocked in production. Put all code in `script.js`/`style.css` (or new same-origin files).
- CSS/JS are cached for 30 days (see Cache busting).
- Dotfiles are denied except `/.well-known/` (ACME).
- HTTP and `www.` are 301-redirected to `https://saranvisa.cloud`.
- Security headers (HSTS, nosniff, X-Frame-Options, etc.) are repeated inside the CSS/JS `location` block because `add_header` there overrides server-level ones.
