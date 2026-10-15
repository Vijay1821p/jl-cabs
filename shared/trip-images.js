/**
 * Popular-trip photos live in client/public/trips/.
 * Use the file name here. The admin panel can pick one of these.
 */
export const TRIP_IMAGES = [
    { id: "chennai", file: "/trips/chennai.jpg", label: "Chennai" },
  { id: "bengaluru", file: "/trips/bengaluru.jpg", label: "Bengaluru" },
  { id: "tirupati", file: "/trips/tirupati.jpg", label: "Tirupati" },
  { id: "salem", file: "/trips/salem.jpg", label: "Salem" },
  { id: "coimbatore", file: "/trips/coimbatore.jpg", label: "Coimbatore" },
  { id: "madurai", file: "/trips/madurai.jpg", label: "Madurai" },
  { id: "hosur", file: "/trips/hosur.jpg", label: "Hosur" },
  { id: "krishnagiri", file: "/trips/krishnagiri.jpg", label: "Krishnagiri" },
  { id: "pondicherry", file: "/trips/pondicherry.jpg", label: "Pondicherry" },
];

export function tripImageSrc(value) {
  if (!value) return "/trips/chennai.jpg";
  if (value.startsWith("http")) return value;
  if (value.startsWith("/")) return value.replace(/\.svg$/, ".jpg");
  const match = TRIP_IMAGES.find((item) => item.id === value || item.file.endsWith(`/${value}`));
  return match?.file || "/trips/chennai.jpg";
}

/** Smaller WebP twin of a /trips/*.jpg photo (generated next to the JPG), or "" for other sources. */
export function tripImageWebp(src) {
  return typeof src === "string" && /^\/trips\/[^/]+\.jpg$/.test(src) ? src.replace(/\.jpg$/, ".webp") : "";
}

export function imageForPlace(place) {
  const key = String(place || "").toLowerCase().replace(/\s+/g, "");
  const aliases = {
    hogenakkalfalls: "salem",
    yercaud: "salem",
    kollihills: "salem",
    tiruvannamalai: "tirupati",
    kanchipuram: "chennai",
    mahabalipuram: "chennai",
    ooty: "coimbatore",
    kodaikanal: "madurai",
    pondicherry: "pondicherry",
  };
  const id = aliases[key] || key;
  return TRIP_IMAGES.find((item) => item.id === id)?.file || "/trips/chennai.jpg";
}
