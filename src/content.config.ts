import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { POSTS_DIR, postIdFromEntry } from "./lib/post-id.mjs";

// 글은 src/content/posts 아래에 둔다.
// - 파일 하나: posts/hello.mdx → /posts/hello/
// - 데모와 함께 폴더로: posts/keyboard-events/index.mdx → /posts/keyboard-events/
const posts = defineCollection({
  loader: glob({
    pattern: "**/*.mdx",
    base: `./${POSTS_DIR}`,
    generateId: ({ entry }) => postIdFromEntry(entry),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    /** 초안: 개발 서버에서만 보이고 빌드한 사이트에는 들어가지 않는다. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
