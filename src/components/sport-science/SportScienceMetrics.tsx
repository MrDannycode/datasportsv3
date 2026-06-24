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

export default function SportScienceMetrics({ latestLoad }: Props) {
  const metrics = [
    { label: "Data(ziua)", value: latestLoad ? formatDate(latestLoad.date) : "-" },
    { label: "TRIMP", value: formatNumber(latestLoad?.trimp) },
    { label: "CTL(Fitness)", value: formatNumber(latestLoad?.ctl) },
    { label: "ATL(Fatigue)", value: formatNumber(latestLoad?.atl) },
    { label: "TSB(Form)", value: formatNumber(latestLoad?.tsb) },
    { label: "A:C Ratio", value: formatNumber(latestLoad?.acRatio, 2) },
    { label: "Monotony", value: formatNumber(latestLoad?.monotony, 2) },
    { label: "Strain", value: formatNumber(latestLoad?.strain) },
  ]

  return (
    <ul className="sd-list">
      {metrics.map((metric) => (
        <li key={metric.label} style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </li>
      ))}
    </ul>
  )
}
