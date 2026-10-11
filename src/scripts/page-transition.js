// 페이지를 옮길 때 새로고침처럼 끊기지 않고 이어지게 한다. (BaseLayout <head>에 그대로 넣는다)
// 크롬·사파리의 페이지 간 view transition을 쓰고, 지원하지 않는 브라우저에서는 평소처럼 넘어간다.
//
// - 글 목록(홈, 태그)에서 고른 글의 제목과 날짜·태그 줄은 글 페이지의 제목과 날짜·태그 줄로 날아가 이어진다.
//   돌아올 때는 거꾸로 목록의 그 자리로 돌아간다. 이름은 그 글 하나에만 잠깐 붙였다가 뗀다.
// - "더 읽기"로 들어가면, 목록에서 읽던 미리보기가 있던 높이에 글의 같은 부분이 오도록 스크롤을 맞춘다.
//   그래서 읽던 글이 그 자리에 그대로 있고, 그 아래로 나머지가 이어진다.
//   (스크립트가 없으면 링크의 #more로 평소처럼 이동한다)
// - 화면 밖에 있던 요소는 날아오지 않게 이름을 뗀다. (헤더는 스크롤을 따라오지 않아서 화면 밖일 때가 많다)
//
// pagereveal은 새 페이지가 처음 그려지기 직전에 오므로, 늦게 실행되는 모듈 스크립트가 아니라 <head>에 둔다.
(() => {
  const MORE_KEY = "munju:more";
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

  /** "더 읽기"로 왔으면, 목록에서 미리보기가 끝나던 높이에 글의 more 위치를 맞춘다. */
  let aligned = false;
  function alignMore() {
    if (aligned) return;
    aligned = true;
    let saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(MORE_KEY) ?? "null");
      sessionStorage.removeItem(MORE_KEY);
    } catch {}
    if (!saved || saved.path !== strip(location.pathname)) return;
    const anchor = document.getElementById("more");
    if (!anchor) return;
    const top = anchor.getBoundingClientRect().top + scrollY;
    scrollTo(0, Math.max(0, top - saved.y));
    // 주소에는 #more를 다시 붙여 둔다. (새로고침하거나 주소를 공유하면 그 위치로 간다)
    // 다 읽어 들이기 전에 붙이면 브라우저가 그 위치로 스크롤해 버리므로, load가 끝난 뒤에 붙인다.
    const addHash = () => setTimeout(() => history.replaceState(history.state, "", "#more"));
    if (document.readyState === "complete") addHash();
    else addEventListener("load", addHash, { once: true });
  }

  // 목록에서 "더 읽기"를 누르면 미리보기가 끝나는 높이를 기억해 두고 글로 간다.
  // 주소에 #more가 있으면 브라우저가 그 위치로 스스로 스크롤해서 맞춘 높이를 덮어쓰므로, #more를 빼고 이동한다.
  addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.("a.read-more");
    const excerpt = link?.closest("[data-post-path]")?.querySelector(".excerpt");
    if (!link || !excerpt) return;
    try {
      sessionStorage.setItem(MORE_KEY, JSON.stringify({ path: pathOf(link.href), y: excerpt.getBoundingClientRect().bottom }));
    } catch {
      return;
    }
    event.preventDefault();
    const url = new URL(link.href);
    url.hash = "";
    location.assign(url);
  });

  addEventListener("pageswap", (event) => {
    if (event.viewTransition) prepare(event.viewTransition, event.activation?.entry?.url);
  });

  addEventListener("pagereveal", (event) => {
    alignMore();
    if (event.viewTransition) prepare(event.viewTransition, globalThis.navigation?.activation?.from?.url);
  });

  // pagereveal이 없는 브라우저나, 탭이 가려져 있어 화면을 그리지 않을 때도 "더 읽기" 높이 맞추기는 한다.
  addEventListener("DOMContentLoaded", alignMore);
})();
