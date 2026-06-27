import type { SportScienceLoad } from "./SportScienceMetrics"

type Props = {
  loads: SportScienceLoad[]
}

type ChartPoint = SportScienceLoad & {
  label: string
}

const WIDTH = 760
const HEIGHT = 320
const PADDING = {
  top: 24,
  right: 42,
  bottom: 44,
  left: 50,
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value == null) return "-"
  return value.toFixed(digits)
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
  })
}

function makePath(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
}

function makeAreaPath(points: Array<{ x: number; y: number }>, baselineY: number) {
  if (points.length === 0) return ""

  const linePath = makePath(points)
  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]

  return `${linePath} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`
}

function getTsbColor(value: number) {
  if (value >= 0) return "#15803d"
  if (value >= -10) return "#d97706"
  return "#dc2626"
}

function getStatus(loads: ChartPoint[]) {
  const latest = loads[loads.length - 1]

  if (!latest) {
    return {
      label: "Fara date",
      color: "#64748b",
      background: "#f1f5f9",
    }
  }

  if (latest.tsb > 10) {
    return {
      label: "Fresh",
      color: "#166534",
      background: "#dcfce7",
    }
  }

  if (latest.tsb >= -10) {
    return {
      label: "Asimilare",
      color: "#92400e",
      background: "#fef3c7",
    }
  }

  return {
    label: "Oboseala ridicata",
    color: "#991b1b",
    background: "#fee2e2",
  }
}

export default function TrainingLoadChart({ loads }: Props) {
  const points: ChartPoint[] = loads.map((load) => ({
    ...load,
    label: formatDate(load.date),
  }))
  const status = getStatus(points)

  if (points.length === 0) {
    return (
      <div className="sd-empty-state">
        <p>Nu exista date de incarcare pentru ultimele 90 de zile.</p>
      </div>
    )
  }

  const values = points.flatMap((point) => [point.ctl, point.atl, point.tsb, 0])
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const rangePadding = Math.max((rawMax - rawMin) * 0.12, 8)
  const minValue = Math.floor(rawMin - rangePadding)
  const maxValue = Math.ceil(rawMax + rangePadding)
  const chartWidth = WIDTH - PADDING.left - PADDING.right
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom

  const xForIndex = (index: number) => {
    if (points.length === 1) return PADDING.left + chartWidth / 2
    return PADDING.left + (index / (points.length - 1)) * chartWidth
  }

  const yForValue = (value: number) => {
    if (maxValue === minValue) return PADDING.top + chartHeight / 2
    return PADDING.top + ((maxValue - value) / (maxValue - minValue)) * chartHeight
  }

  const ctlPoints = points.map((point, index) => ({ x: xForIndex(index), y: yForValue(point.ctl) }))
  const atlPoints = points.map((point, index) => ({ x: xForIndex(index), y: yForValue(point.atl) }))
  const zeroY = yForValue(0)
  const tickValues = [maxValue, Math.round((maxValue + minValue) / 2), minValue]
  const labelIndexes = Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]))
  const barGap = points.length > 45 ? 1 : 3
  const barWidth = Math.max(3, Math.min(14, chartWidth / points.length - barGap))
  const latest = points[points.length - 1]

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "13px", color: "#666", textTransform: "uppercase", fontWeight: "bold" }}>
            Performance Management Chart
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "3px" }}>
            CTL fitness, ATL fatigue si TSB form pe ultimele {points.length} zile.
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", fontSize: "12px" }}>
          <span style={{ padding: "3px 9px", border: "1px solid #bfdbfe", color: "#1e40af", background: "#eff6ff", borderRadius: "3px", fontWeight: "bold" }}>
            CTL {formatNumber(latest.ctl)}
          </span>
          <span style={{ padding: "3px 9px", border: "1px solid #fecaca", color: "#b91c1c", background: "#fef2f2", borderRadius: "3px", fontWeight: "bold" }}>
            ATL {formatNumber(latest.atl)}
          </span>
          <span style={{ padding: "3px 9px", color: status.color, background: status.background, borderRadius: "3px", fontWeight: "bold" }}>
            TSB {formatNumber(latest.tsb)} - {status.label}
          </span>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg
          role="img"
          aria-label="Performance Management Chart pentru CTL, ATL si TSB"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ display: "block", width: "100%", minWidth: "620px", height: "auto" }}
        >
          <defs>
            <linearGradient id="pmcAtlArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#fff" />

          {tickValues.map((tick) => {
            const y = yForValue(tick)
            return (
              <g key={tick}>
                <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text x={PADDING.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
                  {tick}
                </text>
              </g>
            )
          })}

          <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={zeroY} y2={zeroY} stroke="#334155" strokeDasharray="4 4" strokeWidth="1.2" />
          <text x={WIDTH - PADDING.right + 8} y={zeroY + 4} fontSize="11" fill="#334155">
            0
          </text>

          {points.map((point, index) => {
            const x = xForIndex(index) - barWidth / 2
            const valueY = yForValue(point.tsb)
            const y = point.tsb >= 0 ? valueY : zeroY
            const height = Math.max(2, Math.abs(zeroY - valueY))

            return (
              <rect
                key={`${point.label}-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={height}
                fill={getTsbColor(point.tsb)}
                opacity="0.72"
                rx="1"
              >
                <title>{`${point.label}: TSB ${formatNumber(point.tsb)}, CTL ${formatNumber(point.ctl)}, ATL ${formatNumber(point.atl)}`}</title>
              </rect>
            )
          })}

          <path d={makeAreaPath(atlPoints, yForValue(minValue))} fill="url(#pmcAtlArea)" />
          <path d={makePath(atlPoints)} fill="none" stroke="#dc2626" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <path d={makePath(ctlPoints)} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />

          {labelIndexes.map((index) => {
            const x = xForIndex(index)
            return (
              <text key={index} x={x} y={HEIGHT - 18} textAnchor="middle" fontSize="11" fill="#64748b">
                {points[index].label}
              </text>
            )
          })}

          <g transform={`translate(${PADDING.left}, ${HEIGHT - 8})`}>
            <line x1="0" x2={chartWidth} y1="0" y2="0" stroke="#cbd5e1" />
          </g>
        </svg>
      </div>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "12px", color: "#555" }}>
        <span><strong style={{ color: "#2563eb" }}>CTL</strong> fitness pe termen lung</span>
        <span><strong style={{ color: "#dc2626" }}>ATL</strong> oboseala acuta</span>
        <span><strong style={{ color: "#15803d" }}>TSB pozitiv</strong> fresh</span>
        <span><strong style={{ color: "#dc2626" }}>TSB negativ</strong> risc de suprasolicitare</span>
      </div>
    </div>
  )
}
