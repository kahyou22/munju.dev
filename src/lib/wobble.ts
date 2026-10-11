// 구분선(헤더·푸터·글 사이·본문 가로줄)을 손으로 그은 것처럼 흔드는 SVG 필터.
// 구분선은 rough.js가 아니라, 반듯한 선을 이 필터로 흔들어 그린다. (필터 정의는 WobbleFilters.astro)
// 떨림 + 군데군데 굵어짐(펜 압력) + 진하기 변화. 모두 같은 모양이 되지 않도록 여러 개 두고 seed로 고른다.
import { pick } from "./hand-drawn";

export interface WobbleVariant {
  /** 떨림 노이즈 시드 */
  seed: number;
  /** 떨림의 촘촘함. 클수록 잘게 떨린다. */
  frequency: number;
  /** 떨림 크기(px) */
  scale: number;
  /** 굵어지는 구간의 길이. 작을수록 길게 이어진다. */
  pressure: number;
  /** 굵어지는 구간에서 더해지는 두께(px, 양쪽으로) */
  weight: number;
}

/** WobbleFilters.astro가 #wobble-1 ~ #wobble-6으로 만드는 필터 종류 */
export const WOBBLE_VARIANTS: WobbleVariant[] = [
  { seed: 7, frequency: 0.03, scale: 4, pressure: 0.016, weight: 0.6 },
  { seed: 13, frequency: 0.026, scale: 3.6, pressure: 0.012, weight: 0.7 },
  { seed: 29, frequency: 0.034, scale: 4.2, pressure: 0.02, weight: 0.5 },
  { seed: 41, frequency: 0.028, scale: 4.5, pressure: 0.014, weight: 0.8 },
  { seed: 53, frequency: 0.032, scale: 3.8, pressure: 0.018, weight: 0.6 },
  { seed: 67, frequency: 0.024, scale: 4.1, pressure: 0.01, weight: 0.7 },
];

/** CSS `filter` 값으로 쓸 흔들기 필터. 같은 seed는 늘 같은 필터를 고른다. */
export function wobbleFilter(seed: string, salt = ""): string {
  return `url(#wobble-${pick(seed, WOBBLE_VARIANTS.length, salt) + 1})`;
}
