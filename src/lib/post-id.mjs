// 글 파일 경로 → 글 id(주소). content.config.ts와 빌드 검사 스크립트가 같이 쓴다.
// - posts/hello.mdx → hello
// - posts/keyboard-events/index.mdx → keyboard-events

/** 글이 있는 폴더 (저장소 루트 기준) */
export const POSTS_DIR = "src/content/posts";

/** @param {string} entry POSTS_DIR 기준 상대 경로 */
export function postIdFromEntry(entry) {
  return entry.replace(/(\/index)?\.mdx$/, "");
}
