// 테마는 버튼 하나로 밝음 ↔ 어두움을 오간다. "시스템 설정 따르기"는 따로 고르지 않아도 알아서 된다.
// - 처음에는 시스템 설정을 따른다.
// - 버튼을 누르면 지금 보이는 테마의 반대로 바뀐다. 바뀐 테마가 시스템 설정과 같으면 저장해 둔 선택을 지워서
//   다시 시스템을 따른다. 다르면 그 선택을 기억한다.
// - 선택할 때의 시스템 설정도 같이 기억해 둔다. 나중에 시스템 설정이 바뀌면(페이지를 닫아 둔 사이에 바뀌어도)
//   선택을 지우고 다시 시스템을 따른다. 예를 들어 낮에 어둡게 골라도, 밤에 시스템이 어두워지면 그때부터 다시 시스템을 따른다.
export type ThemePreference = "system" | "light" | "dark";
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "munju.dev:theme";
/** 테마를 고를 때의 시스템 설정. BaseLayout의 <head> 스크립트도 이 값을 읽는다. */
export const THEME_AGAINST_KEY = "munju.dev:theme-against";
/** <head> 스크립트가 테마를 다시 맞췄을 때(뒤로 가기, 다른 탭) document에 보내는 이벤트 */
export const THEME_EVENT = "munju:theme";

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

export function systemTheme(): Theme {
  return darkQuery().matches ? "dark" : "light";
}

/** 지금 화면에 보이는 테마. 저장소가 아니라 화면(<html data-theme>)이 기준이다.
 * 저장소를 못 쓰는 환경이나, 뒤로 가기로 돌아온 페이지에서도 버튼이 어긋나지 않게 하려는 것이다. */
export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** 지금 시스템 설정을 따르는 중인지, 직접 고른 테마인지 */
export function currentPreference(): ThemePreference {
  const preference = document.documentElement.dataset.themePref;
  return preference === "light" || preference === "dark" ? preference : "system";
}

export function applyTheme(preference: ThemePreference) {
  document.documentElement.dataset.theme = preference === "system" ? systemTheme() : preference;
  document.documentElement.dataset.themePref = preference;
}

function savePreference(preference: ThemePreference) {
  try {
    if (preference === "system") {
      localStorage.removeItem(THEME_STORAGE_KEY);
      localStorage.removeItem(THEME_AGAINST_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
      localStorage.setItem(THEME_AGAINST_KEY, systemTheme());
    }
  } catch {
    // 저장에 실패해도 이번 페이지에는 적용한다.
  }
  applyTheme(preference);
}

/** 지금 보이는 테마의 반대로 바꾼다. 시스템 설정과 같아지면 다시 시스템을 따른다. */
export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  savePreference(next === systemTheme() ? "system" : next);
  return next;
}

/** OS 설정이 바뀌면 기억해 둔 선택을 지우고 다시 시스템을 따른다. 브라우저에서만 호출한다. */
export function watchSystemTheme(onChange?: () => void) {
  darkQuery().addEventListener("change", () => {
    savePreference("system");
    onChange?.();
  });
}
