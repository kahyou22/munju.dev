// 테마마다 다른 값 중, 이미지에도 구워야 하는 것들을 CSS 변수로 만든다. (색은 palette.ts)
// /theme-tokens.css로 내보내서 브라우저가 한 번 받아 두고 페이지마다 다시 받지 않는다. (src/pages/theme-tokens.css.ts)
// - --color-bg, --callout-*-bg: 바탕색
import { createHash } from "node:crypto";
import { palette, type ThemeColors } from "./palette";

function tokens(theme: ThemeColors) {
  return [`--color-bg: ${theme.bg};`, ...Object.entries(theme.callout).map(([type, color]) => `--callout-${type}-bg: ${color};`)].join("\n");
}

let css: string | undefined;

export function themeTokensCss(): string {
  css ??= `:root {\n${tokens(palette.light)}\n}\n:root[data-theme="dark"] {\n${tokens(palette.dark)}\n}\n`;
  return css;
}

/** 내용이 바뀌면 주소도 바뀌게 붙이는 짧은 해시. 브라우저가 옛 파일을 계속 쓰지 않게 한다. */
export function themeTokensVersion(): string {
  return createHash("sha256").update(themeTokensCss()).digest("hex").slice(0, 10);
}
