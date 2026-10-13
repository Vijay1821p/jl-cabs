import { createContext, useContext, useEffect, useState } from "react";
import { defaultSite, mergeSite } from "@jc/shared";
import { api } from "./api.js";

const SiteContext = createContext({ site: defaultSite(), setSite: () => {} });

export function SiteProvider({ children }) {
  const [site, setSite] = useState(defaultSite());

  useEffect(() => {
    api("/api/site").then((data) => setSite(mergeSite(data))).catch(() => {});
  }, []);

  return <SiteContext.Provider value={{ site, setSite }}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}
