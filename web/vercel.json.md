# `vercel.json`, explained

> `vercel.json` can't hold comments: JSON has no comment syntax, and Vercel rejects unknown keys.
> So its explanation lives here, right next to it. **If you change `vercel.json`, update this file.**

`vercel.json` gives Vercel the instructions for the **website** project (`devaangini`). Vercel reads it on every deploy.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "angular",
  "buildCommand": "npm run build",
  "outputDirectory": "dist/web/browser",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://portfolio-neon-six-56.vercel.app/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

| Line | What it means | Why it's there |
|---|---|---|
| `$schema` | Lets VS Code check the file and suggest keys | Catches typos before deploying |
| `framework: "angular"` | "This is an Angular app" | Vercel uses the right defaults |
| `buildCommand` | Runs `npm run build` (= `ng build`) | Turns the Angular code into plain HTML/CSS/JS files |
| `outputDirectory` | The built files are in `dist/web/browser` | Angular puts them in a `browser` sub-folder; without this line Vercel showed a 404 |
| `rewrites` | Two forwarding rules, checked **in order** (see below) | The live "/api front desk", and making page addresses like `/blog` work |

## The two `rewrites`, the live "/api front desk"

A **rewrite** means: "when a visitor asks for address X, quietly serve address Y instead". The browser's address bar doesn't change, and the visitor never sees Y.

**Rule 1: `/api/...` → the API project**
```text
browser ──GET devaangini-portfolio.vercel.app/api/skills──▶ Vercel (website project)
                                                              │ rule 1 matches "/api/…"
                                                              ▼
                                   portfolio-neon-six-56.vercel.app/api/skills  (the Express API)
```
- `:path*` means "whatever comes after `/api/`", copied into the destination. So `/api/skills` → `…/api/skills`, and `/api/auth/login` → `…/api/auth/login`.
- **Why:** the browser only ever talks to the website's address. Page and data come from **one address**, which the login cookie needs (`sameSite`), and CORS is no longer involved.
- **Same job on the laptop:** `proxy.conf.mjs` (4200 → 3000). So Angular always just calls `/api/...`.
- **Side effect:** the API now sees requests coming *from Vercel*, so the contact-form firewall rule also lives on this website project (it can still see each visitor's IP).

**Rule 2: everything else → `index.html`**
```text
browser ──GET devaangini-portfolio.vercel.app/blog──▶ no file called "blog" exists
                                                       │ rule 2
                                                       ▼
                                   index.html → Angular starts → its router shows the /blog page
```
- Angular is a **single-page app**: there's only one real HTML file. Pages like `/blog` exist only inside Angular's router.
- Without this rule, opening `/blog` directly (or refreshing on it) would give a Vercel **404**.
- Real files (JS, CSS, images, the CV) are still served first. Vercel only uses rewrites when no file matches.

**Order matters:** rule 1 comes first, so `/api/...` goes to the API and is never swallowed by rule 2.

## If something changes
- **The API's address changes** → update the `destination` of rule 1, then push.
- **The website's address changes** → nothing here; but update `CORS_ORIGIN` on the API project (the login's Origin check uses it).
