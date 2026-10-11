<script lang="ts">
  import type { Snippet } from "svelte";
  import { fade } from "svelte/transition";
  import { roughDecor } from "@/lib/rough-action";

  // 모든 데모가 공유하는 틀. 멈춰 있을 때는 흐린 유리로 덮여 있다가 클릭하면 시작한다.
  // - keyboard: 클릭해서 포커스가 있을 때만 키 입력을 받는다. (window에 이벤트를 걸지 않는다)
  // - pointer: 마우스가 나가거나, 바깥을 누르거나, 포커스가 빠지거나, Esc를 누르면 다시 멈춘다.
  //   스크롤하다 마우스가 스치기만 해도 움직이는 일이 없게 하려는 것이다.
  // 포커스는 frame과 그 안쪽 전체를 하나로 본다. 데모 안의 버튼·입력칸으로 옮겨가도 멈추지 않는다.
  // 데모 스크립트에서 지금 조작 중인지 알아야 하면(캔버스 그리기 반복 등) bind:active로 받는다.
  interface Props {
    mode?: "keyboard" | "pointer";
    hint: string;
    activeHint?: string;
    /** 지금 조작 중인지. 데모 쪽에서 bind:active로 읽는다. */
    active?: boolean;
    onkeydown?: (event: KeyboardEvent) => void;
    onkeyup?: (event: KeyboardEvent) => void;
    /** pointer 모드의 마우스·터치 이벤트. 시작한 뒤에만 온다. */
    onpointermove?: (event: PointerEvent) => void;
    onpointerdown?: (event: PointerEvent) => void;
    onpointerup?: (event: PointerEvent) => void;
    /** 포커스를 잃거나 마우스가 나갔을 때. 누르고 있던 키 같은 상태를 정리한다. */
    ondeactivate?: () => void;
    /** 손그림 테두리 모양을 고르는 값. 기본값은 안내 문구라서 데모마다 다르게 생긴다. */
    seed?: string;
    children: Snippet<[{ active: boolean }]>;
  }

  let {
    mode = "keyboard",
    hint,
    activeHint = "● 입력 중",
    active = $bindable(false),
    onkeydown,
    onkeyup,
    onpointermove,
    onpointerdown,
    onpointerup,
    ondeactivate,
    seed,
    children,
  }: Props = $props();

  // 배경과 안쪽 흰 선은 rough.js로 그린다. 모양은 데모마다 다르다.
  const key = $derived(seed ?? hint);

  let frame = $state<HTMLDivElement>();

  function deactivate() {
    active = false;
    ondeactivate?.();
  }

  // 한 번이라도 시작했으면 "계속"이라고 쓴다.
  let played = $state(false);
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;

  function start() {
    active = true;
    played = true;
  }

  // pointer 모드: 시작 버튼은 누르면 사라지므로, 포커스를 frame으로 옮겨 둔다.
  // 그래야 키보드로 시작한 사람도 Tab이나 Esc로 빠져나가며 멈출 수 있다.
  function startPointer() {
    start();
    frame?.focus({ preventScroll: true });
  }

  /** 포커스가 frame 밖으로 나갔을 때만 멈춘다. */
  function handleFocusOut(event: FocusEvent) {
    if (!frame?.contains(event.relatedTarget as Node | null)) deactivate();
  }

  function prefersReducedMotion() {
    return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /** 흐린 유리가 걷히는 효과. 움직임 줄이기를 켠 사람에게는 바로 사라진다. */
  function lift(node: Element) {
    return fade(node, { duration: prefersReducedMotion() ? 0 : 250 });
  }

  // 마우스가 잠깐 삐져나간 정도로는 멈추지 않는다.
  function handlePointerLeave(event: PointerEvent) {
    if (event.pointerType !== "mouse" || !active) return;
    leaveTimer = setTimeout(deactivate, 500);
  }

  /** 시작한 뒤에만 데모에 넘긴다. */
  const whileActive =
    <E extends Event>(handler?: (event: E) => void) =>
    (event: E) => {
      if (active) handler?.(event);
    };

  // 터치는 손을 떼면 pointerleave가 오므로, 바깥을 눌렀을 때 멈춘다.
  $effect(() => {
    if (mode !== "pointer" || !active) return;
    const onDown = (event: PointerEvent) => {
      if (!frame?.contains(event.target as Node)) deactivate();
    };
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      clearTimeout(leaveTimer);
    };
  });

  // Esc는 데모에 넘기지 않고 멈추는 데 쓴다.
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      frame?.blur();
      deactivate();
      return;
    }
    if (mode === "keyboard") onkeydown?.(event);
  }
</script>

<div class="demo" class:active>
  <!-- 조작하는 동안 손그림 상자가 꿈틀거린다. (모양 4개를 미리 그려 두고 CSS로 돌린다) -->
  <span class="decor bg" aria-hidden="true" use:roughDecor={{ kind: "box", seed: `${key}:bg`, fill: true, radius: 16, boil: active }}></span>
  <span class="decor line-1" aria-hidden="true" use:roughDecor={{ kind: "box", seed: `${key}:line-1`, radius: 12, boil: active }}></span>
  {#if mode === "keyboard"}
    <!-- 키 입력을 데모가 받으려고 일부러 application 역할에 포커스를 준다. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <div
      class="frame"
      class:active
      bind:this={frame}
      role="application"
      aria-label={`데모: ${hint}`}
      tabindex="0"
      onfocusin={start}
      onfocusout={handleFocusOut}
      onkeydown={handleKeydown}
      {onkeyup}
    >
      {@render label()}
      {@render children({ active })}
      {#if !active}
        <!-- 누르면 아래의 frame에 포커스가 가도록 클릭은 통과시킨다. -->
        <div class="start" aria-hidden="true" out:lift>{@render cover()}</div>
      {/if}
    </div>
  {:else}
    <!-- 시작하면 포커스를 받아 두었다가(tabindex -1), 빠져나가거나 Esc를 누르면 멈춘다. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="frame"
      class:active
      bind:this={frame}
      role="group"
      aria-label={`데모: ${hint}`}
      tabindex="-1"
      onpointerenter={() => clearTimeout(leaveTimer)}
      onpointerleave={handlePointerLeave}
      onpointermove={whileActive(onpointermove)}
      onpointerdown={whileActive(onpointerdown)}
      onpointerup={whileActive(onpointerup)}
      onfocusout={handleFocusOut}
      onkeydown={handleKeydown}
    >
      {@render label()}
      <div class="screen" inert={!active}>
        {@render children({ active })}
      </div>
      {#if !active}
        <!-- 상자 전체를 덮는 흐린 유리. 아무 데나 누르면 시작한다. -->
        <button class="start" type="button" onclick={startPointer} out:lift>{@render cover()}</button>
      {/if}
    </div>
  {/if}
</div>

{#snippet label()}
  <div class="label">데모 · {active ? activeHint : hint}</div>
{/snippet}

<!-- 멈춰 있을 때 흐린 유리 위에 띄우는 글자 -->
{#snippet cover()}
  <span class="start-text">클릭해서 {played ? "계속" : "시작"}</span>
  <span class="start-hint">{hint}</span>
{/snippet}

<style>
  .demo {
    /* 데모 상자 색: 두 테마 공통. 밝은 라벤더빛 블루. 큰 굵은 글자 기준(3:1)을 넘는다(흰색 대비 3.1:1).
       데모 안의 컴포넌트(키, 점 등)도 이 색을 물려받아 쓴다. */
    --demo-bg: #7f8fd0;
    --demo-label: #ffffff;
    --demo-active: #ffffff;
    --key-bg: #fefefe;
    --key-border: #e5dbe8;
    --key-text: #4b4a57;
    --key-on-bg: #f7c3cc;
    --key-on-border: #f3b6c1;
    --key-on-text: #383637;
    --demo-dot: #fefefe;
    --demo-dot-2: #f7c3cc;
    position: relative;
    margin: 1.6em 0;
  }

  /* 손그림 장식을 그릴 자리. 그림은 rough-action이 넣는다. */
  .decor {
    position: absolute;
    isolation: isolate;
    pointer-events: none;
  }

  .bg {
    --rough-fill: var(--demo-bg);
    --rough-stroke: var(--demo-bg);
    --rough-stroke-width: 1.6;
    inset: 0;
  }

  /* 그리기 전(데모가 깨어나기 전)에는 평범한 파란 상자로 보인다. */
  .bg:not([data-rough-ready]) {
    border-radius: 16px;
    background: var(--demo-bg);
  }

  .line-1 {
    --rough-stroke: #fefefe;
    --rough-stroke-width: 1;
    inset: 7px;
    opacity: 0.7;
  }

  .frame {
    position: relative;
    padding: 14px 18px 18px;
    border-radius: 6px;
    overflow: hidden;
    outline: none;
    cursor: pointer;
  }

  .label {
    position: relative;
    margin-bottom: 8px;
    font-family: var(--font-hand);
    letter-spacing: var(--hand-tracking);
    font-size: 19px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--demo-label);
  }

  .active .label {
    color: var(--demo-active);
  }

  /* 멈춰 있을 때는 상자 전체를 흐린 유리로 덮고 글자만 띄운다. */
  .start {
    position: absolute;
    inset: 2px;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 15px;
    background: color-mix(in srgb, var(--demo-bg) 35%, transparent);
    -webkit-backdrop-filter: blur(3.5px);
    backdrop-filter: blur(3.5px);
    cursor: pointer;
    flex-direction: column;
    gap: 2px;
    animation: appear 0.3s ease-out;
  }

  div.start {
    pointer-events: none;
  }

  .start-text,
  .start-hint {
    position: relative;
    font-family: var(--font-hand);
    letter-spacing: var(--hand-tracking);
    font-weight: 700;
    line-height: 1.3;
    color: var(--demo-label);
    /* 뒤에 흐린 흰 키가 겹쳐도 읽히도록 글자 둘레를 데모 파랑으로 살짝 걷어낸다. */
    text-shadow:
      0 0 3px var(--demo-bg),
      0 0 8px var(--demo-bg),
      0 0 14px var(--demo-bg);
  }

  .start-text {
    font-size: 24px;
    animation: breathe 2.4s ease-in-out infinite;
    transition: transform 0.2s ease-out;
  }

  /* 무엇을 하는 데모인지 알려주는 한 줄. 흰 글자가 파랑 위에서 읽히는 최소 크기(굵게 19px)를 지킨다. */
  .start-hint {
    font-size: 19px;
  }

  .frame:hover .start-text,
  .start:focus-visible .start-text {
    animation-play-state: paused;
    transform: rotate(-2deg) scale(1.05);
  }

  /* 전역 손그림 포커스 링은 상자 전체를 두르니 끄고, 글자 둘레에만 그린다. */
  .start:focus-visible::after {
    display: none;
  }

  .start:focus-visible .start-text::after {
    content: "";
    position: absolute;
    inset: -4px -10px;
    border: 2px solid var(--demo-label);
    border-radius: 14px 10px 15px 9px / 10px 14px 9px 15px;
  }

  @keyframes appear {
    from {
      opacity: 0;
    }
  }

  /* 게임 시작 화면처럼 천천히 숨 쉬듯 깜빡인다. */
  @keyframes breathe {
    50% {
      opacity: 0.75;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .start,
    .start-text {
      animation: none;
      transition: none;
    }
  }
</style>
