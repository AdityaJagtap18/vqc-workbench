import { useEffect, useRef } from "react";

import type { DecisionBoundaryPoint } from "../../types/vqc";

const SIZE = 220;
const CLASS_COLORS = ["#315E9E", "#B5750A"];
const CLASS_BG = ["rgba(49,94,158,0.14)", "rgba(181,117,10,0.14)"];

export function DecisionBoundaryPlot({
  title,
  xs,
  ys,
  grid,
  trainPoints,
  testPoints,
}: {
  title: string;
  xs: number[];
  ys: number[];
  grid: number[][];
  trainPoints: DecisionBoundaryPoint[];
  testPoints: DecisionBoundaryPoint[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const xMin = xs[0];
  const xMax = xs[xs.length - 1];
  const yMin = ys[0];
  const yMax = ys[ys.length - 1];

  function toPixel(x: number, y: number): [number, number] {
    const px = ((x - xMin) / (xMax - xMin)) * SIZE;
    const py = SIZE - ((y - yMin) / (yMax - yMin)) * SIZE;
    return [px, py];
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);

    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    const cellW = SIZE / cols;
    const cellH = SIZE / rows;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const label = grid[i][j];
        ctx.fillStyle = CLASS_BG[label % CLASS_BG.length];
        const py = SIZE - (i + 1) * cellH;
        ctx.fillRect(j * cellW, py, cellW + 0.5, cellH + 0.5);
      }
    }

    function drawPoints(points: DecisionBoundaryPoint[], isTest: boolean) {
      for (const p of points) {
        const [px, py] = toPixel(p.x, p.y);
        ctx!.beginPath();
        ctx!.arc(px, py, isTest ? 3 : 2.5, 0, 2 * Math.PI);
        ctx!.fillStyle = CLASS_COLORS[p.label % CLASS_COLORS.length];
        ctx!.fill();
        if (isTest) {
          ctx!.lineWidth = 1;
          ctx!.strokeStyle = "#FFFFFF";
          ctx!.stroke();
        }
      }
    }
    drawPoints(trainPoints, false);
    drawPoints(testPoints, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, trainPoints, testPoints]);

  return (
    <div>
      <p className="mb-2 text-xs text-muted">{title}</p>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="rounded border border-border"
        style={{ width: SIZE, height: SIZE }}
      />
    </div>
  );
}
