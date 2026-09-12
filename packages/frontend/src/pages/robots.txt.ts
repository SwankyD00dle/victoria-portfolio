import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${new URL("/sitemap-index.xml", site || "https://www.victoriatu.info")}\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
