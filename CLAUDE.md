# munju.dev

Astro + MDX 블로그. 글 안의 데모는 Svelte로 만든다. 글 쓰는 법과 컴포넌트는 `docs/writing-guide.md`에 있다.

## 글

- 쓰는 중인 글은 `src/content/posts/_drafts/`에 둔다. 공개 저장소라서 이 폴더는 git에서 빠져 있고, 개발 서버에서만 보인다. 올리기 전의 글을 `_drafts/` 밖에 두거나 커밋하지 않는다.
- 글 본문은 글쓴이의 문장이다. 부탁받지 않은 내용·말투 수정은 하지 않고, 고칠 곳은 제안만 한다.
- 맞춤법 검사나 교정은 `proofread` 스킬을 따른다.

## 글 올리기

글쓴이가 다 썼다고 하면 이 순서로 한다.

1. 글을 끝까지 읽고 `proofread` 스킬로 고칠 곳을 먼저 보여준다. 글쓴이가 고른 것만 반영한다. 올린 뒤에 고치면 커밋을 다시 쓰고 강제 푸시해야 하니, 이 단계를 건너뛰지 않는다.
2. 글 폴더(또는 파일)를 `_drafts/`에서 `src/content/posts/` 바로 아래로 옮긴다. 주소는 그대로다.
3. `npm run build`(끝에 누출 검사가 돈다)와 `npm run check`를 통과시킨다.
4. 커밋하고 푸시한다.

## 지켜야 할 것

- 글 목록에는 글의 `more` 앞부분만 간다. 목록·태그·RSS·사이트맵 어디에도 뒷부분이 새면 안 된다. `npm run build`의 누출 검사(`scripts/check-excerpt-leak.mjs`)가 막는다.
- 사이트 안 링크는 끝에 `/`를 붙인다. (`trailingSlash: "always"`, `src/lib/posts.ts`의 `postHref`·`pageHref`·`tagHref`)
- 데모의 키 입력은 `window`가 아니라 `DemoFrame`이 넘겨주는 이벤트로만 받는다. 목록에 데모가 여러 개 있어서다.
