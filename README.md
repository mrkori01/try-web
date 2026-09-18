# AppVault — sell your software, deliver with a key

A Next.js website where you manage and sell your applications. Each buyer gets a
unique **license key** (e.g. `WXYZ-2345-KLMN-PQRS`) that unlocks the download on the
public download page. You (the admin) upload the real app files and generate keys
manually — no payment gateway required.

## How it works

```
You (admin)                                    Your customer
─────────────                                  ─────────────
1. Upload app + set price           ──►        sees it in the store
2. Customer pays you directly       ◄──        (WhatsApp / email / etc.)
3. Generate a license key for them  ──►        receives the key
4. (optional) revoke / limit keys              enters key on /download
                                               and gets the file instantly
```

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Open **`/admin`** and log in. The default password is **`admin123`** — change it
before going live (see below).

## Pages

| Route       | Purpose                                                        |
| ----------- | -------------------------------------------------------------- |
| `/`         | Storefront — catalog of apps, prices, "how to buy" section      |
| `/download` | Customer page — enter license key, validate, download file     |
| `/admin`    | Dashboard — manage apps, generate/revoke keys, store settings  |

## Admin features

- **Applications** — name, description, version, price, emoji icon, tile color,
  and the actual app file upload (any type: `.zip`, `.exe`, `.apk`, `.dmg`, …).
  Upload a new file any time to "ship an update".
- **License keys** — generate unique keys per customer, with optional customer
  name/email, **max downloads**, and **expiry date**. Keys can be **revoked**,
  re-activated, or deleted. Click any key to copy it.
- **Stats** — apps, active keys, total downloads, storage used.
- **Settings** — store name, tagline, currency symbol (default ₹), and the
  contact text buyers see for purchasing a key.
- Deleting an app removes its file and all of its keys.

## Configuration

Copy `.env.example` to `.env.local` and set:

```bash
ADMIN_PASSWORD=your-strong-password   # without this, password is "admin123"
ADMIN_SECRET=long-random-string       # signs the admin session cookie
```

Restart the server after changing env vars. Admin sessions last 7 days.

## Data storage (no external DB needed)

Everything lives in a git-ignored `data/` folder next to the app:

- `data/db.json` — apps, keys, settings, download log
- `data/uploads/<appId>/` — the uploaded app files (served only via valid keys)

To wipe everything and start fresh: `rm -rf data/`.

> For production at scale, swap `src/lib/db.ts` for a real database (SQLite /
> Postgres) and move uploads to object storage such as S3 — the rest of the app
> stays the same.

## Tech

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Node 18.18+

```bash
npm run build && npm start   # production
```
