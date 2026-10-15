import { useEffect } from "react";

const SITE = "https://jlcabs.com";
const SITE_NAME = "Jayalakshmi Cabs & Services";
const OG_IMAGE = `${SITE}/logo.png`;

function upsertMeta(selector, attributes) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    document.head.appendChild(tag);
  }
  Object.entries(attributes).forEach(([key, value]) => tag.setAttribute(key, value));
}

function upsertLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!href) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

/**
 * One business JSON-LD block (id "jc-jsonld") lives in index.html and is shared by every page.
 * A page can replace it with richer data; passing nothing leaves the shared block in place,
 * so the business markup is never duplicated or dropped.
 */
function upsertJsonLd(data) {
  if (!data) return;
  const id = "jc-jsonld";
  let tag = document.getElementById(id);
  if (!tag) {
    tag = document.createElement("script");
    tag.id = id;
    tag.type = "application/ld+json";
    document.head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(data);
}

export function canonicalUrl(path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean === "/") return `${SITE}/`;
  return `${SITE}${clean.replace(/\/$/, "")}`;
}

/** Only verified business details from the site itself. Nothing here is invented. */
export function taxiServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "TaxiService"],
    "@id": `${SITE}/#business`,
    name: SITE_NAME,
    alternateName: "Jayalakshmi Cabs",
    url: `${SITE}/`,
    telephone: "+918438905590",
    image: OG_IMAGE,
    logo: OG_IMAGE,
    slogan: "Your Journey, Our Responsibility",
    description: "One-way taxi, round-trip taxi, outstation taxi and hourly rental from Coimbatore, Tamil Nadu. Sedan and MUV / Ertiga cab service.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "184, TN HB Colony, Uppilipalayam, Singanallur",
      addressLocality: "Coimbatore",
      postalCode: "641005",
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    },
    areaServed: [
      { "@type": "City", name: "Coimbatore" },
      { "@type": "State", name: "Tamil Nadu" },
      { "@type": "State", name: "Karnataka" },
      { "@type": "State", name: "Kerala" },
      { "@type": "State", name: "Andhra Pradesh" },
    ],
    sameAs: ["https://www.instagram.com/layalakhmi_cabs"],
  };
}

/** path === null means "no canonical" (used by the 404 page). */
export function useSeo({ title, description, path = "/", noindex = false, jsonLd = null }) {
  const canonical = path === null ? "" : canonicalUrl(path);
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  useEffect(() => {
    document.title = fullTitle;
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: noindex ? "noindex, nofollow" : "index, follow" });
    upsertLink("canonical", canonical);
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical || `${SITE}/` });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: OG_IMAGE });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: "en_IN" });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertJsonLd(jsonLd);
  }, [fullTitle, description, canonical, noindex, JSON.stringify(jsonLd)]);
}
