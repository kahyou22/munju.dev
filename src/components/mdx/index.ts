import MoreAnchor from "./MoreAnchor.astro";
import Callout from "../writing/Callout.astro";

// MDX 글에서 import 없이 쓰는 컴포넌트.
const writing = { Callout };

/** 글 목록 미리보기(excerpt 모듈) */
export const excerptComponents = { ...writing };

/** 글 페이지: `more` 자리에 #more 앵커를 둔다. */
export const fullComponents = { ...writing, PostMore: MoreAnchor };
