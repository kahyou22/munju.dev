// 마크다운에서 나온 요소에 손그림 장식(data-rough) 속성을 붙이는 satteri hast 플러그인.
// 실제로 그리는 건 브라우저의 rough-decor 스크립트다. (src/lib/rough-decor.ts)
//
// - 인용문은 왼쪽 막대, 표 칸은 아래 선을 손그림으로 그린다. (가로줄 <hr>은 구분선처럼 SVG 필터로 흔든다)

const short = (text) => text.replace(/\s+/g, " ").trim().slice(0, 80);

/** 요소에 data-rough-* 속성을 붙인다. (hast 속성 이름은 dataRough처럼 쓴다) */
function mark(ctx, node, props) {
  for (const [key, value] of Object.entries(props)) ctx.setProperty(node, key, value);
}

/** @type {import("satteri").HastVisitorInstance & { name: string }} */
export const roughMarkupPlugin = {
  name: "munju-rough-markup",
  element: [
    {
      filter: ["blockquote"],
      visit(node, ctx) {
        mark(ctx, node, { dataRough: "left-line", dataRoughInset: "2", dataRoughSeed: short(ctx.textContent(node)) });
      },
    },
    {
      filter: ["th", "td"],
      visit(node, ctx) {
        mark(ctx, node, { dataRough: "bottom-line", dataRoughSeed: `${node.tagName}:${short(ctx.textContent(node))}:${ctx.indexOf(node)}` });
      },
    },
  ],
};
