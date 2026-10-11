// 코드 하이라이트 테마. 블로그 팔레트(MV에서 뽑은 색)에 맞춰 직접 만든다.
// 라이트는 코드 블록 배경 #f4f5f7, 다크는 #2f2d2e 위에서 읽히도록 진하기를 맞췄다.

/** @param {Record<string, string>} c */
const tokenColors = (c) => [
  { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: c.comment, fontStyle: "italic" } },
  { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: c.punctuation } },
  {
    scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new", "keyword.operator.expression"],
    settings: { foreground: c.keyword },
  },
  { scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"], settings: { foreground: c.string } },
  { scope: ["entity.name.function", "support.function", "meta.function-call", "variable.function"], settings: { foreground: c.function } },
  {
    scope: ["constant.numeric", "constant.language", "constant.character", "support.constant", "variable.other.constant"],
    settings: { foreground: c.constant },
  },
  { scope: ["entity.name.type", "entity.name.class", "support.type", "support.class", "entity.other.inherited-class"], settings: { foreground: c.type } },
  {
    scope: ["entity.name.tag", "entity.other.attribute-name", "support.type.property-name", "meta.object-literal.key", "variable.other.property"],
    settings: { foreground: c.property },
  },
];

/** @type {import("shiki").ThemeRegistration} */
export const latencyLight = {
  name: "munju-latency-light",
  type: "light",
  colors: { "editor.background": "#f4f5f7", "editor.foreground": "#383637" },
  tokenColors: tokenColors({
    comment: "#8e8c9c",
    punctuation: "#787891",
    keyword: "#c2615c",
    string: "#4f6ca8",
    function: "#6a5f9e",
    constant: "#a8475a",
    type: "#2f7f86",
    property: "#5d5b6e",
  }),
};

/** @type {import("shiki").ThemeRegistration} */
export const latencyDark = {
  name: "munju-latency-dark",
  type: "dark",
  colors: { "editor.background": "#2f2d2e", "editor.foreground": "#e6e4ea" },
  tokenColors: tokenColors({
    comment: "#8f8d9b",
    punctuation: "#a9a7b5",
    keyword: "#fda9a6",
    string: "#abc4e3",
    function: "#c8bdf0",
    constant: "#f4b6c2",
    type: "#8fd3cf",
    property: "#d2d6dc",
  }),
};

/** ```ts title="hello.ts"처럼 쓴 파일명을 <pre data-title>로 옮긴다. 코드 블록 위에 이름표로 보인다. (rough-markup.mjs) */
export const codeTitleTransformer = {
  name: "munju-code-title",
  pre(node) {
    const title = this.options.meta?.__raw?.match(/title="([^"]+)"/)?.[1];
    if (title) node.properties["data-title"] = title;
  },
};
