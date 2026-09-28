import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Force a color: "auto" derives from first vs last value. */
  tone?: "auto" | "accent" | "muted";
  fill?: boolean;
  strokeWidth?: number;
  className?: string;
  title?: string;
}

/**
 * Tiny deterministic line chart for metric cards and quote rows.
 * Pure SVG — no charting dependency, no glow, no gradients.
 */
export function Sparkline({
  data,
  width = 96,
  height = 28,
  tone = "auto",
  fill = true,
  strokeWidth = 1.5,
  className,
  title,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className={className} aria-hidden />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = strokeWidth + 0.5;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = pad + (1 - (value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;

  const rising = data[data.length - 1] >= data[0];
  const color =
    tone === "accent"
      ? "text-accent"
      : tone === "muted"
        ? "text-muted"
        : rising
          ? "text-positive"
          : "text-negative";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", color)}
      role="img"
      aria-label={title ?? "Trend"}
    >
      {fill && <path d={area} className="fill-current opacity-[0.07]" />}
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fs-draw"
        style={{ ["--fs-dash" as string]: `${width * 2}` }}
      />
    </svg>
  );
}
