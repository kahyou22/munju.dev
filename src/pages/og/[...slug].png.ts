// 공유 미리보기 이미지. /og/site.png(사이트 기본), /og/posts/글.png(글마다)
// 모양은 src/lib/og-image.ts
import type { APIRoute, GetStaticPaths } from "astro";
import { renderOgImage, type OgImageOptions } from "../../lib/og-image";
import { formatDate, getPosts } from "../../lib/posts";
import { SITE_DESCRIPTION } from "../../lib/site";

export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return [
    { params: { slug: "site" }, props: { title: SITE_DESCRIPTION, seed: "site" } },
    ...posts.map((post) => ({
      params: { slug: `posts/${post.id}` },
      props: { title: post.data.title, meta: [formatDate(post.data.date, "dots"), ...post.data.tags].join("  ·  "), seed: post.id },
    })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgImage(props as OgImageOptions);
  return new Response(png, { headers: { "Content-Type": "image/png" } });
};
