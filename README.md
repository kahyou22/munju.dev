# munju.dev

[munju.dev](https://munju.dev)

Astro + MDX 기반 블로그입니다. 글 안의 인터랙티브 데모는 Svelte로 작성합니다.

글을 쓰는 방법은 [글 쓰는 법](docs/writing-guide.md)에 정리되어 있습니다.

## 설치

Node.js 22.12.0 이상이 필요합니다.

```sh
git clone https://github.com/kahyou22/munju.dev.git
cd munju.dev
npm i
```

## 실행

```sh
npm run dev
```

## 빌드

```sh
npm run build
npm run preview
```

빌드 마지막에 글 목록에 `more` 뒷부분이 새어 들어가지 않았는지 자동으로 검사합니다. 따로 돌릴 때는 `npm run check:leak`을 씁니다.

타입 검사는 `npm run check`(astro check)로 합니다. `.astro` 파일까지 함께 검사합니다.

## 배포

Cloudflare Workers에 정적 파일로 올립니다. 설정은 `wrangler.jsonc`에 있습니다.

- `main`에 푸시하면 Cloudflare가 `npm run build`로 빌드하고 `npx wrangler deploy`로 올립니다. 빌드 끝의 누출 검사가 실패하면 배포되지 않습니다.
- 직접 올릴 때는 `npm run deploy`를 씁니다. 처음 한 번은 `npx wrangler login`이 필요합니다.
- Cloudflare에서와 같은 방식(주소 끝 `/`, 404 페이지)으로 미리 보려면 `npm run preview:worker`를 씁니다.
