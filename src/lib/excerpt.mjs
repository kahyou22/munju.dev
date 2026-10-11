// 글에서 "목록 미리보기가 어디서 끝나는지"를 정하는 규칙. 한 곳에만 두고 셋이 같이 쓴다.
// - excerpt-vite-plugin.mjs: 목록용 미리보기 모듈을 이 위치에서 잘라 만든다.
// - more-marker.mjs: 글 페이지의 #more 앵커를 이 위치에 둔다. ("더 읽기"로 들어오는 곳)
// - scripts/check-excerpt-leak.mjs: 이 위치 뒤의 문장이 목록에 새지 않았는지 검사한다.
//
// 규칙: 맨 위 블록 중 `{/* more */}` 표시가 있으면 그 앞까지, 없으면 첫 문단까지.
// 줄 단위로 찾지 않고 MDX를 실제로 파싱해서 찾으므로, 코드 블록 안의 `{/* more */}`나
// 컴포넌트·목록으로 시작하는 글에서도 두 쪽이 어긋나지 않는다.
import { mdxToMdast } from "satteri";

const MORE_MARKER = /^\/\*\s*more\s*\*\/$/;

/**
 * 맨 위 블록(mdast root의 children)에서 미리보기가 끝나는 블록을 찾는다.
 * - marker: true면 그 블록(`{/* more *\/}` 표시) 앞에서 끝난다.
 * - marker: false면 그 블록(첫 문단)까지 미리보기다.
 */
export function findExcerptEnd(children) {
  const marker = children.find((node) => node.type === "mdxFlowExpression" && MORE_MARKER.test(node.value.trim()));
  if (marker) return { node: marker, marker: true };
  const paragraph = children.find((node) => node.type === "paragraph");
  return paragraph ? { node: paragraph, marker: false } : null;
}

/** 원본 MDX 소스에서 미리보기 부분만 남긴다. frontmatter와 그 앞의 import는 그대로 남는다. */
export function sliceExcerpt(source) {
  const end = findExcerptEnd(mdxToMdast(source).children);
  if (!end) return source;
  const { start, end: stop } = end.node.position;
  return source.slice(0, end.marker ? start.offset : stop.offset) + "\n";
}
