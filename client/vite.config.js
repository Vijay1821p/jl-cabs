import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const MAPS_KEY_NAMES = [
  "VITE_GOOGLE_MAPS_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "GOOGLE_MAP_API_KEY",
  "MAPS_API_KEY",
  "MAP_API_KEY",
];

function mapsKey(mode) {
  const fileEnv = loadEnv(mode, process.cwd(), "");
  for (const name of MAPS_KEY_NAMES) {
    const value = process.env[name] || fileEnv[name];
    if (value) return value;
  }
  return "";
}

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(mapsKey(mode)),
  },
  server: { port: 5173, proxy: { "/api": process.env.API_PROXY || "http://localhost:3002" } },
}));
