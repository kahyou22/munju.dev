// 크기가 화면에 따라 바뀌는 요소(태그, 상자, 코드 블록, 인용문 등)에 손그림 장식을 덧그린다. 브라우저에서만 쓴다.
// (구분선은 rough.js가 아니라 SVG 필터로 흔든다. WobbleFilters.astro)
// 요소 크기를 재서 rough.js로 그리고, 요소 안에 <svg class="rough-decor">로 넣는다.
// 색은 CSS 변수(--rough-stroke, --rough-fill)로 정해서 테마를 바꿔도 다시 그릴 필요가 없다.
import { roughBox, roughEllipse, roughLine, type RoughOptions, type RoughPaths } from "./rough";

export type DecorKind = "box" | "left-line" | "bottom-line" | "ellipse";

export interface DecorOptions extends RoughOptions {
  kind: DecorKind;
  seed: string;
  /** box·ellipse의 면도 칠한다. */
  fill?: boolean;
  /** box 모서리 반지름 */
  radius?: number;
  /** 요소 가장자리에서 안쪽(+)이나 바깥(-)으로 띄우는 거리 */
  inset?: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";
/** 흔들린 선이 잘리지 않도록 svg를 요소보다 이만큼 크게 둔다. */
const BLEED = 8;

function paths(group: SVGGElement, list: string[], className: string) {
  group.replaceChildren(
    ...list.map((d) => {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("class", className);
      return path;
    }),
  );
}

/** 종류마다 width × height 요소에 맞는 손그림을 만든다. */
const SHAPES: Record<DecorKind, (width: number, height: number, seed: string, opts: DecorOptions) => RoughPaths> = {
  box: (width, height, seed, opts) => {
    const inset = opts.inset ?? 0;
    return roughBox(inset, inset, width - inset * 2, height - inset * 2, seed, opts);
  },
  ellipse: (width, height, seed, opts) => {
    const inset = opts.inset ?? 0;
    return roughEllipse(width / 2, height / 2, width - inset * 2, height - inset * 2, seed, opts);
  },
  "left-line": (_width, height, seed, opts) => {
    const inset = opts.inset ?? 0;
    return { fills: [], strokes: roughLine(inset, 0, inset, height, seed, opts) };
  },
  "bottom-line": (width, height, seed, opts) => ({ fills: [], strokes: roughLine(0, height - 1, width, height - 1, seed, { ...opts, single: true }) }),
};

/** ResizeObserver가 알려준 요소 크기(테두리 포함). offsetWidth/Height와 같은 값이다. */
export function observedSize(entry: ResizeObserverEntry): { width: number; height: number } {
  const box = entry.borderBoxSize?.[0];
  return box ? { width: Math.round(box.inlineSize), height: Math.round(box.blockSize) } : { width: (entry.target as HTMLElement).offsetWidth, height: (entry.target as HTMLElement).offsetHeight };
}

/** 꿈틀거림에 쓰는 모양 수. 0번이 평소 모양이다. (global.css의 [data-frame]과 .boiling) */
export const BOIL_FRAMES = 4;

/** f번째 모양의 seed. 빌드할 때 미리 그리는 그림(다이어그램 등)도 같은 규칙을 쓴다. */
export function frameSeed(seed: string, frame: number): string {
  return frame === 0 ? seed : `${seed}:boil-${frame}`;
}

/**
 * host 안에 장식 svg를 (다시) 그린다. host 크기에 맞춘다.
 * frames가 1보다 크면 모양을 그만큼 미리 그려 둔다. 조상에 .boiling이 붙으면 CSS가 차례로 보여줘서 꿈틀거린다.
 * size를 넘기면(ResizeObserver가 알려준 크기) 크기를 다시 재지 않는다. 여러 요소를 연달아 그릴 때 레이아웃을 매번 다시 계산하지 않게 하려는 것이다.
 */
export function renderDecor(host: HTMLElement, opts: DecorOptions, frames = 1, size?: { width: number; height: number }) {
  const width = size?.width ?? host.offsetWidth;
  const height = size?.height ?? host.offsetHeight;
  if (!width || !height) return;

  let svg = host.querySelector<SVGSVGElement>(":scope > svg.rough-decor");
  if (!svg) {
    svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "rough-decor");
    svg.setAttribute("aria-hidden", "true");
    host.append(svg);
  }
  svg.setAttribute("viewBox", `${-BLEED} ${-BLEED} ${width + BLEED * 2} ${height + BLEED * 2}`);
  svg.style.cssText = `left:${-BLEED}px;top:${-BLEED}px;width:${width + BLEED * 2}px;height:${height + BLEED * 2}px`;

  // 모양마다 <g data-frame="n"> 안에 면 묶음과 선 묶음을 둔다.
  while (svg.children.length < frames) {
    const frame = document.createElementNS(SVG_NS, "g");
    frame.setAttribute("data-frame", String(svg.children.length));
    frame.append(document.createElementNS(SVG_NS, "g"), document.createElementNS(SVG_NS, "g"));
    svg.append(frame);
  }
  for (let f = 0; f < frames; f++) {
    const [fillGroup, strokeGroup] = svg.children[f].children as unknown as [SVGGElement, SVGGElement];
    const { fills, strokes } = SHAPES[opts.kind](width, height, frameSeed(opts.seed, f), opts);
    paths(fillGroup, fills, "rough-fill");
    paths(strokeGroup, strokes, "rough-stroke");
  }
  host.setAttribute("data-rough-ready", "");
}

/**
 * 요소에 붙일 data-rough-* 속성을 만든다. Astro 컴포넌트에서 `<span {...roughAttrs({ kind: "box", seed })}>`처럼 쓴다.
 * 브라우저의 scripts/rough-decor.ts가 이 속성을 읽어(readDecorOptions) 그린다.
 */
export function roughAttrs(opts: DecorOptions): Record<string, string> {
  const attrs: Record<string, string> = { "data-rough": opts.kind };
  if (opts.fill) attrs["data-rough-fill"] = "";
  attrs["data-rough-seed"] = opts.seed;
  if (opts.radius !== undefined) attrs["data-rough-radius"] = String(opts.radius);
  if (opts.inset !== undefined) attrs["data-rough-inset"] = String(opts.inset);
  if (opts.roughness !== undefined) attrs["data-rough-roughness"] = String(opts.roughness);
  if (opts.maxRandomnessOffset !== undefined) attrs["data-rough-offset"] = String(opts.maxRandomnessOffset);
  return attrs;
}

/** data-rough-* 속성에서 옵션을 읽는다. (roughAttrs의 반대) */
export function readDecorOptions(el: HTMLElement): DecorOptions {
  const { rough: kind, roughSeed, roughFill, roughRadius, roughInset, roughRoughness, roughOffset } = el.dataset;
  return {
    kind: kind as DecorKind,
    seed: roughSeed ?? "rough",
    fill: roughFill !== undefined,
    radius: roughRadius ? Number(roughRadius) : undefined,
    inset: roughInset ? Number(roughInset) : undefined,
    roughness: roughRoughness ? Number(roughRoughness) : undefined,
    maxRandomnessOffset: roughOffset ? Number(roughOffset) : undefined,
  };
}
