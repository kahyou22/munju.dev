# 글 쓰는 법

이 블로그에 글을 쓰는 방법을 정리한 문서입니다. 컴포넌트가 실제로 어떻게 보이는지는 견본 글(`/posts/writing-components/`)을 열어보면 됩니다. 일부 공개 글이라 목록에는 없고 주소로만 들어갈 수 있습니다.

## 1. 글 만들기

글은 `src/content/posts/` 아래에 MDX로 씁니다. 두 가지 방법이 있습니다.

| 방법 | 파일 | 주소 |
| --- | --- | --- |
| 파일 하나 | `posts/hello.mdx` | `/posts/hello/` |
| 폴더 (데모나 이미지를 같이 둘 때) | `posts/keyboard-events/index.mdx` | `/posts/keyboard-events/` |

맨 위에 글 정보를 적습니다.

```mdx
---
title: 키보드 이벤트를 제대로 다루는 법
description: keydown과 keyup, repeat, 그리고 포커스 기반으로 키 입력을 받는 이유
date: 2026-10-10
tags: [Svelte, 키보드]
draft: false
---
```

- `title`: 필수입니다.
- `description`: 한 줄 설명입니다. 태그 페이지, RSS, 공유 미리보기에 쓰입니다.
- `date`: 필수입니다. 목록은 최신 글부터 보입니다.
- `tags`: 태그마다 `/tags/태그/` 페이지가 자동으로 생깁니다.
- `draft: true`: 초안입니다. 개발 서버에서만 보이고, 빌드한 사이트에는 들어가지 않습니다. 다만 커밋하면 공개 저장소에서 원문이 보이니, 쓰는 중인 글은 아래 초안 폴더에 둡니다.
- `unlisted: true`: 일부 공개입니다. 글 페이지는 만들어져서 주소를 아는 사람은 들어갈 수 있지만, 글 목록·태그 페이지·RSS·사이트맵에는 나오지 않고 검색 엔진에도 싣지 않습니다. 이 글에만 있는 태그는 태그 페이지가 없어서 링크 없이 보입니다.

### 초안 폴더

저장소가 공개라서 커밋한 글은 `draft: true`여도 GitHub에서 원문을 누구나 볼 수 있습니다. 쓰는 중인 글은 `posts/_drafts/` 안에 둡니다.

| 파일 | 개발 서버 주소 |
| --- | --- |
| `posts/_drafts/hello.mdx` | `/posts/hello/` |
| `posts/_drafts/keyboard-events/index.mdx` | `/posts/keyboard-events/` |

- 이 폴더는 git에서 빠져 있어서(`.gitignore`) 커밋되지 않고, 개발 서버에서만 보입니다. `draft: true`를 적지 않아도 됩니다.
- 다 쓰면 파일(폴더째로 썼으면 폴더)을 `posts/` 바로 아래로 옮기고 커밋합니다. 주소에 초안 폴더 이름이 붙지 않아서, 옮겨도 주소가 그대로입니다.
- 커밋되지 않으니 이 컴퓨터에만 있습니다. 다른 컴퓨터에서 이어 쓰려면 따로 옮겨야 합니다.
- 초안 폴더와 바깥에 같은 이름의 글이 있으면 주소가 겹치니 피합니다.

## 2. 글 목록 미리보기와 `more`

글 목록에는 글의 앞부분만 보입니다. 어디까지 보일지는 `{/* more */}`로 정합니다.

```mdx
여기까지 목록에 보입니다. 데모를 넣으면 목록에서도 바로 해볼 수 있어요.

{/* more */}

여기부터는 글 페이지에서만 보입니다.
```

- `more`가 없으면 첫 문단까지만 보입니다.
- `{/* more */}`는 맨 바깥(다른 컴포넌트 안이 아닌 곳)에 둔 것만 셉니다. 코드 블록 안에 적힌 `{/* more */}`는 그냥 글자로 취급합니다. 규칙은 `src/lib/excerpt.mjs` 한 곳에 있습니다.
- `more` 앞에 데모가 있으면 목록에서도 그대로 동작합니다.
- `more` 뒤 내용은 목록 페이지에 **절대 들어가지 않습니다**. 목록은 앞부분만 잘라낸 별도 모듈로 그리기 때문에, 뒷부분은 컴파일조차 되지 않습니다.
- `npm run build`의 마지막에 누출 검사(`scripts/check-excerpt-leak.mjs`)가 자동으로 돕니다. 글 페이지가 아닌 곳(목록, 태그, RSS, 사이트맵 등)에 `more` 뒷부분 문장이 하나라도 있으면 빌드가 실패합니다.
- 목록의 "더 읽기"를 누르면 글 페이지로 가면서, 목록에서 읽던 미리보기가 있던 높이에 그다음 내용이 오도록 스크롤을 맞춥니다. 읽던 글이 그 자리에 그대로 있고 아래로 이어지는 느낌이 납니다. (`src/scripts/page-transition.js`)

## 3. 데모 만들기

데모는 Svelte 컴포넌트입니다. 글 폴더 안에 같이 두고, 여러 글에서 쓰는 데모는 `src/demos/`에 둡니다.

실제 예시는 견본 글의 마우스 데모(`posts/writing-components/PointerTrail.svelte`)에 있습니다.

### DemoFrame

데모는 `DemoFrame`으로 감쌉니다. 파란 손그림 상자, 안내 문구, "클릭해서 시작" 흐린 유리, 일시정지를 모두 처리해 줍니다.

```svelte
<script lang="ts">
  import DemoFrame from "@/demos/DemoFrame.svelte";

  function onkeydown(event: KeyboardEvent) {
    // ...
  }
</script>

<DemoFrame hint="방향키를 눌러보세요" {onkeydown}>
  {#snippet children({ active })}
    <!-- 데모 내용. active는 지금 조작 중인지 -->
  {/snippet}
</DemoFrame>
```

스크립트 쪽에서도 조작 중인지 알아야 하면(캔버스를 그리는 반복 등) `bind:active`로 받습니다.

```svelte
<script lang="ts">
  let active = $state(false);

  $effect(() => {
    if (!active) return; // 멈춰 있을 때는 그리지 않는다
    let frame = requestAnimationFrame(function loop() {
      // 매 프레임 그린다
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  });
</script>

<DemoFrame mode="pointer" hint="캔버스 위에서 움직여보세요" bind:active>
  {#snippet children()}<canvas></canvas>{/snippet}
</DemoFrame>
```

| 속성 | 설명 |
| --- | --- |
| `mode` | `"keyboard"`(기본) 또는 `"pointer"`(마우스·터치) |
| `hint` | 멈춰 있을 때 "클릭해서 시작" 아래에 보이는 안내. 손그림 모양도 이 글자로 정해집니다. |
| `activeHint` | 조작 중일 때 위쪽에 보이는 문구. 기본은 "● 입력 중" |
| `active` | 지금 조작 중인지. `bind:active`로 읽습니다. |
| `onkeydown`, `onkeyup` | keyboard 모드에서 데모에 포커스가 있을 때만 옵니다. Esc는 데모를 멈추는 데 쓰여서 넘어오지 않습니다. |
| `onpointermove`, `onpointerdown`, `onpointerup` | pointer 모드에서 시작한 뒤에만 옵니다. |
| `ondeactivate` | 멈출 때 불립니다. 누르고 있던 키 같은 상태를 여기서 정리합니다. |
| `seed` | 손그림 모양을 따로 고르고 싶을 때 |

멈추는 때는 이렇습니다. 데모 안의 버튼이나 입력칸으로 포커스가 옮겨가는 건 멈추지 않습니다.

- keyboard: 포커스가 데모 밖으로 나가거나 Esc를 누를 때
- pointer: 마우스가 0.5초 넘게 밖에 있거나, 바깥을 누르거나, 포커스가 밖으로 나가거나, Esc를 누를 때

지켜야 할 것이 있습니다.

- **키 이벤트를 `window`에 걸지 않습니다.** 목록에는 데모가 여러 개 있어서, `window`에 걸면 모든 데모가 동시에 반응하고 페이지 스크롤도 막힙니다. `DemoFrame`이 넘겨주는 이벤트만 씁니다.
- **멈춰 있을 때는 아무것도 계산하지 않습니다.** 애니메이션이나 `requestAnimationFrame`은 `active`일 때만 돌립니다.
- 캔버스 데모는 화면 배율(`devicePixelRatio`)과 상자 크기 변화에 맞춰 캔버스 크기를 다시 정해야 선이 흐리지 않습니다.

### 글에 넣기

```mdx
import KeyboardDemo from "./KeyboardDemo.svelte";

<KeyboardDemo client:visible />
```

`client:visible`을 꼭 붙입니다. 없으면 화면에 그려지기만 하고 동작하지 않습니다. 화면에 보일 때 데모 코드를 불러옵니다.

### "코드 보기" 붙이기 (DemoBox)

데모 아래에 펼쳐지는 "코드 보기"를 붙이려면 `DemoBox`로 감싸고, 보여줄 코드를 넘깁니다.

```mdx
import KeyboardDemo from "./KeyboardDemo.svelte";
import keyboardDemoSource from "./KeyboardDemo.svelte?raw";

<DemoBox code={keyboardDemoSource} file="KeyboardDemo.svelte">
  <KeyboardDemo client:visible />
</DemoBox>
```

- `?raw`로 불러오면 파일 내용이 글자 그대로 들어옵니다. 데모를 고치면 코드 보기도 같이 바뀝니다.
- `code`에는 아무 글자나 넣을 수 있습니다. 핵심만 줄인 코드를 따로 보여줘도 됩니다. 이때는 `file`에 "핵심만 줄인 코드"처럼 표시해 둡니다.
- `lang`으로 색칠할 언어를 고릅니다. 기본은 `svelte`입니다.
- 글 목록에서는 코드 보기 없이 데모만 보입니다.

## 4. 글쓰기 컴포넌트

아래 컴포넌트는 import 없이 바로 씁니다.

```mdx
<Callout type="tip" title="제목은 생략 가능">팁 상자. type은 note, tip, warn</Callout>

복사는 <Kbd>Ctrl</Kbd> + <Kbd>C</Kbd>

화면에 들어오면 <Mark>형광펜으로 칠해집니다</Mark>.

<Aside>메모를 달 문단 바로 앞에 둡니다. 넓은 화면에서는 오른쪽 여백에 적힙니다.</Aside>

<Diagram flow={["MDX", "satteri", "HTML"]} caption="간단한 흐름" />
```

- `Diagram`은 상자 위치를 직접 정할 수도 있습니다. `nodes`(col, row, tone, shape)와 `edges`(label, dashed)를 넘깁니다. 견본 글에 예시가 있습니다.

### 이미지 (Figure)

```mdx
import cat from "./cat.jpg";

<Figure src={cat} alt="위를 올려다보는 흰 고양이" caption="손글씨로 보이는 캡션" />
```

이미지는 글 폴더나 `src/assets/`에 두고 import합니다. `alt`는 꼭 적습니다.

### 다른 글로 가는 링크

사이트 안 주소는 끝에 `/`를 붙입니다. 예: `[키보드 이벤트 글](/posts/keyboard-events/)`. 빼먹으면 개발 서버에서 404가 나서 바로 알 수 있습니다. (`astro.config.mjs`의 `trailingSlash: "always"`)

## 5. 코드 블록

언어 뒤에 `title="파일명"`을 쓰면 코드 위에 파일명이 붙습니다. 복사 버튼은 모든 코드 블록에 자동으로 붙습니다.

````mdx
```ts title="src/lib/greet.ts"
export function greet(name: string) {
  return `안녕, ${name}!`;
}
```
````

## 6. 자동으로 되는 것

글만 쓰면 아래는 알아서 됩니다.

- **N 표시**: 올린 지 7일이 안 된 글의 날짜 옆에 붙습니다.
- **페이지네이션**: 목록은 한 페이지에 5개씩입니다. 개수는 `src/lib/posts.ts`의 `POSTS_PER_PAGE`에서 바꿉니다.
- **태그 페이지**: `/tags/`와 `/tags/태그/`
- **공유 미리보기 이미지**: 글마다 `/og/posts/글.png`가 만들어집니다. 제목, 날짜, 태그가 들어갑니다.
- **RSS**(`/rss.xml`)와 **사이트맵**(`/sitemap-index.xml`)

## 7. 올리기 전에

```sh
npm run build
npm run preview
```

빌드가 누출 검사까지 통과하면 `npm run preview`로 실제 사이트처럼 확인합니다. 초안은 빌드에 들어가지 않으니, 올릴 글은 초안 폴더에서 꺼내고 `draft`를 빼거나 `false`로 바꿉니다.
