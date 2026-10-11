// 글 파일 경로 → 글 id(주소). content.config.ts와 빌드 검사 스크립트가 같이 쓴다.
// - posts/hello.mdx → hello
// - posts/keyboard-events/index.mdx → keyboard-events
// - posts/_drafts/hello.mdx → hello (초안 폴더 이름은 주소에 붙지 않는다. 밖으로 꺼내도 주소가 같다)

/** 글이 있는 폴더 (저장소 루트 기준) */
export const POSTS_DIR = "src/content/posts";

/** 초안 폴더 (POSTS_DIR 안). 이 안의 글은 커밋되지 않고(.gitignore) 개발 서버에서만 보인다. */
export const DRAFTS_DIR = "_drafts";

/** @param {string} entry POSTS_DIR 기준 상대 경로 */
export function postIdFromEntry(entry) {
  return entry.replace(new RegExp(`^${DRAFTS_DIR}/`), "").replace(/(\/index)?\.mdx$/, "");
}

/** @param {string | undefined} filePath 저장소 루트 기준 글 파일 경로 */
export function isInDrafts(filePath) {
  return filePath?.startsWith(`${POSTS_DIR}/${DRAFTS_DIR}/`) ?? false;
}
