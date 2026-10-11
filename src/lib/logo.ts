// 로고 점(코랄색 손그림 동그라미). 헤더와 공유 미리보기 이미지가 같은 모양을 쓴다.
import { roughEllipse, type RoughPaths } from "./rough";

/** 지름 18짜리 로고 점을 (center, center)에 그린다. */
export function logoDot(center: number): RoughPaths {
  return roughEllipse(center, center, 18, 18, "logo", { fill: true, roughness: 0.8, maxRandomnessOffset: 0.8 });
}
