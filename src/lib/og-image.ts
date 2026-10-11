// 링크를 공유할 때 보이는 미리보기 이미지(1200×630). 빌드할 때 글마다 만든다. (src/pages/og)
// 블로그처럼 흰 종이 가운데에 제목을 쓰고, 양옆에 반짝이 바탕(왼쪽 블루, 오른쪽 레드)을 깐다.
// satori로 글자를 도형으로 바꾼 SVG를 만들고, sharp로 PNG로 굽는다. 그래서 서버에 글꼴이 없어도 된다.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import sharp from "sharp";
import { paperSparklesSvg, SPARKLES_HEIGHT, SPARKLES_WIDTH } from "./paper-sparkles";
import { logoDot as logoDotPaths } from "./logo";
import { palette } from "./palette";
import { roughCurve } from "./rough";
import { SITE_TITLE } from "./site";

const WIDTH = 1200;
const HEIGHT = 630;
/** 양옆 반짝이 띠의 폭 */
const BAND = 210;

// 공유 이미지는 밝은 테마로 그린다.
const COLORS = {
  bg: palette.light.bg,
  title: palette.light.title,
  muted: palette.light.muted,
  dot: palette.light.highlight,
  underline: palette.light.accent,
  // 화면보다 작게 보이니 블로그 바탕보다 조금 진하게
  sparkleLeft: "#d3dcef",
  sparkleRight: "#f3d2cf",
};

const require = createRequire(import.meta.url);
const pretendard = (weight: string) => readFile(require.resolve(`pretendard/dist/public/static/Pretendard-${weight}.otf`));

let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 600 | 700 }[]> | undefined;
function loadFonts() {
  fonts ??= Promise.all([
    pretendard("Medium").then((data) => ({ name: "Pretendard", data, weight: 500 as const })),
    pretendard("SemiBold").then((data) => ({ name: "Pretendard", data, weight: 600 as const })),
    pretendard("Bold").then((data) => ({ name: "Pretendard", data, weight: 700 as const })),
  ]);
  return fonts;
}

const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

function logoDot(): string {
  const { fills, strokes } = logoDotPaths(12);
  const body = [...fills.map((d) => `<path d="${d}" fill="${COLORS.dot}"/>`), ...strokes.map((d) => `<path d="${d}" fill="none" stroke="${COLORS.dot}" stroke-width="1.5"/>`)].join("");
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${body}</svg>`);
}

function underline(seed: string): string {
  const strokes = roughCurve(
    [
      [2, 8],
      [90, 6],
      [180, 9],
      [270, 7],
      [318, 8],
    ],
    `og-underline:${seed}`,
    { roughness: 0.8, bowing: 0.6, maxRandomnessOffset: 1 },
  );
  const body = strokes.map((d) => `<path d="${d}" fill="none" stroke="${COLORS.underline}" stroke-width="3.2" stroke-linecap="round" opacity="0.85"/>`).join("");
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="16" viewBox="0 0 320 16">${body}</svg>`);
}

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

/** 한쪽 반짝이 띠. 오른쪽 띠는 같은 그림을 좌우로 뒤집는다. */
function band(side: "left" | "right"): Node[] {
  const src = svgUri(paperSparklesSvg(side === "left" ? COLORS.sparkleLeft : COLORS.sparkleRight));
  const left = side === "left" ? BAND - SPARKLES_WIDTH : WIDTH - BAND;
  return [0, SPARKLES_HEIGHT].map((top) =>
    h("img", { position: "absolute", left, top, width: SPARKLES_WIDTH, height: SPARKLES_HEIGHT, transform: side === "right" ? "scaleX(-1)" : undefined }, undefined, {
      src,
      width: SPARKLES_WIDTH,
      height: SPARKLES_HEIGHT,
    }),
  );
}

export interface OgImageOptions {
  title: string;
  /** 제목 아래 줄. 글이면 날짜와 태그 */
  meta?: string;
  seed: string;
}

export async function renderOgImage({ title, meta, seed }: OgImageOptions): Promise<Uint8Array<ArrayBuffer>> {
  const tree = h("div", { position: "relative", display: "flex", width: WIDTH, height: HEIGHT, background: COLORS.bg, fontFamily: "Pretendard" }, [
    ...band("left"),
    ...band("right"),
    h(
      "div",
      {
        position: "absolute",
        left: BAND + 30,
        right: BAND + 30,
        top: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 0 60px",
      },
      [
        h("div", { display: "flex", alignItems: "center", gap: 12, fontSize: 30, fontWeight: 600, color: COLORS.title }, [
          h("img", { width: 24, height: 24 }, undefined, { src: logoDot(), width: 24, height: 24 }),
          SITE_TITLE,
        ]),
        h("div", { display: "flex", flexDirection: "column", gap: 18 }, [
          h("div", { fontSize: 58, fontWeight: 700, lineHeight: 1.32, letterSpacing: "-0.02em", color: COLORS.title, wordBreak: "keep-all", textWrap: "balance", lineClamp: 3, display: "block" }, title),
          h("img", { width: 320, height: 16 }, undefined, { src: underline(seed), width: 320, height: 16 }),
        ]),
        h("div", { display: "flex", fontSize: 26, fontWeight: 500, color: COLORS.muted, minHeight: 32 }, meta ?? ""),
      ],
    ),
  ]);

  const svg = await satori(tree as never, { width: WIDTH, height: HEIGHT, fonts: await loadFonts() });
  return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer());
}
