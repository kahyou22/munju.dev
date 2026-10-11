import MoreAnchor from "./MoreAnchor.astro";

// MDX 글에서 import 없이 쓰는 컴포넌트. (글쓰기 컴포넌트와 데모는 옮겨 오는 대로 여기에 더한다)

/** 글 목록 미리보기(excerpt 모듈) */
export const excerptComponents = {};

/** 글 페이지: `more` 자리에 #more 앵커를 둔다. */
export const fullComponents = { PostMore: MoreAnchor };
