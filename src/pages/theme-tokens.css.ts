// 테마 색과 손그림 이미지 CSS 변수. 만드는 방법은 src/lib/theme-tokens.ts
import type { APIRoute } from "astro";
import { themeTokensCss } from "../lib/theme-tokens";

export const GET: APIRoute = () => new Response(themeTokensCss(), { headers: { "Content-Type": "text/css; charset=utf-8" } });
