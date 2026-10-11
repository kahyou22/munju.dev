// 페이지를 옮길 때 새로고침처럼 끊기지 않고 이어지게 한다. (BaseLayout <head>에 그대로 넣는다)
// 크롬·사파리의 페이지 간 view transition을 쓰고, 지원하지 않는 브라우저에서는 평소처럼 넘어간다.
//
// - 글 목록(홈, 태그)에서 고른 글의 제목과 날짜·태그 줄은 글 페이지의 제목과 날짜·태그 줄로 날아가 이어진다.
//   돌아올 때는 거꾸로 목록의 그 자리로 돌아간다. 이름은 그 글 하나에만 잠깐 붙였다가 뗀다.
// - 화면 밖에 있던 요소는 날아오지 않게 이름을 뗀다. (헤더는 스크롤을 따라오지 않아서 화면 밖일 때가 많다)
//
// pagereveal은 새 페이지가 처음 그려지기 직전에 오므로, 늦게 실행되는 모듈 스크립트가 아니라 <head>에 둔다.
(() => {
  const strip = (path) => path.replace(/\/$/, "") || "/";
  const pathOf = (url) => (url ? strip(new URL(url, location.href).pathname) : null);
  const visible = (el) => {
    const rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight;
  };

  /** 이 페이지에서 그 글을 가리키는 목록 항목에 제목·정보 줄 이름을 붙인다. */
  function nameListItem(path) {
    if (!path) return [];
    const item = [...document.querySelectorAll("[data-post-path]")].find((el) => strip(el.dataset.postPath) === path);
    if (!item) return [];
    const named = [];
    for (const [selector, name] of [
      ["[data-vt-title]", "post-title"],
      ["[data-vt-meta]", "post-meta"],
    ]) {
      const el = item.querySelector(selector);
      if (!el) continue;
      el.style.viewTransitionName = name;
      named.push(el);
    }
    return named;
  }

  /** 이름이 붙은 요소 중 화면 밖에 있는 것은 이번 전환에서 뺀다. */
  function dropOffscreen() {
    const dropped = [];
    for (const el of document.querySelectorAll(".site-header, [data-vt-title], [data-vt-meta]")) {
      const name = getComputedStyle(el).viewTransitionName;
      if (name && name !== "none" && !visible(el)) {
        el.style.viewTransitionName = "none";
        dropped.push(el);
      }
    }
    return dropped;
  }

  /** 글에서 다른 글로 갈 때는 제목이 다른 제목으로 변신하지 않게, 글 페이지의 이름을 뗀다. */
  function dropPostToPost(otherPath) {
    const here = strip(location.pathname);
    const isPost = (path) => path?.startsWith("/posts/");
    if (!isPost(here) || !isPost(otherPath) || here === otherPath) return [];
    const dropped = [...document.querySelectorAll("[data-vt-title], [data-vt-meta]")];
    for (const el of dropped) el.style.viewTransitionName = "none";
    return dropped;
  }

  function prepare(transition, otherUrl) {
    const other = pathOf(otherUrl);
    const touched = [...dropPostToPost(other), ...nameListItem(other), ...dropOffscreen()];
    transition.finished.finally(() => {
      for (const el of touched) el.style.viewTransitionName = "";
    });
  }

  addEventListener("pageswap", (event) => {
    if (event.viewTransition) prepare(event.viewTransition, event.activation?.entry?.url);
  });

  addEventListener("pagereveal", (event) => {
    if (event.viewTransition) prepare(event.viewTransition, globalThis.navigation?.activation?.from?.url);
  });
})();
