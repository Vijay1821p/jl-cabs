export { TRIP_IMAGES, tripImageSrc, imageForPlace } from "./trip-images.js";

export const COMPANY = {
  name: "Jayalakshmi Cabs & Services",
  shortName: "Jayalakshmi Cabs",
  tagline: "Your Journey, Our Responsibility",
  phone: "8438905590",
  whatsapp: "8438905590",
  whatsappGreeting: "Vanakkam Jayalakshmi Cabs,\n\nI would like to book a cab. Please share the fare and availability.\n\nThank you.",
  instagram: "layalakhmi_cabs",
  advancePercent: 25,
  gstin: "",
  gstEnabled: false,
  gstPercent: 5,
  address: "184, TN HB Colony, Uppilipalayam, Singanallur, Coimbatore 641005",
  state: "Tamil Nadu",
};

export const VEHICLES = [
  { id: "sedan", name: "Sedan", seats: "4+1", examples: "Dzire, Etios, Xcent, Aspire, Zest", drop: 15, round: 13 },
  { id: "suv", name: "SUV", seats: "6+1", examples: "Ertiga, Kia Carens, Enjoy, Rumion", drop: 20, round: 18 },
  { id: "muv", name: "MUV", seats: "6+1", examples: "Innova, Xylo, Marazzo", drop: 21, round: 18 },
  { id: "crysta", name: "Innova Crysta", seats: "6+1", examples: "Innova Crysta", drop: 26, round: 23 },
];

export function listedVehicles(vehicles = VEHICLES) {
  return vehicles
    .filter((row) => row.id === "sedan" || row.id === "suv")
    .map((row) => (row.id === "suv" ? { ...row, name: "MUV" } : row));
}

export function requestVehicleWhatsAppUrl(company = COMPANY, extra = "") {
  const phone = String(company.whatsapp || COMPANY.whatsapp || "").replace(/\D/g, "");
  const text = extra || "I want to request another vehicle. Please share the fare.";
  return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
}

export const TRIPS = [
  { id: "one_way", label: "One Way Trip", needsRoute: true },
  { id: "round", label: "Round Trip", needsRoute: true },
  { id: "outstation", label: "Outstation Trip", needsRoute: true },
  { id: "hourly", label: "Hourly Rental", needsRoute: false },
];

export const BOOK_TRIPS = TRIPS.filter((trip) => trip.id !== "outstation");

export const LOCAL_PACKAGES = [
  { hours: 2, km: 20, sedan: 850, muv: 1200 },
  { hours: 3, km: 30, sedan: 1100, muv: 1550 },
  { hours: 4, km: 40, sedan: 1350, muv: 1900 },
  { hours: 5, km: 50, sedan: 1550, muv: 2150 },
  { hours: 6, km: 60, sedan: 1750, muv: 2400 },
  { hours: 7, km: 70, sedan: 2000, muv: 2750 },
  { hours: 8, km: 80, sedan: 2200, muv: 3000 },
  { hours: 9, km: 90, sedan: 2400, muv: 3250 },
  { hours: 10, km: 100, sedan: 2650, muv: 3600 },
  { hours: 11, km: 110, sedan: 2850, muv: 3850 },
  { hours: 12, km: 120, sedan: 3050, muv: 4100 },
  { hours: 13, km: 130, sedan: 3300, muv: 4450 },
  { hours: 14, km: 140, sedan: 3600, muv: 4800 },
  { hours: 15, km: 150, sedan: 3900, muv: 5100 },
];

export const OUTSTATION_PACKAGES = [
  { id: "half", label: "Half day (6 hrs & 90 km)", hours: 6, km: 90, sedan: 2100, muv: 3000 },
  { id: "full", label: "Full day (10 hrs & 180 km)", hours: 10, km: 180, sedan: 3100, muv: 4000 },
];

export const CHARGES = {
  oneWayMinKm: 100,
  roundMinKm: 250,
  roundMinKmKarnataka: 300,
  outstationMinKm: 90,
  driverBata: 400,
  driverBataLong: 600,
  driverBataAfterKm: 400,
  waitingPerHour: 150,
  roundBataPerDay: 500,
  roundBataLong: 600,
  roundBataAfterKm: 500,
  localExtraHour: { sedan: 200, muv: 250 },
  localExtraKm: { sedan: 20, muv: 25 },
  outstationExtraHour: { sedan: 150, muv: 150 },
  outstationExtraKm: { sedan: 13, muv: 18 },
  nightCharge: 200,
  nightFrom: 23,
  nightTo: 5,
};

export const ONE_WAY_SLABS = [
  { upto: 10, sedan: 400, muv: 400, label: "0–10 km" },
  { upto: 20, sedan: 600, muv: 500, label: "Above 10–20 km" },
  { upto: 30, sedan: 900, muv: 700, label: "Above 20–30 km" },
  { upto: 40, sedan: 1200, muv: 1000, label: "Above 30–40 km" },
  { upto: 50, sedan: 1350, muv: 1500, label: "Above 40–50 km" },
  { upto: 60, sedan: 1620, muv: 2000, label: "Above 50–60 km" },
  { upto: 100, sedan: 1900, muv: 2500, label: "Above 60–100 km" },
];

export function oneWaySlab(km, slabs = ONE_WAY_SLABS) {
  const distance = Math.max(0, Math.round(Number(km) || 0));
  if (distance <= 0 || distance > 100) return null;
  return slabs.find((row) => distance <= row.upto) || null;
}

export const TARIFF_TERMS = [
  "Drop Trips - Driver Batta Rs. 400. [Rs. 600 for above 400 kms] - Waiting Charges Rs. 150 per hour.",
  "Drop Trips - Up to 100 km the one-way slab fare applies. From 101 km the fare is the actual road kilometres × the per-km rate.",
  "Round Trips - Driver batta is Rs. 500/- per day.",
  "Round Trips - Driver batta is Rs. 600/- per day if the distance travelled is more than 500kms in a single day.",
  "Round Trips - Minimum running must be 250 Kms per day. For Karnataka it is minimum 300 Kms per day.",
  "Round Trips - 1 day means 1 calendar day (from 00:00 hrs to 23:59 hrs).",
  "Hill station charges - Rs. 300 for sedan Rs. 500 for MUV.",
  "Night Charges Rs. 200 - Applicable if the trip starts between 11 pm and 5 am.",
  "Washing Charges for carrying Pet Rs. 400 for Sedan & Rs. 500 for MUV.",
  "Luggage charges Rs. 300 for carrying extra Luggage. Check Luggage Policy for more details.",
  "Only 2 (Pickup & drop) points are allowed. More than that charges will be applicable.",
  "A charge of Rs. 300 applies for extra person.",
];

export const EXTRAS = [
  "Toll Charges Extra",
  "Parking Charges Extra",
  "Interstate Permit Charges Extra",
  "Driver Bata Extra as per tariff",
  "Extra KM Charges Applicable",
  "Extra Hour / Waiting Charges Applicable",
];

export const FARE_NOTICE =
  "Rates are subject to change without prior notice. Final fare will be confirmed at the time of booking.";

export function formatPhone(n) {
  const digits = String(n || "").replace(/\D/g, "");
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  return digits || String(n || "");
}

export function defaultSite() {
  return {
    company: { ...COMPANY },
    vehicles: VEHICLES.map((row) => ({ ...row })),
    charges: {
      ...CHARGES,
      localExtraHour: { ...CHARGES.localExtraHour },
      localExtraKm: { ...CHARGES.localExtraKm },
      outstationExtraHour: { ...CHARGES.outstationExtraHour },
      outstationExtraKm: { ...CHARGES.outstationExtraKm },
    },
    localPackages: LOCAL_PACKAGES.map((row) => ({ ...row })),
    outstationPackages: OUTSTATION_PACKAGES.map((row) => ({ ...row })),
    oneWaySlabs: ONE_WAY_SLABS.map((row) => ({ ...row })),
    tariffTerms: [...TARIFF_TERMS],
    extras: [...EXTRAS],
    fareNotice: FARE_NOTICE,
    pages: {
      heroKicker: "Book, travel, arrive",
      heroLead: "One way, round trip, outstation and hourly cabs across Tamil Nadu and nearby states. Sedan and MUV. Fare shown before you pay.",
      footerBlurb: "Sedan and MUV trips across Tamil Nadu, Karnataka, Kerala and Andhra Pradesh.",
      tariffLead: "Toll, parking and interstate permit are extra.",
      termsIntro: "A booking request is confirmed only after we call or message you with the driver details.\n\nTo hold a booking you pay 25% online now, or you can pay the full fare online. The remaining amount after a 25% advance is paid later.",
      luggage: "One medium bag per passenger is included. Extra luggage is Rs. 300. Pets need a washing charge of Rs. 400 for Sedan and Rs. 500 for MUV. Tell us at booking if you have extra bags or a pet.",
      refund: "Cancel 12 hours or more before pickup: the full online payment is refunded.\nCancel between 4 and 12 hours before pickup: half of the online payment is refunded.\nCancel under 4 hours before pickup, or if you do not arrive: the online payment is not refunded.\nIf we cancel the trip, the full online payment is refunded to the original UPI, card or bank account within 5 to 7 working days.",
      privacy: "We store your name, mobile number, pickup, drop, trip time and payment status so we can send the cab and keep the booking record.\n\nCard numbers and UPI PINs are handled by Razorpay. We do not see them. We do not sell customer details.",
    },
    offers: [],
  };
}

export function mergeSite(partial) {
  const base = defaultSite();
  if (!partial || typeof partial !== "object") return base;
  const vehicles = Array.isArray(partial.vehicles)
    ? base.vehicles.map((row) => {
        const merged = { ...row, ...(partial.vehicles.find((item) => item.id === row.id) || {}) };
        if (row.id === "muv") merged.seats = "6+1";
        return merged;
      })
    : base.vehicles;
  const next = {
    ...base,
    ...partial,
    company: { ...base.company, ...(partial.company || {}) },
    vehicles,
    charges: {
      ...base.charges,
      ...(partial.charges || {}),
      oneWayMinKm: Number(partial.charges?.oneWayMinKm) || 100,
      roundMinKm: Number(partial.charges?.roundMinKm) || 250,
      roundMinKmKarnataka: Number(partial.charges?.roundMinKmKarnataka) || 300,
      localExtraHour: { ...base.charges.localExtraHour, ...(partial.charges?.localExtraHour || {}) },
      localExtraKm: { ...base.charges.localExtraKm, ...(partial.charges?.localExtraKm || {}) },
      outstationExtraHour: { ...base.charges.outstationExtraHour, ...(partial.charges?.outstationExtraHour || {}) },
      outstationExtraKm: { ...base.charges.outstationExtraKm, ...(partial.charges?.outstationExtraKm || {}) },
    },
    localPackages: Array.isArray(partial.localPackages)
      ? base.localPackages.map((row, index) => ({ ...row, ...(partial.localPackages[index] || {}) }))
      : base.localPackages,
    outstationPackages: Array.isArray(partial.outstationPackages)
      ? base.outstationPackages.map((row, index) => ({ ...row, ...(partial.outstationPackages[index] || {}) }))
      : base.outstationPackages,
    oneWaySlabs: Array.isArray(partial.oneWaySlabs)
      ? base.oneWaySlabs.map((row, index) => ({ ...row, ...(partial.oneWaySlabs[index] || {}) }))
      : base.oneWaySlabs,
    tariffTerms: Array.isArray(partial.tariffTerms) ? partial.tariffTerms.map(String) : base.tariffTerms,
    extras: Array.isArray(partial.extras) ? partial.extras.map(String) : base.extras,
    fareNotice: String(partial.fareNotice || base.fareNotice),
    pages: { ...base.pages, ...(partial.pages || {}) },
    offers: Array.isArray(partial.offers)
      ? partial.offers.map(normalizeOffer).filter((offer) => offer.title)
      : base.offers,
  };
  delete next.offer;
  return next;
}

export function todayIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export function normalizeOffer(row = {}) {
  return {
    title: String(row.title || "").trim(),
    message: String(row.message || "").trim(),
    discountPercent: Math.min(80, Math.max(0, Number(row.discountPercent) || 0)),
    startDate: String(row.startDate || "").trim(),
    endDate: String(row.endDate || "").trim(),
    visible: row.visible !== false,
  };
}

export function activeOffer(site, onDate) {
  const date = onDate && /^\d{4}-\d{2}-\d{2}$/.test(onDate) ? onDate : todayIndia();
  const offers = Array.isArray(mergeSite(site).offers) ? mergeSite(site).offers : [];
  return offers.find((offer) => {
    if (!offer.visible || !offer.title) return false;
    const start = offer.startDate || "0000-01-01";
    const end = offer.endDate || "9999-12-31";
    return date >= start && date <= end;
  }) || null;
}

export function applyOffer(fare, site, onDate) {
  const offer = activeOffer(site, onDate);
  if (!fare || !offer) return fare;
  const pct = Number(offer.discountPercent) || 0;
  if (!pct || !fare.total || fare.lines?.some((line) => /offer/i.test(line.label))) {
    return { ...fare, offer };
  }
  const cut = Math.round(Number(fare.total) * pct / 100);
  return {
    ...fare,
    total: Math.max(0, Number(fare.total) - cut),
    offer,
    lines: [...(fare.lines || []), { label: `${offer.title} (${pct}% off)`, value: `−${inr(cut)}` }],
  };
}

export function inr(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

export function advanceDue(fare) {
  return Math.max(1, Math.round(Number(fare || 0) * COMPANY.advancePercent / 100));
}

export function balanceDue(fare) {
  return Math.max(0, Number(fare || 0) - advanceDue(fare));
}

export function amountDueNow(fare, choice) {
  return choice === "full" ? Math.max(1, Number(fare || 0)) : advanceDue(fare);
}

export function paymentModeLabel(booking) {
  if (booking.payment_choice === "cash" || booking.payment_status === "cash") return "Cash / offline (pay at trip)";
  if (booking.payment_choice === "full") return "Online — full fare";
  return "Online — 25% now, balance later";
}

export function invoicePaid(booking) {
  if (booking.payment_status === "paid") return Number(booking.fare || 0);
  if (booking.payment_status === "advance") return Number(booking.amount_paid || advanceDue(booking.fare));
  if (booking.payment_choice === "cash" || booking.payment_status === "cash") return Number(booking.amount_paid || 0);
  return Number(booking.amount_paid || 0);
}

export function invoiceBalance(booking) {
  return Math.max(0, Number(booking.fare || 0) - invoicePaid(booking));
}

export function invoiceText(booking, company = COMPANY) {
  const trip = tripById(booking.trip_type)?.label || booking.trip_type;
  const vehicle = vehicleById(booking.vehicle_type)?.name || booking.vehicle_type;
  const paid = invoicePaid(booking);
  const due = invoiceBalance(booking);
  const lines = [
    `${company.shortName || company.name} — INVOICE`,
    `Invoice / Booking: ${booking.booking_id}`,
    `Status: ${booking.booking_status || "requested"}`,
    "",
    `Customer: ${booking.customer_name}`,
    `Mobile: ${booking.mobile}`,
    `Trip: ${trip}`,
    `Vehicle: ${vehicle}`,
    `Start point: ${booking.pickup}`,
    `Drop point: ${booking.drop_location}`,
    `Date & time: ${booking.trip_date} ${booking.trip_time}`,
    "",
    "FARE",
  ];
  const fareLines = Array.isArray(booking.fare_lines) ? booking.fare_lines : [];
  if (fareLines.length) {
    fareLines.forEach((line) => lines.push(`${line.label}: ${line.value}`));
  }
  lines.push(`Total fare: ${inr(booking.fare)}`);
  lines.push("");
  lines.push("PAYMENT");
  lines.push(`Mode: ${paymentModeLabel(booking)}`);
  lines.push(`Paid now: ${inr(paid)}`);
  lines.push(`Balance to pay: ${inr(due)}`);
  if (booking.payment_choice === "cash" || booking.payment_status === "cash") {
    lines.push("Pay the balance in cash at the trip. This WhatsApp message is your confirmation invoice.");
  } else if (due > 0) {
    lines.push("Online part received. Pay the remaining balance later / at drop.");
  } else {
    lines.push("Online payment complete. This WhatsApp message is your confirmation invoice.");
  }
  if (booking.driver_name || booking.vehicle_number) {
    lines.push("");
    lines.push(`Driver: ${booking.driver_name || "—"}`);
    lines.push(`Car: ${booking.vehicle_number || "—"}`);
    if (booking.driver_mobile) lines.push(`Driver mobile: ${booking.driver_mobile}`);
  }
  lines.push("");
  lines.push("Toll, parking and permit are extra if they apply.");
  lines.push(`Office: ${formatPhone(company.phone || company.whatsapp)}`);
  if (company.address) lines.push(company.address);
  return lines.join("\n");
}

export function gstApplies(company) {
  return Boolean(company?.gstEnabled) && Number(company?.gstPercent) > 0;
}

export function invoiceTax(fare, companyOrPercent = 0) {
  const total = Math.max(0, Number(fare || 0));
  const pct = typeof companyOrPercent === "object"
    ? (gstApplies(companyOrPercent) ? Number(companyOrPercent.gstPercent) : 0)
    : Math.max(0, Number(companyOrPercent) || 0);
  if (!pct) return { taxable: total, gst: 0, cgst: 0, sgst: 0, total, percent: 0 };
  const taxable = Math.round((total * 100) / (100 + pct));
  const gst = total - taxable;
  const cgst = Math.round(gst / 2);
  const sgst = gst - cgst;
  return { taxable, gst, cgst, sgst, total, percent: pct };
}

export function invoiceWhatsAppUrl(booking, toMobile, company = COMPANY, pageUrl = "") {
  const phone = String(toMobile || company.whatsapp || "").replace(/\D/g, "");
  const paid = invoicePaid(booking);
  const due = invoiceBalance(booking);
  const text = [
    `${company.shortName || company.name} ${gstApplies(company) ? "TAX INVOICE" : "INVOICE"}`,
    `Invoice: ${booking.booking_id}`,
    pageUrl ? `Download PDF: ${pageUrl}` : "Open the invoice page and download the PDF.",
    `Vehicle: ${vehicleById(booking.vehicle_type)?.name || booking.vehicle_type}`,
    booking.distance_km ? `Distance: ${booking.distance_km} km` : "",
    `Total${gstApplies(company) ? " (GST inclusive)" : ""}: ${inr(booking.fare)}`,
    `Paid: ${inr(paid)}`,
    `Balance: ${inr(due)}`,
    paymentModeLabel(booking),
    booking.razorpay_payment_id ? `Razorpay payment: ${booking.razorpay_payment_id}` : "",
  ].filter(Boolean).join("\n");
  return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
}

export function bookingWhatsAppText(booking) {
  const trip = tripById(booking.trip_type)?.label || booking.trip_type;
  const vehicle = vehicleById(booking.vehicle_type)?.name || booking.vehicle_type;
  const lines = [
    `Jayalakshmi Cabs booking ${booking.booking_id}`,
    `Name: ${booking.customer_name}`,
    `Mobile: ${booking.mobile}`,
    `Trip: ${trip} · ${vehicle}`,
    `Pickup: ${booking.pickup}`,
    `Drop: ${booking.drop_location}`,
    `When: ${booking.trip_date} ${booking.trip_time}`,
    `Fare: ${inr(booking.fare)}`,
    `Payment: ${booking.payment_status || ""} · paid ${inr(booking.amount_paid || 0)}`,
  ];
  if (booking.driver_name || booking.vehicle_number) {
    lines.push(`Driver: ${booking.driver_name || "—"}`);
    lines.push(`Car: ${booking.vehicle_number || "—"}`);
    if (booking.driver_mobile) lines.push(`Driver mobile: ${booking.driver_mobile}`);
  }
  return lines.join("\n");
}

export function greetingWhatsAppUrl(company = COMPANY) {
  const phone = String(company.whatsapp || COMPANY.whatsapp || "").replace(/\D/g, "");
  const text = String(company.whatsappGreeting || COMPANY.whatsappGreeting || "").trim();
  const url = `https://wa.me/91${phone}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}

export function officeWhatsAppUrl(booking) {
  return `https://wa.me/91${COMPANY.whatsapp}?text=${encodeURIComponent(bookingWhatsAppText(booking))}`;
}

export function customerWhatsAppUrl(booking, extra = "") {
  const text = extra ? `${bookingWhatsAppText(booking)}\n${extra}` : bookingWhatsAppText(booking);
  return `https://wa.me/91${booking.mobile}?text=${encodeURIComponent(text)}`;
}

export function vehicleById(id, vehicles = VEHICLES) {
  if (id === "ertiga") return vehicles.find((v) => v.id === "suv") || null;
  return vehicles.find((v) => v.id === id) || null;
}

export function tripById(id) {
  return TRIPS.find((t) => t.id === id) || null;
}

export function normalizeVehicle(id) {
  const value = String(id || "").toLowerCase().trim();
  if (value === "ertiga") return "suv";
  if (["sedan", "suv", "muv", "crysta"].includes(value)) return value;
  return "sedan";
}

export const POPULAR_ROUTES = [
  { from: "Dharmapuri", to: "Hogenakkal Falls", km: 46 },
  { from: "Dharmapuri", to: "Yercaud", km: 98 },
  { from: "Dharmapuri", to: "Kolli Hills", km: 108 },
  { from: "Dharmapuri", to: "Tiruvannamalai", km: 118 },
  { from: "Dharmapuri", to: "Kanchipuram", km: 208 },
  { from: "Dharmapuri", to: "Tirupati", km: 218 },
  { from: "Dharmapuri", to: "Pondicherry", km: 232 },
  { from: "Dharmapuri", to: "Kodaikanal", km: 248 },
  { from: "Dharmapuri", to: "Ooty", km: 268 },
];

export function popularRouteKm(from, to) {
  const a = String(from || "").toLowerCase();
  const b = String(to || "").toLowerCase();
  return POPULAR_ROUTES.find((row) => row.from.toLowerCase() === a && row.to.toLowerCase() === b)?.km || null;
}

export function listedDropFare(km, vehicleId = "sedan", site) {
  return computeFare({ tripType: "one_way", vehicleId, km, site }).total;
}

export function packageClass(vehicleId) {
  return vehicleId === "sedan" ? "sedan" : "muv";
}

export function localPackage(hours, packs = LOCAL_PACKAGES) {
  const h = Math.min(15, Math.max(2, Math.round(Number(hours) || 2)));
  return packs.find((row) => row.hours === h) || packs[0];
}

export function outstationPackage(hours, packs = OUTSTATION_PACKAGES) {
  return Number(hours) <= 6 ? packs[0] : packs[1];
}

function mentionsKarnataka(...places) {
  return places.some((place) => /karnataka|bengaluru|bangalore|mysuru|mysore/i.test(String(place || "")));
}

export function normalizeTime(time) {
  const raw = String(time || "").trim();
  const ampm = /^(1[0-2]|0?\d):([0-5]\d)(?::[0-5]\d)?\s*([ap]m)$/i.exec(raw);
  if (ampm) {
    let hour = Number(ampm[1]) % 12;
    if (/pm/i.test(ampm[3])) hour += 12;
    return `${String(hour).padStart(2, "0")}:${ampm[2]}`;
  }
  const match = /^(\d{1,2}):([0-5]\d)/.exec(raw);
  if (!match) return "";
  return `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`;
}

export function isNightStart(time, charges = CHARGES) {
  const normalized = normalizeTime(time);
  if (!normalized) return false;
  const hour = Number(normalized.slice(0, 2));
  const minute = Number(normalized.slice(3, 5) || 0);
  const mins = hour * 60 + minute;
  return mins >= Number(charges.nightFrom) * 60 || mins <= Number(charges.nightTo) * 60;
}

export function withNightCharge(quote, tripType, tripTime, site) {
  const charges = mergeSite(site).charges;
  if (!quote || !isNightStart(tripTime, charges)) return quote;
  if (quote.lines?.some((line) => /night/i.test(line.label))) return quote;
  return {
    ...quote,
    fare: Number(quote.fare || 0) + Number(charges.nightCharge),
    lines: [...(quote.lines || []), { label: "Night charge (11 pm – 5 am)", value: inr(charges.nightCharge) }],
  };
}

/**
 * Fare is calculated on the server from the road distance.
 * The browser uses the same function only to explain the tariff.
 */
function addNightIfNeeded(fare, trip_time, charges) {
  if (!fare || !isNightStart(trip_time, charges)) return fare;
  if (fare.lines?.some((line) => /night/i.test(line.label))) return fare;
  return {
    ...fare,
    total: Number(fare.total || 0) + Number(charges.nightCharge),
    lines: [...(fare.lines || []), { label: "Night charge (11 pm – 5 am)", value: inr(charges.nightCharge) }],
  };
}

export function normalizeDays(value) {
  const days = Math.round(Number(value) || 1);
  return Math.min(30, Math.max(1, days));
}

export function computeFare({ tripType, vehicleId, km, hours, days, pickup, drop_location, trip_time, trip_date, site }) {
  const live = mergeSite(site);
  const charges = live.charges;
  const vehicle = vehicleById(vehicleId, live.vehicles);
  const trip = tripById(tripType);
  const done = (fare) => applyOffer(fare, live, trip_date);
  if (!vehicle || !trip) return { total: 0, lines: [], billedKm: 0 };
  const cls = packageClass(vehicle.id);
  const lines = [];
  const distance = Math.max(0, Math.round(Number(km) || 0));
  const tripDays = tripType === "round" ? normalizeDays(days) : 1;

  if (tripType === "hourly") {
    const pack = localPackage(hours, live.localPackages);
    const total = pack[cls];
    lines.push({ label: `${pack.hours} hrs & ${pack.km} km local package`, value: inr(total) });
    lines.push({ label: "Extra hour", value: `${inr(charges.localExtraHour[cls])}/hr` });
    lines.push({ label: "Extra km", value: `${inr(charges.localExtraKm[cls])}/km` });
    return done(addNightIfNeeded({ total, lines, billedKm: pack.km, hours: pack.hours }, trip_time, charges));
  }

  if (tripType === "outstation") {
    const pack = outstationPackage(hours, live.outstationPackages);
    const total = pack[cls];
    lines.push({ label: pack.label, value: inr(total) });
    lines.push({ label: "Extra hour", value: `${inr(charges.outstationExtraHour[cls])}/hr` });
    lines.push({ label: "Extra km", value: `${inr(charges.outstationExtraKm[cls])}/km` });
    if (distance) lines.push({ label: "Road distance so far", value: `${distance} km` });
    return done(addNightIfNeeded({ total, lines, billedKm: pack.km, hours: pack.hours }, trip_time, charges));
  }

  if (!distance) return done({ total: 0, lines: [], billedKm: 0 });

  if (tripType === "one_way") {
    const slab = oneWaySlab(distance, live.oneWaySlabs || ONE_WAY_SLABS);
    if (slab) {
      const amount = Number(slab[cls] || 0);
      lines.push({ label: slab.label, value: inr(amount) });
      lines.push({ label: "Actual road distance", value: `${distance} km` });
      let total = amount;
      if (isNightStart(trip_time, charges)) {
        lines.push({ label: "Night charge (11 pm – 5 am)", value: inr(charges.nightCharge) });
        total += Number(charges.nightCharge);
      }
      return done({ total, lines, billedKm: distance });
    }
  }

  const rate = tripType === "one_way" ? vehicle.drop : vehicle.round;
  const karnataka = mentionsKarnataka(pickup, drop_location);
  const minPerDay = karnataka ? charges.roundMinKmKarnataka : charges.roundMinKm;
  const minimum = tripType === "one_way" ? 0 : minPerDay * tripDays;
  const travelled = tripType === "one_way" ? distance : distance * 2;
  const billed = Math.max(travelled, minimum);
  const amount = billed * rate;
  const dailyKm = tripDays > 0 ? travelled / tripDays : travelled;
  const bataPerDay = dailyKm > charges.roundBataAfterKm ? charges.roundBataLong : charges.roundBataPerDay;
  const bata = tripType === "one_way"
    ? (distance > charges.driverBataAfterKm ? charges.driverBataLong : charges.driverBata)
    : bataPerDay * tripDays;

  lines.push({ label: `${billed} km × ${inr(rate)}`, value: inr(amount) });
  if (billed > travelled) lines.push({ label: "Actual road distance", value: `${travelled} km` });
  if (tripType === "round") {
    lines.push({ label: "Number of days", value: tripDays === 1 ? "1 day" : `${tripDays} days` });
    lines.push({ label: "Includes return", value: `${distance} km each way` });
    if (karnataka) lines.push({ label: "Karnataka minimum", value: `${charges.roundMinKmKarnataka} km / day` });
    else lines.push({ label: "Minimum km", value: `${charges.roundMinKm} km / day` });
  }
  lines.push({ label: tripType === "round" && tripDays > 1 ? `Driver bata × ${tripDays} days` : "Driver bata", value: inr(bata) });
  let total = amount + bata;
  if (isNightStart(trip_time, charges)) {
    lines.push({ label: "Night charge (11 pm – 5 am)", value: inr(charges.nightCharge) });
    total += Number(charges.nightCharge);
  }
  return done({ total, lines, billedKm: billed, days: tripType === "round" ? tripDays : undefined });
}
