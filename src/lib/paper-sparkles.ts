// 양옆 바탕의 반짝이·하트 배치. /paper-sparkles.svg로 내보내 global.css에서 마스크로 쓰고, 색은 CSS가 칠한다.
// 공유 미리보기 이미지(src/pages/og)에서도 색을 입혀 쓴다.
// 오른쪽 끝(x = WIDTH)이 글 영역 경계다. 경계에서 멀수록 도형이 많아지다가 RAMP를 지나면 칸마다 하나씩 꽉 찬다.
// 투명도가 아니라 도형의 개수로 진하기를 바꾸는 디더링이라, 도형 하나하나는 모두 같은 진하기다.
/** 칸 하나의 크기(px). 칸마다 도형을 하나까지 둔다. */
const GRID = 24;
/** 글 영역 경계부터 도형이 꽉 찰 때까지의 거리(px) */
const RAMP = 336;
/** 경계 바로 옆은 비워둔다. */
const MARGIN = 24;
/** 아주 넓은 화면의 옆 여백까지 덮는 너비 */
export const SPARKLES_WIDTH = 1536;
const WIDTH = SPARKLES_WIDTH;
/** 세로로 반복되는 높이 */
export const SPARKLES_HEIGHT = 576;
const HEIGHT = SPARKLES_HEIGHT;
/** 꽉 찬 구간에 반복해서 까는 조각의 크기. 반복이 눈에 띄지 않을 만큼 크게 둔다. */
const TILE = 288;

// 큰 반짝이, 작은 반짝이, 테두리만 있는 하트. 모두 (0, 0)이 가운데다.
// 반짝이는 면(fill)이고 하트는 선(stroke)이라, 둘 다 맨 바깥 <svg>의 색(fill, color)을 물려받는다.
const SPARKLE = "M0-1Q.2-.2 1 0Q.2.2 0 1Q-.2.2-1 0Q-.2-.2 0-1Z";
const HEART = "M0 3.2C-4.6 0-4.1-3.7-1.8-3.7-.8-3.7-.2-2.9 0-2.3.2-2.9.8-3.7 1.8-3.7 4.1-3.7 4.6 0 0 3.2Z";
const SHAPES = `<path id="b" d="${SPARKLE}" transform="scale(4.6)"/><path id="s" d="${SPARKLE}" transform="scale(3.2)"/><path id="h" d="${HEART}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>`;
const KINDS = ["b", "s", "h"];

// 같은 결과가 나오도록 seed가 고정된 난수
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Random = () => number;

/** 칸 가운데에 도형 하나. 종류·기울기·크기가 조금씩 달라서 복붙처럼 보이지 않는다. */
function shape(next: Random, x: number, y: number) {
  const kind = KINDS[Math.floor(next() * KINDS.length)];
  const angle = Math.round((next() - 0.5) * 40);
  const scale = (0.85 + next() * 0.3).toFixed(2);
  return `<use href="#${kind}" transform="translate(${x} ${y})rotate(${angle})scale(${scale})"/>`;
}

/** 경계에서 d(px) 떨어진 곳의 밀도. 0이면 도형이 없고 1이면 칸마다 하나씩 있다. */
function density(d: number) {
  const t = Math.min(Math.max((d - MARGIN) / (RAMP - MARGIN), 0), 1);
  return t ** 1.2;
}

/** 오차 확산(Floyd–Steinberg)으로 도형을 둘 칸을 고른다. 고르게 흩어지도록 약간의 흔들림을 섞는다. */
function ditherShapes(next: Random) {
  const cols = RAMP / GRID;
  const rows = HEIGHT / GRID;
  const error = Array.from({ length: rows + 1 }, () => new Float32Array(cols + 2));
  const out: string[] = [];

  for (let row = 0; row < rows; row++) {
    const forward = row % 2 === 0;
    for (let i = 0; i < cols; i++) {
      // col 0이 경계에 가장 가까운 칸이다.
      const col = forward ? i : cols - 1 - i;
      const value = density(col * GRID + GRID / 2) + error[row][col + 1];
      const on = value + (next() - 0.5) * 0.3 > 0.5;
      if (on) out.push(shape(next, WIDTH - col * GRID - GRID / 2, row * GRID + GRID / 2));
      const e = value - (on ? 1 : 0);
      const ahead = forward ? 1 : -1;
      error[row][col + 1 + ahead] += (e * 7) / 16;
      error[row + 1][col + 1 - ahead] += (e * 3) / 16;
      error[row + 1][col + 1] += (e * 5) / 16;
      error[row + 1][col + 1 + ahead] += (e * 1) / 16;
    }
  }
  return out.join("");
}

/** 꽉 찬 구간에 반복할 조각. 칸마다 도형이 하나씩 있다. */
function fullTile(next: Random) {
  const out: string[] = [];
  for (let y = GRID / 2; y < TILE; y += GRID) {
    for (let x = GRID / 2; x < TILE; x += GRID) out.push(shape(next, x, y));
  }
  return out.join("");
}

/** 반짝이 배치 SVG. 색을 주지 않으면 검은색이라 마스크로 쓸 수 있다. 같은 결과가 나오도록 매번 같은 seed로 만든다. */
export function paperSparklesSvg(color = "#000"): string {
  // 꽉 찬 조각을 먼저, 디더링을 나중에 같은 난수 하나로 뽑는다. (순서를 바꾸면 무늬가 바뀐다)
  const next = random(20261011);
  const tile = fullTile(next);
  const dithered = ditherShapes(next);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="${color}" color="${color}"><defs>${SHAPES}<pattern id="p" width="${TILE}" height="${TILE}" patternUnits="userSpaceOnUse">${tile}</pattern></defs><rect width="${WIDTH - RAMP}" height="${HEIGHT}" fill="url(#p)"/>${dithered}</svg>`;
}
