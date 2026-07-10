"use client"

import { useState } from "react"

type LoadQualityPoint = {
  date: string
  label: string
  athleteCount: number
  monotony: number | null
  strain: number | null
  acRatio: number | null
}

type Props = {
  points: LoadQualityPoint[]
}

const WIDTH = 760
const HEIGHT = 340
const PADDING = {
  top: 24,
  right: 56,
  bottom: 44,
  left: 56,
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return "-"
  return value.toFixed(digits)
}

function getRiskLabel(acRatio: number | null | undefined) {
  if (acRatio == null) return { label: "Fara date", color: "#64748b", background: "#f1f5f9" }
  if (acRatio < 0.8) return { label: "Detraining", color: "#92400e", background: "#fef3c7" }
  if (acRatio <= 1.3) return { label: "Safe", color: "#166534", background: "#dcfce7" }
  if (acRatio <= 1.5) return { label: "Caution", color: "#b45309", background: "#ffedd5" }
  return { label: "High risk", color: "#991b1b", background: "#fee2e2" }
}

export default function LoadQualityChart({ points: allPoints }: Props) {
  const [days, setDays] = useState(42)

  const points = allPoints.slice(Math.max(0, allPoints.length - days))

  if (points.length === 0) {
    return (
      <div className="sd-empty-state">
        <p>Nu exista suficiente daily loads pentru a construi Load Quality Chart.</p>
      </div>
    )
  }

  const chartWidth = WIDTH - PADDING.left - PADDING.right
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom
  const latest = points[points.length - 1]
  const maxStrain = Math.max(...points.map((point) => point.strain ?? 0), 100)
  const maxRightAxis = Math.max(...points.flatMap((point) => [point.monotony ?? 0, point.acRatio ?? 0, 1.3, 0.8]), 3)
  const rightAxisMax = Math.max(3, Math.ceil(maxRightAxis * 10) / 10)
  const barGap = points.length > 32 ? 2 : 4
  const barWidth = Math.max(5, Math.min(16, chartWidth / points.length - barGap))
  const labelIndexes = Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]))
  const latestRisk = getRiskLabel(latest.acRatio)

  const xForIndex = (index: number) => {
    if (points.length === 1) return PADDING.left + chartWidth / 2
    return PADDING.left + (index / (points.length - 1)) * chartWidth
  }

  const yForStrain = (value: number) => {
    return PADDING.top + chartHeight - (value / maxStrain) * chartHeight
  }

  const yForRightAxis = (value: number) => {
    return PADDING.top + chartHeight - (value / rightAxisMax) * chartHeight
  }

  const monotonyPath = points
    .map((point, index) => {
      const y = yForRightAxis(point.monotony ?? 0)
      return `${index === 0 ? "M" : "L"} ${xForIndex(index)} ${y}`
    })
    .join(" ")

  const acRatioPath = points
    .map((point, index) => {
      const y = yForRightAxis(point.acRatio ?? 0)
      return `${index === 0 ? "M" : "L"} ${xForIndex(index)} ${y}`
    })
    .join(" ")

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "13px", color: "#666", textTransform: "uppercase", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
            Load Quality Chart
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{
                padding: "2px 6px",
                fontSize: "12px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#fff",
                color: "#333",
                cursor: "pointer",
                fontWeight: "normal",
                textTransform: "none"
              }}
            >
              <option value={7}>Ultimele 7 zile</option>
              <option value={14}>Ultimele 14 zile</option>
              <option value={42}>Ultimele 42 zile</option>
              <option value={90}>Ultimele 90 zile</option>
            </select>
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "3px" }}>
            Strain zilnic, monotony si A:C Ratio mediu pentru lotul antrenorului de fitness.
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "12px" }}>
          <span style={{ padding: "3px 9px", border: "1px solid #dbeafe", color: "#1d4ed8", background: "#eff6ff", borderRadius: "3px", fontWeight: "bold" }}>
            Monotony {formatNumber(latest.monotony)}
          </span>
          <span style={{ padding: "3px 9px", border: "1px solid #fde68a", color: "#92400e", background: "#fffbeb", borderRadius: "3px", fontWeight: "bold" }}>
            Strain {formatNumber(latest.strain, 0)}
          </span>
          <span style={{ padding: "3px 9px", color: latestRisk.color, background: latestRisk.background, borderRadius: "3px", fontWeight: "bold" }}>
            A:C {formatNumber(latest.acRatio)} - {latestRisk.label}
          </span>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg
          role="img"
          aria-label="Load Quality Chart pentru strain, monotony si A:C ratio"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ display: "block", width: "100%", minWidth: "620px", height: "auto" }}
        >
          <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#fff" />

          {[0, maxStrain / 2, maxStrain].map((tick, index) => {
            const roundedTick = Math.round(tick)
            const y = yForStrain(tick)
            return (
              <g key={`left-${index}`}>
                <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text x={PADDING.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
                  {roundedTick}
                </text>
              </g>
            )
          })}

          <rect
            x={PADDING.left}
            y={yForRightAxis(1.3)}
            width={chartWidth}
            height={yForRightAxis(0.8) - yForRightAxis(1.3)}
            fill="#dcfce7"
            opacity="0.55"
          />

          {[0, rightAxisMax / 2, rightAxisMax].map((tick, index) => {
            const y = yForRightAxis(tick)
            return (
              <text key={`right-${index}`} x={WIDTH - PADDING.right + 10} y={y + 4} fontSize="11" fill="#64748b">
                {tick.toFixed(1)}
              </text>
            )
          })}

          {points.map((point, index) => {
            const x = xForIndex(index) - barWidth / 2
            const height = Math.max(2, chartHeight - (yForStrain(point.strain ?? 0) - PADDING.top))
            const y = PADDING.top + chartHeight - height

            return (
              <rect
                key={point.date}
                x={x}
                y={y}
                width={barWidth}
                height={height}
                fill="#f59e0b"
                opacity="0.82"
                rx="1"
              >
                <title>{`${point.label}: Strain ${formatNumber(point.strain, 0)}, Monotony ${formatNumber(point.monotony)}, A:C ${formatNumber(point.acRatio)}, atleti ${point.athleteCount}`}</title>
              </rect>
            )
          })}

          <path d={monotonyPath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          <path d={acRatioPath} fill="none" stroke="#15803d" strokeWidth="2.5" strokeDasharray="6 4" strokeLinejoin="round" strokeLinecap="round" />

          {labelIndexes.map((index) => (
            <text key={index} x={xForIndex(index)} y={HEIGHT - 18} textAnchor="middle" fontSize="11" fill="#64748b">
              {points[index].label}
            </text>
          ))}

          <text x={PADDING.left} y={16} fontSize="11" fill="#64748b">Strain</text>
          <text x={WIDTH - PADDING.right} y={16} textAnchor="end" fontSize="11" fill="#64748b">Monotony / A:C Ratio</text>
        </svg>
      </div>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "12px", color: "#555" }}>
        <span><strong style={{ color: "#f59e0b" }}>Strain</strong> stres cumulat real</span>
        <span><strong style={{ color: "#2563eb" }}>Monotony</strong> distribuire prea uniforma</span>
        <span><strong style={{ color: "#15803d" }}>A:C Ratio</strong> zona safe intre 0.8 si 1.3</span>
      </div>
    </div>
  )
}
