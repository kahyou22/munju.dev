// @ts-check
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

import { moreMarkerPlugin } from './src/lib/more-marker.mjs';
import { roughMarkupPlugin } from './src/lib/rough-markup.mjs';
import { codeTitleTransformer, latencyDark, latencyLight } from './src/lib/shiki-themes.mjs';
import { excerptPlugin } from './src/lib/excerpt-vite-plugin.mjs';

// 검색 엔진에 싣지 않는 페이지(<meta name="robots" content="noindex">, 일부 공개 글 등)는 사이트맵에서도 뺀다.
// 글 정보를 다시 읽지 않고, 이미 빌드된 페이지를 보고 정한다. 사이트맵은 빌드가 끝난 뒤에 만들어지기 때문이다.
const distDir = fileURLToPath(new URL('./dist/', import.meta.url));
/** @param {string} page */
function isNoindex(page) {
  const file = `${distDir}${new URL(page).pathname.replace(/^\//, '')}index.html`;
  return existsSync(file) && /<meta name="robots" content="noindex"/.test(readFileSync(file, 'utf-8'));
}

// https://astro.build/config
export default defineConfig({
  // 검색 엔진·공유 미리보기·RSS·사이트맵에 쓰는 절대 주소의 기준
  site: 'https://munju.dev',
  // 주소 끝에는 늘 /를 붙인다. 개발 서버에서 /를 빠뜨린 링크는 404가 나서 바로 알 수 있다.
  trailingSlash: 'always',
  integrations: [
    mdx(),
    svelte(),
    // 검색 엔진에 싣지 않는 페이지는 빼고 싣는다. (404는 사이트맵이 알아서 뺀다)
    sitemap({ filter: (page) => !isNoindex(page) }),
  ],
  vite: {
    // 글 목록용 미리보기 모듈(`글.mdx?excerpt`)을 만든다. src/lib/excerpt-vite-plugin.mjs 참고
    plugins: [excerptPlugin()],
    build: {
      // 작은 글꼴 조각이 CSS 안에 base64로 박히지 않게 한다. 박히면 모든 페이지가 처음에 받는 CSS가
      // 쓰지도 않는 글꼴(옛 woff 포함)까지 품어서 수백 KB가 된다. 글꼴은 파일로 두고 필요한 것만 받게 한다.
      assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
    },
  },
  // 링크에 마우스를 올렸을 때만 다음 페이지를 미리 불러온다. (글 목록에 전체 글이 미리 전송되지 않게)
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  markdown: {
    // - more-marker: 글 페이지에서 미리보기가 끝나는 자리에 #more 앵커를 둔다.
    // - rough-markup: 인용문·표 같은 요소에 손그림 장식(data-rough)을 붙인다.
    processor: satteri({ mdastPlugins: [moreMarkerPlugin], hastPlugins: [roughMarkupPlugin] }),
    shikiConfig: {
      // 블로그 팔레트로 만든 코드 색. 다크 테마 색은 --shiki-dark 변수로 들어가고 prose.css에서 전환한다.
      themes: { light: latencyLight, dark: latencyDark },
      // ```ts title="파일명"의 파일명을 코드 위 이름표로 쓴다.
      transformers: [codeTitleTransformer],
    },
  },
});
