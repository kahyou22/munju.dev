import { getCollection, type CollectionEntry } from "astro:content";
import { isInDrafts } from "./post-id.mjs";

export type Post = CollectionEntry<"posts">;

/**
 * 페이지를 만드는 모든 글. 최신 글이 앞에 온다. 같은 날짜면 id 순이라 빌드할 때마다 순서가 같다.
 * (같은 날 여러 글을 쓰면 date에 시간까지 적으면 시간 순이 된다)
 * 초안(`draft: true`나 초안 폴더의 글)은 개발 서버에서만 보이고, 일부 공개 글은 들어간다.
 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("posts", ({ data, filePath }) => import.meta.env.DEV || !(data.draft || isInDrafts(filePath)));
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id));
}

/** 목록·태그 페이지에 보이는 글. 일부 공개(unlisted) 글은 빠진다. */
export async function getListedPosts(): Promise<Post[]> {
  return (await getPosts()).filter((post) => !post.data.unlisted);
}

/**
 * 날짜를 한국 시간 기준으로 쓴다. 빌드하는 컴퓨터의 시간대에 따라 하루 밀리지 않게 한다.
 * - long: 2026년 10월 11일 (화면)
 * - dots: 2026.10.11 (공유 미리보기 이미지)
 */
export function formatDate(date: Date, style: "long" | "dots" = "long"): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", year: "numeric", month: "numeric", day: "numeric" })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return style === "dots" ? `${parts.year}.${parts.month.padStart(2, "0")}.${parts.day.padStart(2, "0")}` : `${parts.year}년 ${parts.month}월 ${parts.day}일`;
}

let tagSet: Promise<Set<string>> | undefined;

/**
 * 태그 페이지가 있는 태그들. (목록에 보이는 글의 태그) 글마다 다시 세지 않게, 빌드할 때는 한 번만 센다.
 * 개발 서버에서는 글을 고치면 바로 반영되도록 매번 센다.
 */
export function tagsWithPage(): Promise<Set<string>> {
  const count = async () => new Set((await getListedPosts()).flatMap((post) => post.data.tags));
  if (import.meta.env.DEV) return count();
  tagSet ??= count();
  return tagSet;
}

/** 목록 한 페이지에 보여줄 글 수. 목록에서는 데모가 실제로 움직여서, 너무 많이 두면 페이지가 무거워진다. */
export const POSTS_PER_PAGE = 5;

export function pageCount(postCount: number): number {
  return Math.max(1, Math.ceil(postCount / POSTS_PER_PAGE));
}

// 사이트 안 주소는 모두 끝에 /를 붙인다. (astro.config.mjs의 trailingSlash: "always")
// 빌드한 페이지가 폴더/index.html이라, /가 없으면 호스팅이 /를 붙인 주소로 한 번 더 보내기 때문이다.

/** 글 주소 */
export function postHref(id: string): string {
  return `/posts/${id}/`;
}

/** 목록 n번째 페이지 주소. 첫 페이지는 홈(/)이다. */
export function pageHref(page: number): string {
  return page === 1 ? "/" : `/page/${page}/`;
}

/** 태그 페이지 주소. 한글 태그도 그대로 쓴다. (/tags/회고) */
export function tagHref(tag: string): string {
  return `/tags/${encodeURIComponent(tag)}/`;
}

/** 태그별 글 목록. 글이 많은 태그가 앞에 오고, 같으면 이름 순이다. */
export function groupByTag(posts: Post[]): { tag: string; posts: Post[] }[] {
  const groups = new Map<string, Post[]>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      const tagged = groups.get(tag);
      if (tagged) tagged.push(post);
      else groups.set(tag, [post]);
    }
  }
  return [...groups]
    .map(([tag, tagged]) => ({ tag, posts: tagged }))
    .sort((a, b) => b.posts.length - a.posts.length || a.tag.localeCompare(b.tag, "ko"));
}
