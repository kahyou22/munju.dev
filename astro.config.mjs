// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  // 검색 엔진·공유 미리보기·RSS·사이트맵에 쓰는 절대 주소의 기준
  site: 'https://munju.dev',
  // 주소 끝에는 늘 /를 붙인다. 개발 서버에서 /를 빠뜨린 링크는 404가 나서 바로 알 수 있다.
  trailingSlash: 'always',
  integrations: [mdx(), svelte()],
  vite: {
    build: {
      // 작은 글꼴 조각이 CSS 안에 base64로 박히지 않게 한다. 박히면 모든 페이지가 처음에 받는 CSS가
      // 쓰지도 않는 글꼴(옛 woff 포함)까지 품어서 수백 KB가 된다. 글꼴은 파일로 두고 필요한 것만 받게 한다.
      assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
    },
  },
  // 링크에 마우스를 올렸을 때만 다음 페이지를 미리 불러온다. (글 목록에 전체 글이 미리 전송되지 않게)
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
