<script lang="ts">
  import DemoFrame from "@/demos/DemoFrame.svelte";

  type Dot = { id: number; x: number; y: number; alt: boolean };

  /** 점이 사라지는 데 걸리는 시간(ms). CSS 애니메이션 길이도 이 값을 쓴다. */
  const LIFETIME = 700;

  let dots = $state<Dot[]>([]);
  let position = $state<{ x: number; y: number } | null>(null);
  let stage = $state<HTMLDivElement>();
  let nextId = 0;

  function onpointermove(event: PointerEvent) {
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    position = { x, y };
    const dot = { id: nextId++, x, y, alt: nextId % 3 === 0 };
    dots = [...dots, dot];
    setTimeout(() => {
      dots = dots.filter((d) => d.id !== dot.id);
    }, LIFETIME);
  }
</script>

<DemoFrame mode="pointer" hint="마우스로 점을 그려보세요" activeHint="● 따라가는 중" {onpointermove}>
  {#snippet children()}
    <div class="stage" bind:this={stage}>
      {#each dots as dot (dot.id)}
        <span class="dot" class:alt={dot.alt} style:left="{dot.x}px" style:top="{dot.y}px" style:animation-duration="{LIFETIME}ms"></span>
      {/each}
      <span class="readout">{position ? `x: ${position.x}, y: ${position.y}` : "x: -, y: -"}</span>
    </div>
  {/snippet}
</DemoFrame>

<style>
  .stage {
    position: relative;
    height: 150px;
    cursor: crosshair;
    touch-action: none;
  }

  .dot {
    position: absolute;
    width: 10px;
    height: 10px;
    margin: -5px 0 0 -5px;
    border-radius: 50%;
    background: var(--demo-dot);
    animation: fade ease-out forwards;
    pointer-events: none;
  }

  .dot.alt {
    background: var(--demo-dot-2);
  }

  .readout {
    position: absolute;
    right: 0;
    bottom: 0;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--demo-label);
  }

  @keyframes fade {
    to {
      opacity: 0;
      transform: scale(0.3);
    }
  }
</style>
