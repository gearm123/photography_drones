# Tripframe

Early-access landing page for an on-demand photography marketplace. Photographers apply on this website. Travelers will find a photographer in the iPhone and Android apps, which are still being built. The site does not book sessions, take payment, or create accounts.

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
- `photographer_leads` — private application: name, email, WhatsApp number, location, working areas, equipment, experience, availability, specialties, proposed hourly rate, portfolio links, and status
- `photographer_profiles` — public profile for the apps: name, location, working areas, specialties, hourly rate, and portfolio links. A row is active only while the application status is approved
- `photographer_emails` — leftover delivery rows from the earlier mail provider. New notices go through Netlify Forms and do not write to this table.

Migrations live in `netlify/database/migrations`. Netlify applies them on deploy. Apply them locally with `npm run db:migrate`. Database credentials stay on the server. The website posts photographer applications to `/api/photographer-leads`. It does not collect new traveler sign-ups.

## Admin

Open `/admin` and sign in with the `ADMIN_PASSWORD` environment variable. The password stays on the server. After sign-in you can filter applications by pending, approved, or rejected, open a profile and its portfolio links, approve or reject an application, and edit, suspend, or deactivate a photographer. The same page can send the application to you again through Netlify Forms. Set the variable to at least 8 characters in Netlify, or in a local `.env` file when using `netlify dev`. Do not commit `.env`.

## Email

A new photographer application is saved in the database and submitted to the Netlify Form `photographer-application`. Netlify emails the addresses you add for that form. The form field named `email` is the photographer, so a reply to the notification goes to them.

Netlify does not send a separate confirmation, approval, or rejection to the photographer. Approving or rejecting in `/admin` does not send another email. The application is saved even when the form submission fails. Open the application and choose **Email this application** to submit it again.

After the first deploy that includes `public/forms.html`:

1. In Netlify, open **Forms** and confirm form detection is enabled. The form name is `photographer-application`.
2. Open **Form submission notifications** and add an email notification for that form. Use the inbox that should receive new applications.
3. Trigger a deploy if the form does not appear yet, then use **Email this application** for any application that arrived before this was set up.

`RESEND_API_KEY`, `EMAIL_FROM`, and `ADMIN_EMAIL` are no longer used.

## Mobile app API

The iPhone and Android apps read approved photographers from two public GET endpoints. They do not use the admin cookie, and the responses leave out email, WhatsApp, equipment, experience, and availability.

- `GET /api/photographers` — active profiles, newest published first. Optional `specialty` is `mobile`, `professional`, `drone`, or `hotels`. Optional `limit` is 1–100.
- `GET /api/photographers/:id` — one active profile. Unknown, pending, rejected, suspended, and deactivated photographers return 404.

`src/mobile/photographerApi.ts` is the fetch client for the React Native app. Run `npm run test:mobile-api` to call those endpoints the same way the app does. Admin routes such as `GET /api/admin/leads` still require the admin session.

## Deploy

Push this folder to GitHub, then create a Netlify site from that repository. `netlify.toml` already sets the build command, publish directory, and Node 22.

On that first Netlify deploy, `@netlify/database` provisions PostgreSQL and Netlify applies `netlify/database/migrations` before the site is published. You do not create the tables by hand and you do not set `NETLIFY_DB_URL`.

Before the deploy, set these environment variables on the Netlify site:

- `ADMIN_PASSWORD` — at least 8 characters

Without `ADMIN_PASSWORD`, the public form can still save applications, but `/admin` cannot sign in. Form notification emails are configured in the Netlify UI, not with an environment variable.

After the site has a real domain, replace `https://tripframe.netlify.app` in:

- `src/seo/site.ts` (this origin is copied into each language page during the build)
- `index.html`
- `public/sitemap.xml`
- `public/robots.txt`
- `public/privacy/index.html`
