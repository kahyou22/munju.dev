// 빌드할 때 이미지에 구워 넣어야 하는 색. (손그림 밑줄·형광펜·먼지 덮개, 공유 미리보기 이미지)
// 이미지에는 CSS 변수를 쓸 수 없어서, 이 색들은 여기 한곳에 두고 CSS 변수로도 내보낸다. (theme-tokens.ts)
// 나머지 색은 global.css에 있다.

/** base 위에 color를 alpha만큼 겹친 불투명한 색 */
function over(color: string, alpha: number, base: string): string {
  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [c, b] = [rgb(color), rgb(base)];
  return `#${c.map((v, i) => Math.round(b[i] + (v - b[i]) * alpha).toString(16).padStart(2, "0")).join("")}`;
}

const LIGHT_BG = "#ffffff";
const DARK_BG = "#383637";

export const palette = {
  light: {
    /** 페이지 바탕 (--color-bg) */
    bg: LIGHT_BG,
    /** 콜아웃 바탕. 안쪽 링크의 밑줄 덮개도 같은 색이어야 해서 불투명한 색을 쓴다. */
    callout: { note: "#eef2fa", tip: "#ecf5f3", warn: "#fdeeed" },
    link: "#4f6ca8",
    accent: "#7491c8",
    highlight: "#f09a95",
    highlightLine: "#e0807a",
    title: "#383637",
    muted: "#706f88",
    markOpacity: 0.42,
  },
  dark: {
    bg: DARK_BG,
    callout: {
      note: over("#7491c8", 0.16, DARK_BG),
      tip: over("#8fd3cf", 0.12, DARK_BG),
      warn: over("#fda9a6", 0.12, DARK_BG),
    },
    link: "#76b3fe",
    accent: "#7491c8",
    highlight: "#fda9a6",
    highlightLine: "#f4928e",
    title: "#fefefe",
    muted: "#a9a7b5",
    markOpacity: 0.32,
  },
} as const;

export type ThemeColors = (typeof palette)["light" | "dark"];
