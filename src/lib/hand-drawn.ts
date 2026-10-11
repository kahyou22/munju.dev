// 손그림 장식이 모두 똑같아 보이지 않게, 요소마다 다른 값을 고른다.
// 같은 seed는 항상 같은 결과가 나와서 서버 렌더링과 브라우저 결과가 일치한다.

function hash(text: string): number {
  let h = 2166136261;
  for (const char of text) {
    h ^= char.codePointAt(0)!;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** seed에서 0 이상 count 미만의 정수를 고른다. 같은 seed로 여러 값을 뽑을 때는 salt를 바꾼다. */
export function pick(seed: string, count: number, salt = ""): number {
  return hash(`${seed}:${salt}`) % count;
}

/** min 이상 max 이하의 값을 고른다. */
export function between(seed: string, min: number, max: number, salt = ""): number {
  return min + ((hash(`${seed}:${salt}`) % 1000) / 999) * (max - min);
}
