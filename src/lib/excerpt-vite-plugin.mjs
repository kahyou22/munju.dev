// 글 목록용 "미리보기 모듈"을 만드는 Vite 플러그인.
//
// `글.mdx?excerpt`를 import하면, 원본 MDX에서 `{/* more */}` 앞부분만 잘라낸 소스를
// 별도의 MDX 모듈(`글.mdx__excerpt.mdx`)로 컴파일해서 돌려준다.
// 목록 페이지는 이 모듈만 쓰기 때문에 `more` 뒤 내용은 렌더링은 물론 컴파일조차 되지 않는다.
// (전에는 뒷부분을 숨기는 컴포넌트로 감쌌는데, Astro가 슬롯을 미리 렌더링해서 숨긴 데모가
//  섬(island) 스크립트를 소비해 버리는 문제가 있었다.)
//
// 어디까지 자를지는 excerpt.mjs의 규칙을 따른다. (`more` 표시가 없으면 첫 문단까지)
import { readFile } from "node:fs/promises";
import { sliceExcerpt } from "./excerpt.mjs";

const QUERY = "?excerpt";
/** 미리보기 모듈 이름 끝. more-marker.mjs는 이 이름의 모듈에는 앵커를 두지 않는다. */
export const EXCERPT_SUFFIX = "__excerpt.mdx";
const SUFFIX = EXCERPT_SUFFIX;

export function excerptPlugin() {
  return {
    name: "munju-excerpt",
    enforce: "pre",
    async resolveId(source, importer) {
      if (!source.endsWith(QUERY)) return;
      const resolved = await this.resolve(source.slice(0, -QUERY.length), importer, { skipSelf: true });
      if (!resolved?.id.endsWith(".mdx")) return;
      // 원본과 같은 폴더의 가상 파일로 둬서, 글 안의 상대 경로 import가 그대로 동작한다.
      return resolved.id + SUFFIX;
    },
    async load(id) {
      if (!id.endsWith(SUFFIX)) return;
      const original = id.slice(0, -SUFFIX.length);
      this.addWatchFile(original);
      return sliceExcerpt(await readFile(original, "utf-8"));
    },
    // 원본을 고치면 미리보기 모듈도 다시 만든다.
    handleHotUpdate({ file, server, modules }) {
      if (!file.endsWith(".mdx")) return;
      const excerpt = server.moduleGraph.getModuleById(file + SUFFIX);
      if (excerpt) return [...modules, excerpt];
    },
  };
}
