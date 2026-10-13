import { useSeo } from "./useSeo.js";

export function useTitle(title, description, options = {}) {
  useSeo({
    title,
    description,
    path: options.path || "/",
    noindex: Boolean(options.noindex),
    jsonLd: options.jsonLd || null,
  });
}
