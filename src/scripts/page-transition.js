// 페이지를 옮길 때 새로고침처럼 끊기지 않고 이어지게 한다. (BaseLayout <head>에 그대로 넣는다)
// 크롬·사파리의 페이지 간 view transition을 쓰고, 지원하지 않는 브라우저에서는 평소처럼 넘어간다.
//
// - 화면 밖에 있던 요소는 날아오지 않게 이름을 뗀다. (헤더는 스크롤을 따라오지 않아서 화면 밖일 때가 많다)
//
// pagereveal은 새 페이지가 처음 그려지기 직전에 오므로, 늦게 실행되는 모듈 스크립트가 아니라 <head>에 둔다.
(() => {
  const visible = (el) => {
    const rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight;
  };

  /** 이름이 붙은 요소 중 화면 밖에 있는 것은 이번 전환에서 뺀다. */
  function dropOffscreen() {
    const dropped = [];
    for (const el of document.querySelectorAll(".site-header")) {
      const name = getComputedStyle(el).viewTransitionName;
      if (name && name !== "none" && !visible(el)) {
        el.style.viewTransitionName = "none";
        dropped.push(el);
      }
    }
    return dropped;
  }

  function prepare(transition) {
    const touched = dropOffscreen();
    transition.finished.finally(() => {
      for (const el of touched) el.style.viewTransitionName = "";
    });
  }

  addEventListener("pageswap", (event) => {
    if (event.viewTransition) prepare(event.viewTransition);
  });

  addEventListener("pagereveal", (event) => {
    if (event.viewTransition) prepare(event.viewTransition);
  });
})();
