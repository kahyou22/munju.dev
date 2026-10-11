// 손그림 다이어그램의 배치와 도형 계산. 빌드할 때 rough.js로 SVG 경로를 만든다.
// 노드는 칸(col, row)에 놓이고, 연결선은 상자 테두리에서 테두리로 살짝 휘어진 화살표로 그린다.
// 같은 seed는 항상 같은 모양이 나온다.
import { between } from "./hand-drawn";
import { roughBox, roughCurve, roughLinearPath } from "./rough";
import { BOIL_FRAMES, frameSeed } from "./rough-decor";

export type DiagramTone = "default" | "accent" | "highlight" | "tip" | "muted";
export type DiagramShape = "box" | "pill" | "text";

export interface DiagramNode {
  id: string;
  label: string;
  col: number;
  row: number;
  tone?: DiagramTone;
  shape?: DiagramShape;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

export interface LaidOutNode {
  index: number;
  tone: DiagramTone;
  shape: DiagramShape;
  cx: number;
  cy: number;
  lines: string[];
  /** 상자 모양. 0번이 평소 모양이고, 1~3번은 마우스를 올렸을 때 번갈아 보여서 꿈틀거린다. */
  frames: { fills: string[]; strokes: string[] }[];
}

export interface LaidOutEdge {
  from: number;
  to: number;
  dashed: boolean;
  label?: string;
  labelX: number;
  labelY: number;
  /** 가로로 누운 선은 라벨을 위에 가운데 정렬, 세로로 선 선은 오른쪽 옆에 붙인다. */
  labelAnchor: "middle" | "start";
  strokes: string[];
}

const CELL_W = 200;
const CELL_H = 112;
const FONT = 18;
const LINE_HEIGHT = 22;
const GAP = 7;

/** 다이어그램은 다른 손그림보다 조금 더 크게 흔든다. */
const WOBBLE = 2;

function textWidth(line: string): number {
  let width = 0;
  for (const char of line) {
    if (/[ㄱ-힝]/.test(char)) width += FONT * 0.8;
    else if (char === " ") width += FONT * 0.3;
    else width += FONT * 0.52;
  }
  return width;
}



type Box = { cx: number; cy: number; hw: number; hh: number };

/** 상자 중심에서 target 쪽으로 나가는 선이 상자 테두리와 만나는 점 (조금 띄워서) */
function edgePoint(box: Box, tx: number, ty: number) {
  const dx = tx - box.cx;
  const dy = ty - box.cy;
  const t = Math.min(dx === 0 ? Infinity : box.hw / Math.abs(dx), dy === 0 ? Infinity : box.hh / Math.abs(dy));
  const len = Math.hypot(dx, dy) || 1;
  return { x: box.cx + dx * t + (dx / len) * GAP, y: box.cy + dy * t + (dy / len) * GAP };
}

export function layoutDiagram(nodes: DiagramNode[], edges: DiagramEdge[], seed: string) {
  const cols = Math.max(1, ...nodes.map((n) => n.col + 1));
  const rows = Math.max(1, ...nodes.map((n) => n.row + 1));
  const width = cols * CELL_W;
  const height = rows * CELL_H;

  const boxes = new Map<string, Box & { index: number }>();
  const laidNodes: LaidOutNode[] = nodes.map((node, index) => {
    const shape = node.shape ?? "box";
    const lines = node.label.split("\n");
    const w = Math.min(CELL_W - 24, Math.max(96, Math.max(...lines.map(textWidth)) + 40));
    const h = Math.max(52, lines.length * LINE_HEIGHT + 26);
    const cx = node.col * CELL_W + CELL_W / 2;
    const cy = node.row * CELL_H + CELL_H / 2;
    boxes.set(node.id, { cx, cy, hw: w / 2, hh: h / 2, index });

    const key = `${seed}:${node.id}`;
    const frames =
      shape === "text"
        ? []
        : Array.from({ length: BOIL_FRAMES }, (_, frame) =>
            roughBox(cx - w / 2, cy - h / 2, w, h, frameSeed(key, frame), {
              radius: shape === "pill" ? h / 2 : 14,
              fill: true,
              roughness: between(key, 0.9, 1.4, "roughness"),
              bowing: between(key, 0.8, 1.6, "bowing"),
              maxRandomnessOffset: WOBBLE,
            }),
          );
    return { index, tone: node.tone ?? "default", shape, cx, cy, lines, frames };
  });

  const laidEdges: LaidOutEdge[] = [];
  for (const edge of edges) {
    const a = boxes.get(edge.from);
    const b = boxes.get(edge.to);
    if (!a || !b) throw new Error(`Diagram: 연결선의 노드를 찾을 수 없어요 (${edge.from} → ${edge.to})`);

    const key = `${seed}:${edge.from}->${edge.to}`;
    const p0 = edgePoint(a, b.cx, b.cy);
    const p1 = edgePoint(b, a.cx, a.cy);
    const len = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
    // 선을 살짝 휘게 한다. 휘는 방향과 정도는 연결선마다 다르다.
    const bend = between(key, -0.12, 0.12, "bend") * len;
    const nx = -(p1.y - p0.y) / len;
    const ny = (p1.x - p0.x) / len;
    const ctrl = { x: (p0.x + p1.x) / 2 + nx * bend, y: (p0.y + p1.y) / 2 + ny * bend };

    const line = roughCurve(
      [
        [p0.x, p0.y],
        [ctrl.x, ctrl.y],
        [p1.x, p1.y],
      ],
      key,
      { roughness: 0.9, bowing: 0.6, maxRandomnessOffset: WOBBLE },
    );

    // 화살촉: 끝점에서 들어오는 방향 기준으로 양쪽 짧은 선
    const tx = p1.x - ctrl.x;
    const ty = p1.y - ctrl.y;
    const tl = Math.hypot(tx, ty) || 1;
    const ux = tx / tl;
    const uy = ty / tl;
    const head = (angle: number): [number, number] => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [p1.x - (ux * cos - uy * sin) * 11, p1.y - (uy * cos + ux * sin) * 11];
    };
    // bowing은 rough.js 기본값(1)을 그대로 쓴다.
    const arrow = roughLinearPath([head(0.45), [p1.x, p1.y], head(-0.45)], `${key}:head`, { roughness: 0.7, bowing: 1, maxRandomnessOffset: WOBBLE });

    const midX = 0.25 * p0.x + 0.5 * ctrl.x + 0.25 * p1.x;
    const midY = 0.25 * p0.y + 0.5 * ctrl.y + 0.25 * p1.y;
    const vertical = Math.abs(p1.y - p0.y) > Math.abs(p1.x - p0.x);

    laidEdges.push({
      from: a.index,
      to: b.index,
      dashed: edge.dashed ?? false,
      label: edge.label,
      labelX: vertical ? midX + 10 : midX,
      labelY: vertical ? midY : midY - 13,
      labelAnchor: vertical ? "start" : "middle",
      strokes: [...line, ...arrow],
    });
  }

  return { width, height, nodes: laidNodes, edges: laidEdges, lineHeight: LINE_HEIGHT };
}
