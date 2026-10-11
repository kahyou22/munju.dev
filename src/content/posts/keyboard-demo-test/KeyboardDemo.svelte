<script lang="ts">
  import { SvelteSet } from "svelte/reactivity";
  import DemoFrame from "@/demos/DemoFrame.svelte";
  import { roughDecor } from "@/lib/rough-action";
  import { ROUGH_PRESETS } from "@/lib/rough";

  type LogEntry = { id: number; type: "keydown" | "keyup"; key: string; repeat: boolean };

  const KEYS = [
    { key: "ArrowUp", label: "↑", area: "up" },
    { key: "ArrowLeft", label: "←", area: "left" },
    { key: "ArrowDown", label: "↓", area: "down" },
    { key: "ArrowRight", label: "→", area: "right" },
  ];

  const pressed = new SvelteSet<string>();
  let log = $state<LogEntry[]>([]);
  let nextId = 0;

  function record(type: LogEntry["type"], event: KeyboardEvent) {
    log = [{ id: nextId++, type, key: event.key, repeat: event.repeat }, ...log].slice(0, 4);
  }

  function onkeydown(event: KeyboardEvent) {
    if (!KEYS.some((k) => k.key === event.key)) return;
    event.preventDefault();
    pressed.add(event.key);
    record("keydown", event);
  }

  function onkeyup(event: KeyboardEvent) {
    if (!KEYS.some((k) => k.key === event.key)) return;
    pressed.delete(event.key);
    record("keyup", event);
  }
</script>

<DemoFrame hint="방향키를 눌러보세요" {onkeydown} {onkeyup} ondeactivate={() => pressed.clear()}>
  {#snippet children({ active })}
    <div class="body">
      <div class="keys">
        {#each KEYS as k (k.key)}
          <span class="key" class:on={pressed.has(k.key)} style:grid-area={k.area}
            ><span class="key-shape" aria-hidden="true" use:roughDecor={{ kind: "box", seed: `key:${k.key}`, fill: true, radius: 9, ...ROUGH_PRESETS.chip }}></span
            >{#if pressed.has(k.key)}
              <!-- 눌린 동안은 화살표 대신 웃는 얼굴(^o^)이 된다. -->
              <svg class="face" viewBox="0 0 18 16" aria-hidden="true">
                <path d="M2 6.5 4.5 3.5 7 6.5M11 6.5 13.5 3.5 16 6.5" />
                <path d="M7 9.5h4c0 2.6-.9 4-2 4s-2-1.4-2-4z" />
              </svg>
              <span class="sr-only">{k.label}</span>
            {:else}
              {k.label}
            {/if}</span
          >
        {/each}
      </div>
      <ol class="log" aria-live="polite">
        {#each log as entry (entry.id)}
          <li><span class="type">{entry.type}</span> {entry.key}{entry.repeat ? " (repeat)" : ""}</li>
        {:else}
          <li class="empty">{active ? "방향키를 눌러보세요" : "이벤트가 여기에 표시돼요"}</li>
        {/each}
      </ol>
    </div>
  {/snippet}
</DemoFrame>

<style>
  .body {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px 24px;
  }

  .keys {
    display: grid;
    grid-template-areas: ". up ." "left down right";
    gap: 5px;
  }

  .key {
    position: relative;
    z-index: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 28px;
    color: var(--key-text);
    font-size: 14px;
  }

  /* 키 모양은 rough.js로 그린다. 키마다 모양이 다르다. */
  .key-shape {
    --rough-fill: var(--key-bg);
    --rough-stroke: var(--key-border);
    --rough-stroke-width: 1;
    position: absolute;
    inset: 0;
    z-index: -1;
    isolation: isolate;
  }

  .key-shape:not([data-rough-ready]) {
    border: 1px solid var(--key-border);
    border-radius: 9px;
    background: var(--key-bg);
  }

  .key.on {
    color: var(--key-on-text);
  }

  .face {
    width: 18px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
    animation: pop 0.18s ease-out;
  }

  /* 얼굴이 나올 때 살짝 튀어나온다. */
  @keyframes pop {
    from {
      transform: scale(0.6);
    }
    60% {
      transform: scale(1.15);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .face {
      animation: none;
    }
  }

  .key.on .key-shape {
    --rough-fill: var(--key-on-bg);
    --rough-stroke: var(--key-on-border);
  }

  .log {
    flex: 1;
    min-width: 150px;
    white-space: nowrap;
    margin: 0;
    padding: 0;
    list-style: none;
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.7;
    color: var(--demo-label);
  }

  .type {
    color: var(--demo-active);
  }

  .empty {
    font-family: var(--font-sans);
  }
</style>
