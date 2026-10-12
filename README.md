<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/085ea204-0db0-467d-9788-74fecdd0572e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase checkout and merchant setup

Before using database-backed checkout or dispatch, run [`supabase/checkout.sql`](./supabase/checkout.sql) in the Supabase SQL Editor. Checkout requires a signed-in Supabase customer and atomically writes the profile, order, order items, and stock changes.

Merchant access requires a Supabase Auth account to have `app_metadata.role` set to `seller` by a trusted project administrator. Accounts without this trusted role are denied dashboard access. The browser-local preview sign-in is only available when Supabase is not configured.

To grant merchant access to an existing account in your own project, replace `YOUR_LOGIN_EMAIL` below with the exact email you control and run it in the Supabase SQL Editor. This updates both the trusted Auth role used for sign-in and the profile role used by product-management row-level security:

```sql
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"seller"}'::jsonb
where lower(email) = lower('YOUR_LOGIN_EMAIL');

update public.profiles
set role = 'seller'
where id = (
  select id
  from auth.users
  where lower(email) = lower('YOUR_LOGIN_EMAIL')
);
```

Run this only for an account you own; then sign out and back in so Supabase issues a token with the updated role.

To reset a merchant password, use the seller portal Forgot password action and open the recovery email. The link returns to `/seller.html`, where the merchant can enter and confirm a new password; after saving, the portal signs in the recovered account only if its trusted `app_metadata.role` is `seller`. The current frontend points to the hosted Supabase project, so its recovery email is sent by hosted Auth and will not appear in local Mailpit merely because `supabase start` is running. If the frontend is configured to use local Supabase, view local recovery messages in Mailpit at `http://127.0.0.1:54324`. The configured `redirectTo` URL must also be in the Supabase Auth redirect allow list (locally, see `supabase/config.toml`; for a hosted project, add the deployed seller page URL in the Supabase Dashboard).
