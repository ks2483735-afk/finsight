import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

interface LineChartProps {
  data: number[];
  /** X-axis labels (equally spaced, rendered left → right). */
  labels?: string[];
  height?: number;
  /** Currency prefix for y-axis values. */
  prefix?: string;
  className?: string;
  /** Compact axis values (26.5K). */
  compactAxis?: boolean;
}

function axisLabel(value: number, prefix: string, compact: boolean): string {
  if (compact && Math.abs(value) >= 1000) {
    return `${prefix}${formatNumber(value / 1000, 1)}K`;
  }
  return `${prefix}${formatNumber(value, Math.abs(value) >= 1000 ? 0 : 2)}`;
}

const GRID = [0, 0.25, 0.5, 0.75, 1];
const PAD_TOP = 10;
const PAD_BOTTOM = 6;
const LABEL_GUTTER = 58;

/**
 * Clean line/area chart for panel views: subtle grid, right value axis,
 * bottom time axis. Axis labels are HTML (never distorted by scaling);
 * the SVG stretches uniformly. Static by design — no hover effects in v0.1.
 */
export function LineChart({
  data,
  labels,
  height = 200,
  prefix = "",
  className,
  compactAxis = false,
}: LineChartProps) {
  if (!data || data.length < 2) return null;

  const viewBoxH = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;

  // X spans 0..1000 in viewBox units; Y respects top/bottom padding.
  const xAt = (i: number) => (i / (data.length - 1)) * 1000;
  const yAt = (v: number) =>
    PAD_TOP + (1 - (v - min) / span) * (viewBoxH - PAD_TOP - PAD_BOTTOM);

  const path = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`)
    .join(" ");
  const baseline = viewBoxH - PAD_BOTTOM;
  const area = `${path} L1000,${baseline} L0,${baseline} Z`;

  const rising = data[data.length - 1] >= data[0];

  return (
    <div className={cn("w-full", className)}>
      <div className="relative" style={{ height: viewBoxH }}>
        {/* Plot area (labels live outside the SVG to avoid distortion) */}
        <svg
          viewBox={`0 0 1000 ${viewBoxH}`}
          preserveAspectRatio="none"
          className="absolute inset-y-0 left-0"
          style={{ width: `calc(100% - ${LABEL_GUTTER}px)` }}
          role="img"
          aria-label="Price chart"
        >
          {GRID.map((t) => {
            const y = PAD_TOP + t * (viewBoxH - PAD_TOP - PAD_BOTTOM);
            return (
              <line
                key={t}
                x1={0}
                x2={1000}
                y1={y}
                y2={y}
                stroke="#242424"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          <path
            d={area}
            className={rising ? "fill-positive" : "fill-negative"}
            opacity={0.06}
          />
          <path
            d={path}
            fill="none"
            stroke={rising ? "#4ade80" : "#f87171"}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="fs-draw"
            style={{ ["--fs-dash" as string]: "2400" }}
          />
        </svg>

        {/* Right-hand value axis (HTML — crisp at every width) */}
        <div
          className="absolute inset-y-0 right-0 text-2xs text-faint"
          style={{ width: LABEL_GUTTER }}
          aria-hidden
        >
          {GRID.map((t) => (
            <span
              key={t}
              className="absolute left-2 tnum"
              style={{
                top: `calc(${PAD_TOP}px + ${t} * (100% - ${PAD_TOP + PAD_BOTTOM}px) - 6px)`,
              }}
            >
              {axisLabel(max - t * span, prefix, compactAxis)}
            </span>
          ))}
        </div>
      </div>

      {labels && labels.length > 0 && (
        <div
          className="mt-1.5 flex justify-between text-2xs text-faint"
          style={{ paddingRight: LABEL_GUTTER }}
        >
          {labels.map((label, i) => (
            <span key={`${label}-${i}`}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
