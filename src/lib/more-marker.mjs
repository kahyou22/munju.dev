// 글 페이지에서 미리보기가 끝나는 자리에 #more 앵커(<PostMore />)를 두는 satteri mdast 플러그인.
// 목록에서 "더 읽기"를 누르면 미리보기가 끝난 바로 다음 위치로 이동하게 한다.
// 자리는 목록 미리보기와 같은 규칙(excerpt.mjs)으로 찾는다: `{/* more */}` 표시 자리, 없으면 첫 문단 뒤.
//
// 목록 미리보기 자체는 이 플러그인이 아니라 excerpt-vite-plugin이 원본을 잘라서 만든다.
import { findExcerptEnd } from "./excerpt.mjs";
import { EXCERPT_SUFFIX } from "./excerpt-vite-plugin.mjs";

/** @type {import("satteri").MdastPluginInstance & { name: string }} */
export const moreMarkerPlugin = {
  name: "munju-more-marker",
  after(root, ctx) {
    if (ctx.sourceFormat !== "mdx") return;
    const path = ctx.fileURL?.pathname ?? "";
    // 글(src/content/posts)에만 적용한다. 미리보기 모듈에는 앵커가 필요 없다.
    if (!path.includes("/src/content/posts/") || path.endsWith(EXCERPT_SUFFIX)) return;

    const anchor = { type: "mdxJsxFlowElement", name: "PostMore", attributes: [], children: [] };
    const end = findExcerptEnd(root.children);
    if (!end) return;
    if (end.marker) ctx.replaceNode(end.node, anchor);
    else ctx.insertAfter(end.node, anchor);
  },
};
