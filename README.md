# AppVault — sell your apps, unlock with a key

A Next.js website where you manage and sell your applications. Each buyer gets a
unique **license key** (e.g. `WXYZ-2345-KLMN-PQRS`) that **unlocks access to the
application** — they don't download files from you; they open and use the app with
their key.

## How it works

```
You (admin)                                     Your customer
─────────────                                   ─────────────
1. Add an app (web app or hidden link)  ──►     sees it in the store
2. Customer pays you directly           ◄──     (WhatsApp / email / etc.)
3. Generate a license key for them      ──►     receives the key
4. (optional) revoke / limit keys               enters key on /access and
                                                the app opens instantly
```

## Two delivery types (choose per app)

| Type | You provide | Buyer with a key gets |
| ---- | ----------- | --------------------- |
| 🌐 **Runs in browser** | Upload a **.zip** containing `index.html` (or a single `.html` file) | The app **runs right on your website** at a private URL — nothing to install |
| 🔗 **Hidden link** | A **secret URL** (Google Drive, Dropbox, your own hosting — anything `https://…`) | The link is **revealed only to valid key holders**; never shown publicly |

Web-app zips: everything may be at the root **or** inside one top-level folder
(`my-game/index.html` works too — the folder is stripped automatically). Use
**relative paths** for your assets (`style.css`, `js/app.js`) — a `<base>` tag is
injected automatically so they resolve.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Open **`/admin`** and log in. The default password is **`admin123`** — change it
before going live (see below).

## Pages

| Route            | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `/`              | Storefront — catalog of apps, prices, "how to buy" section       |
| `/access`        | Customer page — enter license key → open the app / reveal link   |
| `/app/<key>/…`   | Key-gated web-app host (only reachable with a valid key)         |
| `/admin`         | Dashboard — manage apps, generate/revoke keys, store settings    |

## Admin features

- **Applications** — name, description, version, price, emoji icon, tile color,
  and a **delivery type** (browser web app or hidden link). Update files or the
  link any time to "ship an update".
- **License keys** — unique keys per customer with optional name/email,
  **max accesses** (how many times the key opens the app) and **expiry date**.
  Revoke / re-activate / delete any time. Click a key to copy it.
- **Stats** — apps, active keys, total accesses, storage used.
- **Settings** — store name, currency symbol (default ₹), and the contact text
  buyers see for purchasing a key.
- Deleting an app removes its files and all of its keys.

## Configuration

Copy `.env.example` to `.env.local` and set:

```bash
ADMIN_PASSWORD=your-strong-password   # without this, password is "admin123"
ADMIN_SECRET=long-random-string       # signs the admin session cookie
```

Restart the server after changing env vars. Admin sessions last 7 days.

## Data storage (no external DB needed)

Everything lives in a git-ignored `data/` folder next to the app:

- `data/db.json` — apps, keys, settings, access log
- `data/uploads/<appId>/` — extracted web-app files (served only via valid keys)

To wipe everything and start fresh: `rm -rf data/`.

> For production at scale, swap `src/lib/db.ts` for a real database (SQLite /
> Postgres) and move uploads to object storage such as S3 — the rest of the app
> stays the same.

## Tech

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · fflate (zip handling) · Node 18.18+

```bash
npm run build && npm start   # production
```
