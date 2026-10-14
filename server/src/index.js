import crypto from "node:crypto";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import { z, ZodError } from "zod";
import { amountDueNow, computeFare, listedDropFare, mergeSite, normalizeTime, normalizeVehicle, popularRouteKm, tripById, vehicleById } from "@jc/shared";
import { initDb, one, query } from "./db.js";
import { roadDistanceKm } from "./distance.js";
import { getSite, initSite, saveSite } from "./site.js";

const port = Number(process.env.PORT) || 3001;
const adminPassword = process.env.ADMIN_PASSWORD || "";
const jwtSecret = process.env.JWT_SECRET || "";
const razorpayKey = process.env.RAZORPAY_KEY_ID || "";
const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || "";
const razorpay = razorpayKey && razorpaySecret
  ? new Razorpay({ key_id: razorpayKey, key_secret: razorpaySecret })
  : null;
const origins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const extra = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://jl-cabs.vercel.app",
    "https://jlcabs.com",
    "https://www.jlcabs.com",
  ];
  return origins.includes(origin) || extra.includes(origin) || /\.vercel\.app$/.test(origin);
}

const phone = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");
const bookingInput = z.object({
  customer_name: z.string().trim().min(2, "Enter the customer name").max(80),
  mobile: phone,
  pickup: z.string().trim().min(3, "Enter the pickup location").max(200),
  drop_location: z.string().trim().min(3, "Enter the drop location").max(200),
  trip_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a date"),
  trip_time: z.string().trim().transform((value) => normalizeTime(value)).refine((value) => /^\d{2}:\d{2}$/.test(value), "Select a time"),
  trip_type: z.enum(["one_way", "round", "outstation", "hourly"]),
  vehicle_type: z.preprocess(normalizeVehicle, z.enum(["sedan", "suv", "muv", "crysta"])),
  hours: z.coerce.number().int().min(2).max(15).optional(),
  days: z.coerce.number().int().min(1).max(30).optional(),
  payment_choice: z.enum(["advance", "full"]).optional(),
});

function todayIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function newBookingId() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let id = "JC";
  for (let i = 0; i < 6; i++) id += alphabet[crypto.randomInt(alphabet.length)];
  return id;
}

function dateOnly(value) {
  if (!value) return "";
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

function publicBooking(row) {
  return {
    id: row.id,
    booking_id: row.booking_id,
    customer_name: row.customer_name,
    mobile: row.mobile,
    pickup: row.pickup,
    drop_location: row.drop_location,
    trip_date: dateOnly(row.trip_date),
    trip_time: row.trip_time,
    trip_type: row.trip_type,
    vehicle_type: row.vehicle_type,
    distance_km: row.distance_km,
    hours: row.hours,
    days: row.days,
    fare: row.fare,
    fare_lines: row.fare_lines,
    payment_choice: row.payment_choice,
    amount_paid: row.amount_paid,
    payment_status: row.payment_status,
    booking_status: row.booking_status,
    driver_name: row.driver_name || "",
    driver_mobile: row.driver_mobile || "",
    vehicle_number: row.vehicle_number || "",
    razorpay_order_id: row.razorpay_order_id || "",
    razorpay_payment_id: row.razorpay_payment_id || "",
    payment_receipt: row.payment_receipt || {},
    created_at: row.created_at,
  };
}

async function fetchRazorpayPayment(paymentId) {
  if (!razorpay || !paymentId) return null;
  try {
    return await razorpay.payments.fetch(paymentId);
  } catch {
    return null;
  }
}

function razorpayHttpError(error) {
  const description = error?.error?.description || error?.message || "Razorpay request failed.";
  const statusCode = Number(error?.statusCode) || 500;
  const status = statusCode === 401 ? 401 : statusCode >= 400 && statusCode < 500 ? statusCode : 500;
  const next = new Error(description);
  next.status = status;
  return next;
}

function receiptFromRazorpay(pay, orderId, paidNow, paymentId) {
  if (!pay) {
    return {
      provider: "Razorpay",
      payment_id: paymentId || "",
      order_id: orderId || "",
      amount: paidNow,
      status: "captured",
      method: "online",
    };
  }
  return {
    provider: "Razorpay",
    payment_id: pay.id || "",
    order_id: pay.order_id || orderId || "",
    amount: Math.round(Number(pay.amount || 0) / 100) || paidNow,
    currency: pay.currency || "INR",
    status: pay.status || "captured",
    method: pay.method || "online",
    vpa: pay.vpa || "",
    email: pay.email || "",
    contact: pay.contact || "",
    bank: pay.bank || "",
    wallet: pay.wallet || "",
    card_last4: pay.card?.last4 || "",
    created_at: pay.created_at ? new Date(pay.created_at * 1000).toISOString() : "",
  };
}

async function priceTrip(input) {
  const trip = tripById(input.trip_type);
  let km = null;
  let hours = null;
  if (trip.needsRoute) {
    const route = await roadDistanceKm(input.pickup, input.drop_location);
    km = route.km;
  } else {
    hours = input.hours || 2;
  }
  hours = input.hours || hours || 2;
  const fare = computeFare({
    tripType: input.trip_type,
    vehicleId: input.vehicle_type,
    km,
    hours,
    pickup: input.pickup,
    drop_location: input.drop_location,
    trip_time: input.trip_time,
    trip_date: input.trip_date,
    days: input.days,
    site: getSite(),
  });
  if (!fare.total) {
    const error = new Error("Choose the trip and vehicle so the fare can be calculated.");
    error.status = 400;
    throw error;
  }
  return { km, hours: fare.hours || hours, fare };
}

function requireAdmin(req, res, next) {
  if (!adminPassword || !jwtSecret) return res.status(503).json({ error: "Admin login is not configured." });
  try {
    const token = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const payload = jwt.verify(token, jwtSecret);
    if (payload.role !== "admin") throw new Error("not admin");
    next();
  } catch {
    res.status(401).json({ error: "Please sign in again." });
  }
}

const app = express();
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin));
  },
  credentials: false,
}));
app.use(express.json({ limit: "100kb" }));

const writeLimit = rateLimit({ windowMs: 15 * 60_000, limit: 40, standardHeaders: "draft-8", legacyHeaders: false });
const loginLimit = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/config", (_req, res) => {
  res.json({ razorpay: Boolean(razorpayKey && razorpaySecret), keyId: razorpayKey || null });
});

app.get("/api/site", (_req, res) => {
  res.json(getSite());
});

app.put("/api/admin/site", requireAdmin, async (req, res, next) => {
  try {
    const site = await saveSite(mergeSite(req.body || {}));
    res.json(site);
  } catch (error) {
    next(error);
  }
});

function publicTrip(row) {
  const km = Number(row.km) || popularRouteKm(row.from_place, row.to_place);
  return {
    id: row.id,
    from_place: row.from_place,
    to_place: row.to_place,
    fare: km ? listedDropFare(km, "sedan") : row.fare,
    km,
    trip_type: row.trip_type || "one_way",
    image_url: row.image_url,
    sort_order: row.sort_order,
    visible: row.visible,
  };
}

const tripFields = z.object({
  from_place: z.string().trim().min(2).max(80),
  to_place: z.string().trim().min(2).max(80),
  km: z.coerce.number().int().min(1).max(2000).optional(),
  fare: z.coerce.number().int().min(0).max(200000).optional(),
  trip_type: z.enum(["one_way", "round", "outstation", "hourly"]).default("one_way"),
  image_url: z.string().trim().max(500).optional(),
  sort_order: z.coerce.number().int().min(0).max(999).optional(),
  visible: z.boolean().optional(),
});

app.get("/api/trips", async (_req, res, next) => {
  try {
    const rows = await query("select * from popular_trips where visible = true order by sort_order, id");
    res.json({ trips: rows.map(publicTrip) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/trips", requireAdmin, async (_req, res, next) => {
  try {
    const rows = await query("select * from popular_trips order by sort_order, id");
    res.json({ trips: rows.map(publicTrip) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/trips", requireAdmin, async (req, res, next) => {
  try {
    const input = tripFields.parse(req.body);
    const row = await one(
      `insert into popular_trips (from_place, to_place, fare, km, trip_type, image_url, sort_order, visible)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [input.from_place, input.to_place, input.km ? listedDropFare(input.km, "sedan") : (input.fare || 0), input.km || null, input.trip_type, input.image_url || "", input.sort_order ?? 0, input.visible !== false]
    );
    res.status(201).json({ trip: publicTrip(row) });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/trips/:id", requireAdmin, async (req, res, next) => {
  try {
    const input = tripFields.partial().parse(req.body);
    const current = await one("select * from popular_trips where id = $1", [req.params.id]);
    if (!current) return res.status(404).json({ error: "Trip not found." });
    const nextRow = { ...current, ...input };
    const row = await one(
      `update popular_trips
          set from_place=$1, to_place=$2, fare=$3, km=$4, trip_type=$5, image_url=$6, sort_order=$7, visible=$8
        where id=$9 returning *`,
      [nextRow.from_place, nextRow.to_place, nextRow.km ? listedDropFare(nextRow.km, "sedan") : (nextRow.fare || 0), nextRow.km || null, nextRow.trip_type, nextRow.image_url || "", nextRow.sort_order, nextRow.visible, req.params.id]
    );
    res.json({ trip: publicTrip(row) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/trips/:id", requireAdmin, async (req, res, next) => {
  try {
    const row = await one("delete from popular_trips where id = $1 returning *", [req.params.id]);
    if (!row) return res.status(404).json({ error: "Trip not found." });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/quote", writeLimit, async (req, res, next) => {
  try {
    const input = bookingInput
      .omit({ customer_name: true, mobile: true, trip_date: true })
      .extend({
        trip_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        trip_time: z.string().trim().optional().transform((value) => (value ? normalizeTime(value) : "")),
      })
      .parse(req.body);
    const priced = await priceTrip(input);
    res.json({ distance_km: priced.km, hours: priced.hours, days: priced.fare.days || input.days || 1, fare: priced.fare.total, lines: priced.fare.lines });
  } catch (error) {
    next(error);
  }
});

app.post("/api/bookings", writeLimit, async (req, res, next) => {
  try {
    const input = bookingInput.parse(req.body);
    if (input.trip_date < todayIndia()) return res.status(400).json({ error: "The journey date is in the past." });
    if (!vehicleById(input.vehicle_type) || !tripById(input.trip_type)) {
      return res.status(400).json({ error: "Choose a valid trip and vehicle." });
    }
    input.vehicle_type = normalizeVehicle(input.vehicle_type);
    const priced = await priceTrip(input);
    const bookingId = newBookingId();
    const choice = input.payment_choice === "full" ? "full" : "advance";
    const row = await one(
      `insert into bookings
        (booking_id, customer_name, mobile, pickup, drop_location, trip_date, trip_time,
         trip_type, vehicle_type, distance_km, hours, days, fare, fare_lines, payment_status, payment_choice, amount_paid)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16,$17)
       returning *`,
      [
        bookingId, input.customer_name, input.mobile, input.pickup, input.drop_location,
        input.trip_date, input.trip_time, input.trip_type, input.vehicle_type,
        priced.km, priced.hours, input.trip_type === "round" ? (input.days || 1) : null, priced.fare.total, JSON.stringify(priced.fare.lines),
        "pending",
        choice,
        0,
      ]
    );
    res.status(201).json({ booking: publicBooking(row) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/bookings", requireAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const rows = await query(
      `select * from bookings
        where ($1 = '' or booking_id ilike $2 or customer_name ilike $2 or mobile ilike $2
               or pickup ilike $2 or drop_location ilike $2)
        order by created_at desc
        limit 200`,
      [q, `%${q}%`]
    );
    res.json({ bookings: rows.map(publicBooking) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/bookings/:id", async (req, res, next) => {
  try {
    const row = await one("select * from bookings where booking_id = $1", [req.params.id.toUpperCase()]);
    if (!row) return res.status(404).json({ error: "Booking not found." });
    const token = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    let isAdmin = false;
    if (token && jwtSecret) {
      try { isAdmin = jwt.verify(token, jwtSecret).role === "admin"; } catch { isAdmin = false; }
    }
    if (!isAdmin && row.mobile !== String(req.query.mobile || "")) {
      return res.status(404).json({ error: "Booking not found. Check the booking ID and mobile number." });
    }
    res.json({ booking: publicBooking(row) });
  } catch (error) {
    next(error);
  }
});

async function createPaymentOrder(req, res, next) {
  try {
    if (!razorpay) return res.status(503).json({ error: "Online payment is not available yet. Please try again later." });
    const { booking_id: bookingId, mobile } = z.object({ booking_id: z.string().min(4), mobile: phone }).parse(req.body);
    const row = await one("select * from bookings where booking_id = $1 and mobile = $2", [bookingId.toUpperCase(), mobile]);
    if (!row) return res.status(404).json({ error: "Booking not found." });
    if (row.payment_status === "paid") return res.status(400).json({ error: "This booking is already paid." });
    if (row.booking_status === "cancelled") return res.status(400).json({ error: "This booking is cancelled." });

    const payNow = amountDueNow(row.fare, row.payment_choice);
    const amount = Math.round(Number(payNow) * 100);
    if (!Number.isFinite(amount) || amount < 100) {
      return res.status(400).json({ error: "Amount must be at least ₹1 (100 paise)." });
    }

    let order;
    try {
      order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: row.booking_id.slice(0, 40),
        notes: { booking_id: row.booking_id, kind: row.payment_choice === "full" ? "full" : "advance_25" },
      });
    } catch (error) {
      throw razorpayHttpError(error);
    }

    await query("update bookings set razorpay_order_id = $1, payment_status = 'pending' where id = $2", [order.id, row.id]);
    res.json({
      keyId: razorpayKey,
      order_id: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      name: "Jayalakshmi Cabs & Services",
      description: row.payment_choice === "full" ? `Full fare for ${row.booking_id}` : `25% advance for ${row.booking_id}`,
      prefill: { name: row.customer_name, contact: row.mobile },
    });
  } catch (error) {
    next(error);
  }
}

async function verifyPayment(req, res, next) {
  try {
    if (!razorpaySecret) return res.status(503).json({ error: "Online payment is not available yet. Please try again later." });
    const body = z.object({
      booking_id: z.string().min(4),
      razorpay_order_id: z.string().min(5),
      razorpay_payment_id: z.string().min(5),
      razorpay_signature: z.string().min(10),
    }).parse(req.body);
    const expected = crypto.createHmac("sha256", razorpaySecret).update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(body.razorpay_signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ error: "Payment signature did not match. The booking was not marked as paid." });
    }
    const existing = await one("select * from bookings where booking_id = $1 and razorpay_order_id = $2", [body.booking_id.toUpperCase(), body.razorpay_order_id]);
    if (!existing) return res.status(404).json({ error: "Booking not found." });
    const paidNow = amountDueNow(existing.fare, existing.payment_choice);
    const status = existing.payment_choice === "full" ? "paid" : "advance";
    const razorpayPay = await fetchRazorpayPayment(body.razorpay_payment_id);
    const receipt = receiptFromRazorpay(razorpayPay, body.razorpay_order_id, paidNow, body.razorpay_payment_id);
    const row = await one(
      `update bookings
          set payment_status = $5,
              amount_paid = $4,
              razorpay_payment_id = $2,
              payment_receipt = $6::jsonb
        where booking_id = $1 and razorpay_order_id = $3 and payment_status <> 'advance' and payment_status <> 'paid'
        returning *`,
      [body.booking_id.toUpperCase(), body.razorpay_payment_id, body.razorpay_order_id, paidNow, status, JSON.stringify(receipt)]
    );
    const current = row || await one("select * from bookings where booking_id = $1", [body.booking_id.toUpperCase()]);
    if (!current) return res.status(404).json({ error: "Booking not found." });
    res.json({ ok: true, booking: publicBooking(current) });
  } catch (error) {
    next(error);
  }
}

app.post("/api/payments/create-order", writeLimit, createPaymentOrder);
app.post("/api/create-order", writeLimit, createPaymentOrder);
app.post("/api/payments/verify", writeLimit, verifyPayment);
app.post("/api/verify-payment", writeLimit, verifyPayment);

app.post("/api/admin/login", loginLimit, (req, res) => {
  if (!adminPassword || !jwtSecret) return res.status(503).json({ error: "Set ADMIN_PASSWORD and JWT_SECRET on the server." });
  const given = Buffer.from(String(req.body?.password || ""));
  const expected = Buffer.from(adminPassword);
  const same = given.length === expected.length && crypto.timingSafeEqual(given, expected);
  if (!same) return res.status(401).json({ error: "Incorrect password." });
  res.json({ token: jwt.sign({ role: "admin" }, jwtSecret, { expiresIn: "12h" }) });
});

app.patch("/api/admin/bookings/:id", requireAdmin, async (req, res, next) => {
  try {
    const body = z.object({
      booking_status: z.enum(["requested", "confirmed", "completed", "cancelled"]).optional(),
      payment_status: z.enum(["pending", "paid", "failed", "cash", "advance"]).optional(),
      driver_name: z.string().trim().max(80).optional(),
      driver_mobile: z.string().trim().max(15).optional(),
      vehicle_number: z.string().trim().max(20).optional(),
    }).parse(req.body);
    const sets = [];
    const params = [];
    if (body.booking_status) { params.push(body.booking_status); sets.push(`booking_status = $${params.length}`); }
    if (body.payment_status) { params.push(body.payment_status); sets.push(`payment_status = $${params.length}`); }
    if (body.driver_name !== undefined) { params.push(body.driver_name); sets.push(`driver_name = $${params.length}`); }
    if (body.driver_mobile !== undefined) { params.push(body.driver_mobile); sets.push(`driver_mobile = $${params.length}`); }
    if (body.vehicle_number !== undefined) { params.push(body.vehicle_number); sets.push(`vehicle_number = $${params.length}`); }
    if (!sets.length) return res.status(400).json({ error: "Nothing to update." });
    params.push(req.params.id.toUpperCase());
    const row = await one(`update bookings set ${sets.join(", ")} where booking_id = $${params.length} returning *`, params);
    if (!row) return res.status(404).json({ error: "Booking not found." });
    res.json({ booking: publicBooking(row) });
  } catch (error) {
    next(error);
  }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) return res.status(400).json({ error: error.issues[0]?.message || "Check the form and try again." });
  console.error(error);
  res.status(error.status || 500).json({ error: error.status ? error.message : "Something went wrong. Please try again." });
});

await initDb();
await initSite();
app.listen(port, () => console.log(`[server] http://localhost:${port}`));
