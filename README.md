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
- `photographer_emails` — one delivery record per application message, so a sent email is not sent again

Migrations live in `netlify/database/migrations`. Netlify applies them on deploy. Apply them locally with `npm run db:migrate`. Database credentials stay on the server. The website posts photographer applications to `/api/photographer-leads`. It does not collect new traveler sign-ups.

## Admin

Open `/admin` and sign in with the `ADMIN_PASSWORD` environment variable. The password stays on the server. After sign-in you can filter applications by pending, approved, or rejected, open a profile and its portfolio links, approve or reject an application, and edit, suspend, or deactivate a photographer. The same page shows whether each email was sent and can retry a failed one. Set the variable to at least 8 characters in Netlify, or in a local `.env` file when using `netlify dev`. Do not commit `.env`.

## Email

Photographer applications send transactional email through [Resend](https://resend.com).

- The photographer receives a confirmation when the application is saved.
- `ADMIN_EMAIL` receives one notice for each new application.
- Approving or rejecting sends one email to the photographer. Suspend, restore, and profile edits do not send another decision email.
- Each message is stored once in `photographer_emails`. A sent message is not sent again. A failed send stays on the application and can be retried from `/admin`. Resend idempotency keys stop a retry of an uncertain delivery from sending a second copy within 24 hours.
- The application is saved even when email fails.

Set these with `ADMIN_PASSWORD` in Netlify, and in `.env` for `netlify dev`:

- `RESEND_API_KEY`
- `EMAIL_FROM` — for example `Tripframe <hello@tripframe.com>`
- `ADMIN_EMAIL` — inbox for new-application notices

To verify the sending domain, add the domain from `EMAIL_FROM` in Resend and publish the SPF and DKIM records it shows. The admin dashboard reports whether that domain is verified and lists any sending records still outstanding. Until verification succeeds, applications are still saved and the failed emails can be retried.

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
- `RESEND_API_KEY` — Resend API key for transactional email
- `EMAIL_FROM` — verified sender, for example `Tripframe <hello@tripframe.com>`
- `ADMIN_EMAIL` — inbox that receives new photographer applications

Without `ADMIN_PASSWORD`, the public form can still save applications, but `/admin` cannot sign in. Without the email variables, applications are still saved and the dashboard shows that mail is not configured.

After the site has a real domain, replace `https://tripframe.netlify.app` in:

- `index.html`
- `public/sitemap.xml`
- `public/robots.txt`
- `public/privacy/index.html`
