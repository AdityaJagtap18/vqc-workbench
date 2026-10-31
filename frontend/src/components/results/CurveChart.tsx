import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function CurveChart({
  points,
  xKey,
  yKey,
  xLabel,
  yLabel,
}: {
  points: { x: number; y: number }[];
  xKey: string;
  yKey: string;
  xLabel: string;
  yLabel: string;
}) {
  const data = points.map((p) => ({ [xKey]: p.x, [yKey]: p.y }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E3E7ED" />
        <XAxis dataKey={xKey} tick={{ fontSize: 9 }} label={{ value: xLabel, position: "insideBottom", fontSize: 10, offset: -2 }} domain={[0, 1]} type="number" />
        <YAxis dataKey={yKey} tick={{ fontSize: 9 }} label={{ value: yLabel, angle: -90, fontSize: 10 }} domain={[0, 1]} />
        <Tooltip />
        <Line type="monotone" dataKey={yKey} stroke="#315E9E" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
