const SPORT_SCIENCE_METRICS = [
  "Data(ziua)",
  "TRIMP",
  "CTL(Fitness)",
  "ATL(Fatigue)",
  "TSB(Form)",
  "A:C Ratio",
  "Monotony",
  "Strain",
]

export default function SportScienceMetrics() {
  return (
    <ul className="sd-list">
      {SPORT_SCIENCE_METRICS.map((metric) => (
        <li key={metric}>{metric}</li>
      ))}
    </ul>
  )
}
