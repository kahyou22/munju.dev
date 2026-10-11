// Svelte 데모 안의 요소에 손그림 장식을 그리는 action. <span use:roughDecor={{ kind: "box", seed }} />
// boil을 넘기면 모양 4개를 미리 그려 두고, boil이 켜져 있는 동안 .boiling을 붙여 CSS가 차례로 보여주게 한다.
// (그리는 일은 크기가 바뀔 때만 한다. 꿈틀거리는 동안 rough.js를 다시 돌리지 않는다)
import { BOIL_FRAMES, observedSize, renderDecor, type DecorOptions } from "./rough-decor";

export interface RoughActionOptions extends DecorOptions {
  boil?: boolean;
}

export function roughDecor(node: HTMLElement, initial: RoughActionOptions) {
  let opts = initial;
  const frames = initial.boil === undefined ? 1 : BOIL_FRAMES;
  const shapeKey = ({ boil: _boil, ...shape }: RoughActionOptions) => JSON.stringify(shape);

  let size: { width: number; height: number } | undefined;
  const draw = () => renderDecor(node, opts, frames, size);
  const resizeObserver = new ResizeObserver(([entry]) => {
    size = observedSize(entry);
    draw();
  });
  resizeObserver.observe(node);
  node.classList.toggle("boiling", !!opts.boil);

  return {
    update(next: RoughActionOptions) {
      const reshape = shapeKey(next) !== shapeKey(opts);
      opts = next;
      node.classList.toggle("boiling", !!next.boil);
      if (reshape) draw();
    },
    destroy() {
      resizeObserver.disconnect();
    },
  };
}
