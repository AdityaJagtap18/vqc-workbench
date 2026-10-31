export function ConfusionMatrix({ matrix, classNames }: { matrix: number[][]; classNames: string[] }) {
  const max = Math.max(...matrix.flat());
  return (
    <table className="border-collapse text-xs">
      <thead>
        <tr>
          <th></th>
          {classNames.map((c) => (
            <th key={c} className="px-2 pb-1 font-medium text-muted">
              pred {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {matrix.map((row, i) => (
          <tr key={i}>
            <th className="pr-2 text-right font-medium text-muted">true {classNames[i]}</th>
            {row.map((value, j) => {
              const intensity = max > 0 ? value / max : 0;
              return (
                <td
                  key={j}
                  className="h-10 w-16 border border-border text-center font-mono-tech"
                  style={{ background: `rgba(49, 94, 158, ${0.08 + intensity * 0.35})` }}
                >
                  {value}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
