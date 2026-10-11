// 검색 엔진 안내. 사이트맵 주소는 astro.config.mjs의 site를 따른다.
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL("/sitemap-index.xml", site)}\n`, { headers: { "Content-Type": "text/plain" } });
