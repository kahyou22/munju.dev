// RSS 피드. 글마다 제목, 한 줄 설명, 날짜, 태그를 싣는다. (본문은 싣지 않는다, 일부 공개 글은 빠진다)
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getListedPosts, postHref } from "../lib/posts";
import { SITE_DESCRIPTION, SITE_TITLE } from "../lib/site";

export const GET: APIRoute = async (context) => {
  const posts = await getListedPosts();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postHref(post.id),
      categories: post.data.tags,
    })),
    customData: "<language>ko</language>",
  });
};
