// 양옆 바탕 무늬. 만드는 방법은 src/lib/paper-sparkles.ts
import type { APIRoute } from "astro";
import { paperSparklesSvg } from "../lib/paper-sparkles";

export const GET: APIRoute = () => new Response(paperSparklesSvg(), { headers: { "Content-Type": "image/svg+xml" } });
