// rough.js로 손그림 선을 만드는 공통 함수. 서버(빌드)와 브라우저 양쪽에서 쓴다.
// 사이트 전체가 같은 붓질이 되도록 기본값을 한곳에 모았다.
// 같은 seed는 항상 같은 모양이 나온다.
import rough from "roughjs";
import { pick } from "./hand-drawn";

const generator = rough.generator();

export interface RoughPaths {
  fills: string[];
  strokes: string[];
}

export interface RoughOptions {
  /** 선이 얼마나 삐뚤어지는지. 0이면 반듯하다. */
  roughness?: number;
  /** 선이 얼마나 휘는지 */
  bowing?: number;
  /** 흔들림의 최대 크기(px). 작은 요소는 줄인다. */
  maxRandomnessOffset?: number;
  /** 두 번 덧긋지 않고 한 번만 긋기 */
  single?: boolean;
}

/**
 * 자주 쓰는 붓질 묶음. 같은 종류의 요소가 같은 느낌이 되도록 이름으로 골라 쓴다.
 * - chip: 태그·키처럼 작은 알약·칸 (조금 덜 흔들린다)
 * - icon: 작은 선 아이콘 (테마 버튼, 콜아웃 아이콘, 여백 메모 화살표)
 */
export const ROUGH_PRESETS = {
  chip: { roughness: 0.8, maxRandomnessOffset: 1 },
  icon: { roughness: 0.6, maxRandomnessOffset: 0.8 },
} as const satisfies Record<string, RoughOptions>;

export function seedOf(text: string): number {
  return pick(text, 2_147_483_646) + 1;
}

function options(seed: string, opts: RoughOptions, fill = false) {
  return {
    seed: seedOf(seed),
    roughness: opts.roughness ?? 0.85,
    bowing: opts.bowing ?? 0.8,
    maxRandomnessOffset: opts.maxRandomnessOffset ?? 1.6,
    disableMultiStroke: opts.single ?? false,
    // 면은 꽉 채운다. 색은 CSS(--rough-fill)나 그리는 쪽이 정하므로 여기 색은 쓰이지 않는다.
    ...(fill ? { fill: "currentColor", fillStyle: "solid" } : {}),
  };
}

/** 좌표 소수점 자릿수. rough.js는 17자리까지 쓰는데, 화면에서는 2자리면 충분하고 HTML이 절반 가까이 준다. */
const PRECISION = 2;

/**
 * rough.js 그림을 SVG 경로 문자열로 바꾼다. 면(fillPath)과 선을 나눠 돌려준다.
 * generator.toPaths()는 자릿수 옵션을 무시해서, 경로를 직접 만든다.
 */
export function toPaths(drawable: ReturnType<typeof generator.path>): RoughPaths {
  const fills: string[] = [];
  const strokes: string[] = [];
  for (const set of drawable.sets) {
    (set.type === "fillPath" ? fills : strokes).push(generator.opsToPath(set, PRECISION));
  }
  return { fills, strokes };
}

export function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${x + radius} ${y} H${x + w - radius} Q${x + w} ${y} ${x + w} ${y + radius} V${y + h - radius} Q${x + w} ${y + h} ${x + w - radius} ${y + h} H${x + radius} Q${x} ${y + h} ${x} ${y + h - radius} V${y + radius} Q${x} ${y} ${x + radius} ${y} Z`;
}

/** 둥근 사각형 테두리(와 면) */
export function roughBox(
  x: number,
  y: number,
  w: number,
  h: number,
  seed: string,
  opts: RoughOptions & { radius?: number; fill?: boolean } = {},
): RoughPaths {
  return toPaths(generator.path(roundedRectPath(x, y, w, h, opts.radius ?? 8), options(seed, opts, opts.fill)));
}

/** 손으로 그은 직선 */
export function roughLine(x1: number, y1: number, x2: number, y2: number, seed: string, opts: RoughOptions = {}): string[] {
  return toPaths(generator.line(x1, y1, x2, y2, options(seed, opts))).strokes;
}

/** 손으로 그린 타원(과 면) */
export function roughEllipse(cx: number, cy: number, w: number, h: number, seed: string, opts: RoughOptions & { fill?: boolean } = {}): RoughPaths {
  return toPaths(generator.ellipse(cx, cy, w, h, options(seed, opts, opts.fill)));
}

/** 점들을 지나는 손그림 곡선 */
export function roughCurve(points: [number, number][], seed: string, opts: RoughOptions = {}): string[] {
  return toPaths(generator.curve(points, options(seed, opts))).strokes;
}

/** 점들을 차례로 잇는 손그림 꺾은선 */
export function roughLinearPath(points: [number, number][], seed: string, opts: RoughOptions = {}): string[] {
  return toPaths(generator.linearPath(points, options(seed, opts))).strokes;
}

/** 아이콘 같은 임의의 SVG 경로를 손그림으로 다시 그린다. */
export function roughPath(d: string, seed: string, opts: RoughOptions & { fill?: boolean } = {}): RoughPaths {
  return toPaths(generator.path(d, options(seed, opts, opts.fill)));
}
