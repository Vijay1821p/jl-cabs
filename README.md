# Jayalakshmi Cabs

English taxi booking website. Customers get a fare, pay 25% or the full amount online, and you manage bookings from Admin.

| Part | What it is | Where it runs |
| --- | --- | --- |
| Website | React (Vite) | Vercel |
| API | Node.js + Express | Render |
| Database | PostgreSQL | Supabase |
| Payments | UPI, cards, net banking | Razorpay |

GitHub: https://github.com/Vijay1821p/jl-cabs

---

## 1. Run on your computer

You need [Node.js 20+](https://nodejs.org/) and a Postgres database (local Docker or [Supabase](https://supabase.com)).

```bash
npm install
cp server/.env.example server/.env
```

Edit `server/.env`:

- `PORT=3002` (the website already talks to this port)
- `DATABASE_URL` — Supabase **Session pooler** URI, or local Postgres
- `ADMIN_PASSWORD` — password for `/admin`
- `JWT_SECRET` — any long random text
- Leave Razorpay keys empty until you want live pay

```bash
npm run dev
```

- Website: http://localhost:5173
- API: http://localhost:3002

Open **Admin**, sign in, then set phone, WhatsApp, office address, rates and festival offers.

---

## 2. Host the live site (do this in order)

The site is already on GitHub. Hosting is three free/cheap services plus Razorpay.

### A. Database — Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a project (region: Mumbai / `ap-south-1` is fine).
2. **Project Settings → Database → Connection string → URI**.
3. Copy the **Session pooler** URL (port `5432`). Replace `[YOUR-PASSWORD]`.
4. Optional: in **SQL Editor**, paste and run `supabase/schema.sql`. The API also creates tables on first start.

Keep this URL. You will paste it on Render as `DATABASE_URL`.

### B. API — Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in with GitHub (**Vijay1821p**).
2. **New → Blueprint**. Select `Vijay1821p/jl-cabs`.
3. Apply the blueprint. It creates `jayalakshmi-cabs-api`.
4. Open the service → **Environment** and set:

| Variable | Example |
| --- | --- |
| `DATABASE_URL` | the Supabase URI |
| `ADMIN_PASSWORD` | a strong password |
| `JWT_SECRET` | long random string (Render can auto-fill this) |
| `RAZORPAY_KEY_ID` | `rzp_test_...` first |
| `RAZORPAY_KEY_SECRET` | from Razorpay |
| `CLIENT_ORIGIN` | your Vercel URL, no slash at the end, e.g. `https://jl-cabs.vercel.app` |

5. Wait for **Live**. Copy the API URL, e.g. `https://jayalakshmi-cabs-api.onrender.com`.
6. Open `https://YOUR-API.onrender.com/api/health` — you should see it is healthy.

The free Render plan sleeps after idle time. The first booking after a pause can take 30–60 seconds.

### C. Website — Vercel

1. Go to [https://vercel.com](https://vercel.com) and import `Vijay1821p/jl-cabs`.
2. Framework: Vite. Build command and output folder are already in `vercel.json`.
3. **Settings → Environment Variables**:

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | Render URL, no trailing slash, e.g. `https://jayalakshmi-cabs-api.onrender.com` |

4. Deploy. You get a URL like `https://jl-cabs.vercel.app`.
5. Go back to Render and set `CLIENT_ORIGIN` to that Vercel URL. Redeploy the API if needed.

If you add a custom domain later, put both origins in `CLIENT_ORIGIN`, comma separated:

```text
https://jl-cabs.vercel.app,https://www.yourdomain.com
```

### D. Payments — Razorpay

1. Create an account at [https://razorpay.com](https://razorpay.com).
2. **Account & Settings → API Keys**. Start with **test** keys (`rzp_test_`).
3. Put `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on Render. Redeploy the API.
4. After KYC, switch to **live** keys (`rzp_live_`) on Render.

UPI, Google Pay, PhonePe, cards and net banking all open inside Razorpay. You do not add them separately.

### E. Your own domain (optional)

1. In Vercel: **Project → Settings → Domains** → add `www.yourdomain.com`.
2. At GoDaddy / your DNS host, add the **A** / **CNAME** records Vercel shows.
3. Update Render `CLIENT_ORIGIN` to include the new https URL.

---

## 3. After it is live

1. Open the Vercel site → **Admin**.
2. Set phone, WhatsApp greeting, office address, GST (optional), rates, tourist places and festival offers.
3. Book a test trip with Razorpay **test** mode.
4. Check **Track** with the booking ID and mobile number.

---

## 4. If something fails

| Problem | What to check |
| --- | --- |
| Website loads, booking fails | `VITE_API_URL` on Vercel must be the Render URL. Redeploy the website after you change it. |
| CORS / blocked by browser | Render `CLIENT_ORIGIN` must match the exact website URL (`https`, no trailing slash). |
| Admin login not configured | `ADMIN_PASSWORD` and `JWT_SECRET` must be set on Render. |
| Database error | Supabase password in `DATABASE_URL`, and use the pooler URI. |
| Pay button does nothing | Razorpay keys on Render. Test keys only work in test mode. |
| First request is slow | Render free plan is waking up. Wait one minute and try again. |

Do not commit `server/.env`. Only `.env.example` files belong in Git.
