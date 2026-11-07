# Premium Laundry & Home Appliances Store

Next.js 16 store and admin panel backed by Postgres. Built from the PRD in this folder.

- Storefront: `/`
- Admin (CMS): `/admin`

## Run locally

Needs Node 20.9+ and a Postgres database.

```sh
npm install
cp .env.example .env     # then fill in DATABASE_URL, ADMIN_SECRET, ADMIN_PASSWORD
npm run db:push          # creates the tables
npm run dev
```

The first page view loads the sample catalogue and delivery zones. The first login at `/admin/login` creates the owner account from `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

## Deploy to Netlify

`netlify.toml` is ready, and Netlify applies its Next.js adapter automatically, so no plugin is needed.

1. Create a Postgres database. Netlify DB, Neon and Supabase all work. Pick a region close to the site's functions, because every page reads from it.
2. Push the repo and import it in Netlify. Leave the build settings as they come from `netlify.toml`.
3. In **Project configuration > Environment variables**, add the values below with both **Builds** and **Functions** scopes:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Postgres connection string (not needed with Netlify DB, which sets `NETLIFY_DATABASE_URL`) |
   | `ADMIN_SECRET` | Random string: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `ADMIN_USERNAME` | First owner's username |
   | `ADMIN_PASSWORD` | First owner's password, 10+ characters |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.co.ke` (optional until a custom domain is set) |
   | `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | Optional analytics IDs |

4. Create the tables once, from your computer: put the connection string in `.env` as `DATABASE_URL`, then run `npm run db:push`. Run this again whenever `src/db/schema.ts` changes.
5. Deploy. Environment variable changes only apply after a new deploy.
6. Log in at `/admin/login`, change the password under **My account**, and turn on 2FA.

## Before going live

The admin dashboard warns about settings that are still placeholders. Also:

- **Replace the sample catalogue.** `src/lib/seed.ts` holds sample data. Only the MWAFCV3310BDS price comes from the PRD; every other model number, price, dimension and warranty needs the owner's real figures.
- **Set the real M-Pesa Till** in Settings. Buyers pay whatever number is shown.
- **Replace the illustrations** in `public/images` with real photos, using Admin > Content and Products.
- **Confirm dealer status.** Review the dealer statement, warranty wording and legal pages before launch.

## Roles

| Role | Access |
| --- | --- |
| Owner | Everything, including settings, users, reports and audit log |
| Sales | Orders and leads |
| Content | Products, content, reviews and delivery zones |
