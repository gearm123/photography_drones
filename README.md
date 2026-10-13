# Tripframe

Early-access landing page for an on-demand photography marketplace. Travelers and photographers can join a waitlist. The site does not book sessions, take payment, or create accounts.

## Local development

```bash
npm install
npm run dev
```

The page runs at `http://localhost:5173`. Form submissions need the Netlify dev server, which also starts the local database:

```bash
npm run db:migrate
npm run dev:netlify
```

Open `http://localhost:8888`.

## Database

Lead rows are stored in Netlify Database (PostgreSQL).

- `traveler_leads` — name, email, destination, service tier
- `photographer_leads` — name, email, location, specialization, optional portfolio URL

Migrations live in `netlify/database/migrations`. Netlify applies them on deploy. Apply them locally with `npm run db:migrate`. Database credentials stay on the server. The browser only posts to `/api/traveler-leads` and `/api/photographer-leads`.

## Admin

Open `/admin` and sign in with the `ADMIN_PASSWORD` environment variable. The password stays on the server. The page lists traveler and photographer leads from Netlify Database. Set the variable to at least 8 characters in Netlify, or in a local `.env` file when using `netlify dev`. Do not commit `.env`.

## Deploy

Push this folder to GitHub, then create a Netlify site from that repository. `netlify.toml` already sets the build command, publish directory, and Node 22.

On that first Netlify deploy, `@netlify/database` provisions PostgreSQL and Netlify applies `netlify/database/migrations` before the site is published. You do not create the tables by hand and you do not set `NETLIFY_DB_URL`.

Before the deploy, set one environment variable on the Netlify site:

- `ADMIN_PASSWORD` — at least 8 characters

Without it, the public forms can still save leads, but `/admin` cannot sign in.

After the site has a real domain, replace `https://tripframe.netlify.app` in:

- `index.html`
- `public/sitemap.xml`
- `public/robots.txt`
- `public/privacy/index.html`
