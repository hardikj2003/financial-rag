"use client";

/**
 * Dependency-free SVG charts. Kept tiny and self-contained to avoid pulling a
 * charting library; sufficient for trend lines and category bars.
 */

interface SeriesPoint {
  label: string;
  value: number;
}

export function LineChart({
  data,
  height = 140,
  stroke = "#3b82f6",
  format = (n: number) => String(n),
}: {
  data: SeriesPoint[];
  height?: number;
  stroke?: string;
  format?: (n: number) => string;
}) {
  if (data.length === 0) {
    return <EmptyChart height={height} />;
  }

  const width = 600;
  const pad = 8;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = height - pad - ((d.value - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${path} L ${points[points.length - 1][0].toFixed(1)} ${height - pad} L ${points[0][0].toFixed(1)} ${height - pad} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height }}
      >
        <defs>
          <linearGradient id={`g-${stroke}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#g-${stroke})`} />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill={stroke} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>{data[0]?.label}</span>
        <span className="text-slate-400">
          peak {format(max)}
        </span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export function BarList({
  data,
  format = (n: number) => String(n),
  color = "bg-blue-500",
}: {
  data: SeriesPoint[];
  format?: (n: number) => string;
  color?: string;
}) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">No data yet</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-slate-300" title={d.label}>
            {d.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right font-mono text-xs text-slate-400">
            {format(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-dashed border-slate-700 text-xs text-slate-500"
      style={{ height }}
    >
      No data in this window
    </div>
  );
}
