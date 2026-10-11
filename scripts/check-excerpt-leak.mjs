// 빌드 결과에서 글 목록 페이지에 글의 `more` 뒷부분이 새어 들어가지 않았는지 검사한다.
// `npm run build` 끝에 자동으로 돈다. 따로 돌릴 때는 `npm run check:leak`.
//
// 1. 글마다 원본 MDX를 미리보기 부분과 나머지로 나눈다. (목록이 쓰는 sliceExcerpt와 같은 함수)
// 2. 나머지에서 본문 문장 조각을 뽑는다. 코드 블록, 인라인 코드, 컴포넌트 태그는 데모 코드와 겹칠 수 있어서 뺀다.
// 3. 그 조각이 글 페이지(dist/posts) 밖의 어느 페이지·피드(HTML, XML, JSON)나, 그 페이지들이 불러오는 스크립트에
//    들어 있으면 실패한다. 앞으로 보관함이나 검색용 JSON 같은 페이지가 생겨도 따로 등록하지 않아도 검사된다.
// 4. 일부 공개 글(noindex)의 주소가 글 페이지 밖 어디에든 있으면 실패한다.
// 검사가 헛돌지 않도록, 미리보기 문장은 목록에서 실제로 찾아지는지도 함께 확인한다.
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { sliceExcerpt } from "../src/lib/excerpt.mjs";
import { POSTS_DIR, postIdFromEntry } from "../src/lib/post-id.mjs";

const POSTS = POSTS_DIR;
const DIST = "dist";
/** 글 목록이 보이는 곳. 미리보기가 실제로 목록에 나오는지 확인할 때 쓴다. 홈과 /page/N */
const LIST_DIRS = ["page"];
/** 검사하지 않는 곳: 글 페이지(자기 글이 다 있는 게 맞다)와 빌드 산출물 */
const SKIP = [join(DIST, "posts"), join(DIST, "_astro"), join(DIST, "og")];
/** 이보다 짧은 조각은 우연히 겹칠 수 있어서 검사하지 않는다. */
const MIN_LENGTH = 8;

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;

async function walk(dir, ext) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path, ext)));
    else if (entry.name.endsWith(ext)) out.push(path);
  }
  return out;
}

/** MDX 소스에서 본문 글자 조각을 뽑는다. 인라인 코드, 링크, 태그, 강조 표시를 경계로 자른다. */
function prose(source) {
  const out = new Set();
  let fence = false;
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (/^(```|~~~)/.test(line)) {
      fence = !fence;
      continue;
    }
    if (fence || line === "" || /^(import|export)\s/.test(line) || /^[<{|]/.test(line)) continue;
    const text = line.replace(/^(#{1,6}|[-*+]|\d+\.|>)\s+/, "");
    for (const part of text.split(/`[^`]*`|<[^>]*>|\{[^}]*\}|\]\([^)]*\)|[[\]*_~]/)) {
      const piece = part.trim();
      // HTML에서 다른 모양으로 바뀌는 글자(&, 따옴표 등)가 있으면 그대로 찾을 수 없어서 뺀다.
      if (piece.length >= MIN_LENGTH && !/[&<>"']/.test(piece)) out.add(piece);
    }
  }
  return [...out];
}

/** 목록 페이지 HTML이 불러오는 스크립트와, 그 스크립트가 다시 불러오는 스크립트를 모두 모은다. */
async function scriptsOf(htmlFiles) {
  const seen = new Set();
  const queue = [];
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf-8");
    for (const [, url] of html.matchAll(/(?:src|href|component-url|renderer-url)="(\/_astro\/[^"]+\.js)"/g)) queue.push(join(DIST, url));
  }
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    const code = await readFile(file, "utf-8");
    for (const [, path] of code.matchAll(/(?:from|import)\s*\(?\s*["'](\.{1,2}\/[^"']+\.js)["']/g)) queue.push(join(dirname(file), path));
  }
  return [...seen];
}

const listPages = [join(DIST, "index.html"), ...(await Promise.all(LIST_DIRS.map((dir) => walk(join(DIST, dir), ".html")))).flat()].filter(existsSync);
if (!listPages.length) {
  console.error("✗ 누출 검사: dist/index.html이 없어요. 먼저 빌드하세요.");
  process.exit(1);
}
const listHtml = (await Promise.all(listPages.map((file) => readFile(file, "utf-8")))).join("\n");

const pages = (await Promise.all([".html", ".xml", ".json"].map((ext) => walk(DIST, ext)))).flat().filter((file) => !SKIP.some((dir) => file.startsWith(dir + "/")));
const scripts = await scriptsOf(pages.filter((file) => file.endsWith(".html")));
const targets = await Promise.all([...pages, ...scripts].map(async (file) => ({ file, text: await readFile(file, "utf-8") })));

const problems = [];
let checked = 0;
const posts = await walk(POSTS, ".mdx");

for (const file of posts) {
  const source = await readFile(file, "utf-8");
  const head = sliceExcerpt(source);
  const rest = source.startsWith(head) ? source.slice(head.length) : source.slice(head.trimEnd().length);
  const headProse = prose(head.replace(FRONTMATTER, ""));
  // 초안(빌드된 페이지가 없음)과 일부 공개 글(noindex)은 목록에 없으니, 미리보기가 목록에 있는지는 확인하지 않는다.
  // 글 정보를 다시 읽지 않고 빌드된 페이지를 보고 정한다.
  const id = postIdFromEntry(relative(POSTS, file));
  const pageFile = join(DIST, "posts", id, "index.html");
  const page = existsSync(pageFile) ? await readFile(pageFile, "utf-8") : null;
  const unlisted = page !== null && /<meta name="robots" content="noindex"/.test(page);
  const hiddenFromList = page === null || unlisted;

  // 일부 공개 글은 목록·태그·RSS·사이트맵 어디에도 주소가 나오면 안 된다.
  if (unlisted) {
    for (const { file: target, text } of targets) {
      if (text.includes(`/posts/${id}/`)) problems.push(`${relative(".", file)}: 일부 공개 글의 주소가 ${relative(".", target)}에 있어요.`);
    }
  }

  // 미리보기에도 똑같이 있는 문장은 새어 나간 게 아니다.
  const hidden = prose(rest).filter((piece) => !head.includes(piece));
  checked += hidden.length;
  for (const piece of hidden) {
    for (const { file: target, text } of targets) {
      if (text.includes(piece)) problems.push(`${relative(".", file)}: "${piece}" → ${relative(".", target)}`);
    }
  }

  if (!hiddenFromList && headProse.length && !headProse.some((piece) => listHtml.includes(piece))) {
    problems.push(`${relative(".", file)}: 미리보기 문장을 목록에서 찾지 못했어요. 검사 방법이 빌드 결과와 맞지 않는 것 같아요.`);
  }
}

if (problems.length) {
  console.error(`✗ 누출 검사 실패: 글 페이지 밖(목록·태그·RSS·사이트맵 등)에 보이면 안 되는 내용이 있어요.\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ 누출 검사 통과: 글 ${posts.length}개의 숨은 문장 ${checked}개를 페이지·피드 ${pages.length}개와 스크립트 ${scripts.length}개에서 찾지 못했어요.`);
