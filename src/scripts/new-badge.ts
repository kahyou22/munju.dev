// 새 글 N 표시는 빌드할 때 붙는다. 빌드한 뒤로 기한이 지난 표시는 여기서 뗀다.
for (const badge of document.querySelectorAll<HTMLElement>("[data-new-until]")) {
  if (Date.now() >= Number(badge.dataset.newUntil)) badge.remove();
}
