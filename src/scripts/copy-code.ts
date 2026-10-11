// data-copy-code 버튼을 누르면 같은 코드 영역의 코드를 복사한다.
// 글 본문의 코드 블록(.prose .code-block)에는 복사 버튼을 여기서 붙인다. 데모의 "코드 보기"는 DemoBox가 직접 넣는다.

for (const block of document.querySelectorAll<HTMLElement>(".prose .code-block")) {
  if (block.querySelector(":scope > [data-copy-code]")) continue;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-button";
  button.dataset.copyCode = "";
  button.textContent = "복사";
  block.append(button);
}

/** 클립보드 API가 막혀 있을 때(권한 거부, 보안 컨텍스트가 아님 등) 쓰는 옛날 방식 */
function copyWithSelection(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
  document.body.append(textarea);
  textarea.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return copyWithSelection(text);
  }
}

/** 화면 읽기 프로그램에 결과를 알려주는 곳. 화면에는 보이지 않는다. */
const announcer = document.createElement("span");
announcer.className = "sr-only";
announcer.setAttribute("aria-live", "polite");
document.body.append(announcer);

const resetTimers = new WeakMap<HTMLButtonElement, ReturnType<typeof setTimeout>>();

document.addEventListener("click", async (event) => {
  const button = (event.target as Element).closest?.<HTMLButtonElement>("[data-copy-code]");
  if (!button) return;

  const code = button.parentElement?.querySelector("pre")?.textContent ?? "";
  const original = button.dataset.label ?? button.textContent ?? "";
  button.dataset.label = original;
  const copied = await copy(code);
  button.textContent = copied ? "복사됨!" : "복사 실패";
  announcer.textContent = copied ? "코드를 복사했어요" : "코드를 복사하지 못했어요";
  // 연달아 누르면 앞의 타이머를 지워서, 마지막으로 누른 때부터 다시 1.5초 보여준다.
  clearTimeout(resetTimers.get(button));
  resetTimers.set(
    button,
    setTimeout(() => {
      button.textContent = original;
      announcer.textContent = "";
    }, 1500),
  );
});
