export type SportScienceLoad = {
  date: Date | string
  trimp: number
  ctl: number
  atl: number
  tsb: number
  acRatio: number
  monotony: number | null
  strain: number | null
}

type Props = {
  latestLoad?: SportScienceLoad | null
}

type Metric = {
  label: string
  value: string
  percent: number | null
  rawValue?: number | null
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value == null) return "-"
  return value.toFixed(digits)
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value))
}

function scaleValue(value: number | null | undefined, min: number, max: number) {
  if (value == null || max === min) return 0
  return clampPercent(((value - min) / (max - min)) * 100)
}

function getBarColor(percent: number) {
  if (percent >= 80) return "#166534"
  if (percent >= 60) return "#65a30d"
  if (percent >= 40) return "#d97706"
  return "#dc2626"
}

function getTsbPercent(value: number | null | undefined) {
  if (value == null) return 0
  return clampPercent((Math.abs(value) / 30) * 100)
}

function MetricBar({ metric }: { metric: Metric }) {
  if (metric.percent === null) return null

  if (metric.label === "TSB(Form)") {
    const tsbPercent = getTsbPercent(metric.rawValue)
    const isPositive = (metric.rawValue ?? 0) >= 0

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "8px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ position: "relative", background: "#fee2e2" }}>
          {!isPositive && (
            <div
              style={{
                position: "absolute",
                right: 0,
                width: `${tsbPercent}%`,
                height: "100%",
                background: "#dc2626",
              }}
            />
          )}
        </div>
        <div style={{ position: "relative", background: "#dcfce7" }}>
          {isPositive && (
            <div
              style={{
                position: "absolute",
                left: 0,
                width: `${tsbPercent}%`,
                height: "100%",
                background: "#166534",
              }}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
      <div
        style={{
          width: `${metric.percent}%`,
          height: "100%",
          background: getBarColor(metric.percent),
        }}
      />
    </div>
  )
}

export default function SportScienceMetrics({ latestLoad }: Props) {
  const metrics: Metric[] = [
    { label: "Data(ziua)", value: latestLoad ? formatDate(latestLoad.date) : "-", percent: null },
    { label: "TRIMP", value: formatNumber(latestLoad?.trimp), percent: scaleValue(latestLoad?.trimp, 0, 300) },
    { label: "CTL(Fitness)", value: formatNumber(latestLoad?.ctl), percent: scaleValue(latestLoad?.ctl, 0, 120) },
    { label: "ATL(Fatigue)", value: formatNumber(latestLoad?.atl), percent: scaleValue(latestLoad?.atl, 0, 120) },
    { label: "TSB(Form)", value: formatNumber(latestLoad?.tsb), percent: scaleValue(latestLoad?.tsb, -30, 30), rawValue: latestLoad?.tsb },
    { label: "A:C Ratio", value: formatNumber(latestLoad?.acRatio, 2), percent: scaleValue(latestLoad?.acRatio, 0.5, 1.8) },
    { label: "Monotony", value: formatNumber(latestLoad?.monotony, 2), percent: scaleValue(latestLoad?.monotony, 0, 3) },
    { label: "Strain", value: formatNumber(latestLoad?.strain), percent: scaleValue(latestLoad?.strain, 0, 1000) },
  ]

  return (
    <ul className="sd-list">
      {metrics.map((metric) => (
        <li key={metric.label} style={{ display: "grid", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
          <MetricBar metric={metric} />
        </li>
      ))}
    </ul>
  )
}
