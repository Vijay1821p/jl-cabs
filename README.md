# Jayalakshmi Cabs & Services

Taxi booking site. React on Vercel, Node.js API on Render, PostgreSQL on Supabase, payments through Razorpay.

## Local setup

```bash
npm install
cp server/.env.example server/.env
```

Put your Supabase connection string in `server/.env` as `DATABASE_URL`, then:

```bash
npm run dev
```

Site: http://localhost:5173  
API: http://localhost:3001

The API creates the `bookings` table on startup. You can also run `supabase/schema.sql` in the Supabase SQL editor.

## Deploy

1. Create a Supabase project. Copy the Postgres connection string into Render as `DATABASE_URL`.
2. Push this folder to GitHub.
3. Render: New Blueprint, select the repo. Set `ADMIN_PASSWORD`, `DATABASE_URL`, Razorpay keys, and `CLIENT_ORIGIN` to your Vercel URL.
4. Vercel: import the same repo. Set `VITE_API_URL` to the Render URL, for example `https://jayalakshmi-cabs-api.onrender.com`.
5. Razorpay keys: use `rzp_test_` first, then `rzp_live_` after the account is approved.

UPI, Google Pay, PhonePe, cards and net banking are all inside the Razorpay checkout. They do not need separate integrations.
