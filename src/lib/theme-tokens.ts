// 테마마다 다른 값 중, 이미지에도 구워야 하는 것들을 CSS 변수로 만든다. (색은 palette.ts, 그림은 rough-images.ts)
// /theme-tokens.css로 내보내서 브라우저가 한 번 받아 두고 페이지마다 다시 받지 않는다. (src/pages/theme-tokens.css.ts)
// - --color-bg, --callout-*-bg: 바탕색. 밑줄 덮개에 같은 색을 구워야 해서 palette.ts에서 온다.
// - --link-draw / --nav-draw: 마우스를 올리면 그려지는 링크·메뉴 밑줄
// - --dust-cover-*: 밑줄을 가리는 덮개. 바탕(페이지, 콜아웃 세 종류)마다 하나씩
// - --menu-cursor: 게임 메뉴처럼 고른 항목 옆에 나타나는 손그림 ▶ (menu-cursor.css)
import { createHash } from "node:crypto";
import { palette, type ThemeColors } from "./palette";
import { DUST_EDGE, dustCover, handLine, menuCursor } from "./rough-images";

function tokens(theme: ThemeColors) {
  return [
    `--color-bg: ${theme.bg};`,
    ...Object.entries(theme.callout).map(([type, color]) => `--callout-${type}-bg: ${color};`),
    `--link-draw: ${handLine({ seed: "link-draw", color: theme.link, width: 1200 })};`,
    `--nav-draw: ${handLine({ seed: "nav-draw", color: theme.highlight, width: 1200 })};`,
    `--menu-cursor: ${menuCursor({ seed: "menu-cursor", fill: theme.highlight, line: theme.highlightLine })};`,
    `--dust-cover-page: ${dustCover(theme.bg)};`,
    ...Object.entries(theme.callout).map(([type, color]) => `--dust-cover-${type}: ${dustCover(color)};`),
  ].join("\n");
}

/** 테마와 상관없이 이미지 크기에 맞춰야 하는 값. (underline.css) */
const sizes = [`--dust-edge: ${DUST_EDGE}px;`].join("\n");

let css: string | undefined;

export function themeTokensCss(): string {
  css ??= `:root {\n${sizes}\n${tokens(palette.light)}\n}\n:root[data-theme="dark"] {\n${tokens(palette.dark)}\n}\n`;
  return css;
}

/** 내용이 바뀌면 주소도 바뀌게 붙이는 짧은 해시. 브라우저가 옛 파일을 계속 쓰지 않게 한다. */
export function themeTokensVersion(): string {
  return createHash("sha256").update(themeTokensCss()).digest("hex").slice(0, 10);
}
