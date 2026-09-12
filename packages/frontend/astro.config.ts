import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.SITE_URL || "https://www.victoriatu.info",
  output: "static",
  trailingSlash: "never",
  integrations: [
    react(),
    sitemap({ filter: (page) => !page.endsWith("/admin") && !page.endsWith("/p/integro") }),
  ],
  vite: { plugins: [tailwindcss()] },
});
