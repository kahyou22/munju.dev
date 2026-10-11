// 링크에서 마우스를 떼면 밑줄을 따라 작은 먼지 알갱이가 오른쪽 위로 날리며 사라진다.
// 밑줄이 왼쪽부터 지워지는 것(underline.css의 .draw-underline)에 맞춰 왼쪽 알갱이부터 날아간다.

const SELECTOR = ".draw-underline, .prose a";
/** 밑줄이 거의 안 그려졌을 만큼 짧게 올렸다 뗀 경우에는 먼지를 날리지 않는다. */
const MIN_HOVER_MS = 120;
/** 밑줄이 지워지는 시간. global.css의 --underline-sweep을 읽는다. */
function sweepMs(): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--underline-sweep").trim();
  const number = parseFloat(value);
  if (Number.isNaN(number)) return 350;
  return value.endsWith("ms") ? number : number * 1000;
}
const SWEEP_MS = sweepMs();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const enteredAt = new WeakMap<Element, number>();
let layer: HTMLDivElement | undefined;

function getLayer() {
  if (!layer) {
    layer = document.createElement("div");
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden";
    document.body.append(layer);
  }
  return layer;
}

function scatter(link: HTMLElement) {
  const color = getComputedStyle(link).getPropertyValue("--dust-color").trim() || getComputedStyle(link).color;
  const target = getLayer();

  // 여러 줄에 걸친 링크는 줄마다 밑줄이 있다.
  for (const rect of link.getClientRects()) {
    const count = Math.max(6, Math.min(36, Math.round(rect.width / 5)));
    for (let i = 0; i < count; i++) {
      const progress = Math.random();
      const size = 1.2 + Math.random() * 2;
      const grain = document.createElement("span");
      grain.style.cssText = [
        "position:absolute",
        `left:${rect.left + progress * rect.width}px`,
        `top:${rect.bottom - 3 + (Math.random() - 0.5) * 3}px`,
        `width:${size}px`,
        `height:${size}px`,
        "border-radius:50%",
        `background:${color}`,
        "opacity:0",
      ].join(";");
      target.append(grain);

      const dx = 6 + Math.random() * 16;
      const dy = -(4 + Math.random() * 14);
      grain
        .animate(
          [
            { transform: "translate(0, 0) scale(1)", opacity: 0.9 },
            { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0 },
          ],
          {
            duration: 450 + Math.random() * 450,
            // 덮개가 지나가는 시점에 맞춰 왼쪽부터 떨어져 나간다.
            delay: progress * SWEEP_MS * 0.85,
            easing: "cubic-bezier(0.2, 0.6, 0.4, 1)",
            // 기다리는 동안에는 보이지 않다가(처음 opacity:0), 덮개가 그 자리에 왔을 때 나타나 날아간다.
            // "both"로 두면 기다리는 동안에도 첫 모습이 보여서, 떼는 순간 밑줄 전체에 점이 한꺼번에 생긴다.
            fill: "forwards",
          },
        )
        .finished.finally(() => grain.remove());
    }
  }
}

document.addEventListener("pointerover", (event) => {
  const link = (event.target as Element).closest?.(SELECTOR);
  if (link && !link.contains(event.relatedTarget as Node)) {
    enteredAt.set(link, performance.now());
  }
});

document.addEventListener("pointerout", (event) => {
  const link = (event.target as Element).closest?.(SELECTOR) as HTMLElement | null;
  if (!link || link.contains(event.relatedTarget as Node)) return;
  if (event.pointerType === "touch" || reducedMotion.matches) return;

  const since = enteredAt.get(link);
  enteredAt.delete(link);
  if (since === undefined || performance.now() - since < MIN_HOVER_MS) return;

  scatter(link);
});
