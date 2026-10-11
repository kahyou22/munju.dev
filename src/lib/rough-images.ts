// 여러 줄에 걸치는 장식(링크 밑줄, 제목 밑줄, 형광펜)에 쓰는 손그림 이미지. 빌드할 때 rough.js로 만든다.
// 줄마다 따로 칠해야 해서 요소 위에 그림을 얹을 수 없기 때문에, background-image로 쓴다.
import { between } from "./hand-drawn";
import { roughBox, roughCurve, roughPath } from "./rough";

/** SVG를 CSS url()로. 꼭 필요한 글자만 바꿔서(encodeURIComponent보다 30%쯤 짧다) 큰따옴표 안에 넣는다. */
function toUrl(svg: string): string {
  const escaped = svg.replace(/"/g, "'").replace(/%/g, "%25").replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E");
  return `url("data:image/svg+xml,${escaped}")`;
}

function paths(list: string[], color: string, width: number, opacity = 1): string {
  return list
    .map((d) => `<path d='${d}' fill='none' stroke='${color}' stroke-width='${width}' stroke-linecap='round' opacity='${opacity}'/>`)
    .join("");
}

/** y = mid 근처에서 살짝 오르내리는 점들. 양 끝은 mid에 맞춰서 이어 붙여도 이음새가 덜 보인다. */
function wobblePoints(width: number, mid: number, amplitude: number, step: number, seed: string): [number, number][] {
  const points: [number, number][] = [[0, mid]];
  for (let x = step, i = 0; x < width - step / 2; x += step, i++) {
    points.push([x, mid + between(seed, -amplitude, amplitude, `p${i}`)]);
  }
  points.push([width, mid]);
  return points;
}

/**
 * 가로로 긴 손그림 선 한 줄.
 * - repeat: true면 같은 이미지를 이어 붙여 쓰는 짧은 조각(width), 아니면 xMin 기준으로 잘라 쓰는 긴 선
 */
export function handLine(opts: { seed: string; color: string; width: number; height?: number; strokeWidth?: number; opacity?: number; repeat?: boolean }): string {
  const height = opts.height ?? 6;
  const mid = height / 2;
  const strokes = roughCurve(wobblePoints(opts.width, mid, height * 0.17, 48, opts.seed), opts.seed, {
    roughness: 0.8,
    bowing: 0.6,
    maxRandomnessOffset: 0.9,
    single: opts.repeat,
  });
  const aspect = opts.repeat ? "" : " preserveAspectRatio='xMinYMid slice'";
  return toUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${opts.width}' height='${height}' viewBox='0 0 ${opts.width} ${height}'${aspect}>${paths(strokes, opts.color, opts.strokeWidth ?? 1.6, opts.opacity)}</svg>`,
  );
}

/** 형광펜으로 칠한 띠. 글자 폭에 맞춰 늘려 쓴다. */
export function highlighter(opts: { seed: string; color: string; opacity: number }): string {
  const { fills, strokes } = roughBox(2, 3, 196, 14, opts.seed, { fill: true, radius: 3, roughness: 1.6, bowing: 0.8, maxRandomnessOffset: 1.6 });
  const body = [
    ...fills.map((d) => `<path d='${d}' fill='${opts.color}' fill-opacity='${opts.opacity}'/>`),
    ...strokes.map((d) => `<path d='${d}' fill='none' stroke='${opts.color}' stroke-opacity='${opts.opacity * 0.9}' stroke-width='1.4'/>`),
  ].join("");
  return toUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 20' preserveAspectRatio='none'>${body}</svg>`);
}

/** 게임 메뉴의 선택 커서 같은 손그림 ▶. 살짝 볼록한 세모를 칠하고 테두리를 한 번 더 긋는다. */
export function menuCursor(opts: { seed: string; fill: string; line: string }): string {
  const { fills, strokes } = roughPath("M2.5 1.8Q3 7 2.6 12.2Q7.6 9.7 11.6 7Q7.3 4.2 2.5 1.8Z", opts.seed, {
    fill: true,
    roughness: 0.6,
    maxRandomnessOffset: 0.6,
  });
  const body = [
    ...fills.map((d) => `<path d='${d}' fill='${opts.fill}'/>`),
    ...strokes.map((d) => `<path d='${d}' fill='none' stroke='${opts.line}' stroke-width='1.1' stroke-linejoin='round'/>`),
  ].join("");
  return toUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'>${body}</svg>`);
}

/**
 * 밑줄을 가리는 덮개. 왼쪽은 바탕색으로 꽉 차 있고, 오른쪽 끝 DUST_EDGE px는 1px 알갱이가 점점 성기게 흩어져 있다.
 * 덮개가 왼쪽부터 늘어나면 밑줄이 먼지처럼 갉아먹히듯 사라진다. (global.css의 .draw-underline)
 * 덮개 색은 그 아래 바탕과 같아야 해서, 바탕마다(페이지, 콜아웃) 따로 만든다.
 */
export const DUST_WIDTH = 1200;
export const DUST_EDGE = 48;

export function dustCover(color: string): string {
  const height = 6;
  const solid = DUST_WIDTH - DUST_EDGE;
  let grains = "";
  for (let x = 0; x < 40; x++) {
    // 오른쪽으로 갈수록 알갱이가 드물어진다.
    const keep = 1 - (x / 40) ** 0.7;
    for (let y = 0; y < height; y++) {
      if (between(`dust:${x}:${y}`, 0, 1) < keep) grains += `M${solid + x} ${y}h1v1h-1z`;
    }
  }
  return toUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${DUST_WIDTH}' height='${height}' viewBox='0 0 ${DUST_WIDTH} ${height}' preserveAspectRatio='xMaxYMid slice' shape-rendering='crispEdges' fill='${color}'><rect width='${solid}' height='${height}'/><path d='${grains}'/></svg>`,
  );
}
