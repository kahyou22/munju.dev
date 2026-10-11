// 페이지의 [data-rough] 요소에 손그림 장식을 그린다. (Svelte 데모 안쪽은 rough-action이 맡는다)
// 화면 근처에 왔을 때 처음 그리고, 크기가 바뀌면 같은 모양(seed)으로 다시 그린다.
import { observedSize, readDecorOptions, renderDecor } from "../lib/rough-decor";

const elements = [...document.querySelectorAll<HTMLElement>("[data-rough]")].filter((el) => !el.closest("astro-island"));

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const el = entry.target as HTMLElement;
    renderDecor(el, readDecorOptions(el), 1, observedSize(entry));
  }
});

const visibilityObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      visibilityObserver.unobserve(entry.target);
      resizeObserver.observe(entry.target);
    }
  },
  { rootMargin: "400px 0px" },
);

for (const el of elements) visibilityObserver.observe(el);
