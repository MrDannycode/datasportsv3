type WeeklyGoalTraining = {
    id: number
    date: string
    trimp: number | null
}

type WeeklyGoalAthlete = {
    id: number
    name: string
    acRatio: number | null
    currentWeekTrimp: number
    expectedTrimp: number
    trainings: WeeklyGoalTraining[]
}

type WeeklyGoalProps = {
    currentTrimp: number
    targetTrimp: number
    weekLabel: string
    acRiskAthletes: WeeklyGoalAthlete[]
    underExpectedAthletes: WeeklyGoalAthlete[]
}

function formatNumber(value: number | null | undefined, digits = 0) {
    if (value == null || Number.isNaN(value)) return "-"
    return value.toLocaleString("ro-RO", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
    })
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "short",
    })
}

function athleteRows(athletes: WeeklyGoalAthlete[], emptyMessage: string) {
    if (athletes.length === 0) {
        return <p className="sd-progress-text">{emptyMessage}</p>
    }

    return (
        <div style={{ overflowX: "auto" }}>
            <table className="sd-table">
                <thead>
                    <tr>
                        <th>Atlet</th>
                        <th>A:C</th>
                        <th>TRIMP saptamana</th>
                        <th>Media asteptata</th>
                        <th>Antrenamente</th>
                    </tr>
                </thead>
                <tbody>
                    {athletes.map((athlete) => (
                        <tr key={athlete.id}>
                            <td>{athlete.name}</td>
                            <td>{formatNumber(athlete.acRatio, 2)}</td>
                            <td>{formatNumber(athlete.currentWeekTrimp)}</td>
                            <td>{formatNumber(athlete.expectedTrimp)}</td>
                            <td>
                                {athlete.trainings.length === 0 ? (
                                    "-"
                                ) : (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {athlete.trainings.map((training) => (
                                            <span
                                                key={training.id}
                                                style={{
                                                    display: "inline-flex",
                                                    gap: "5px",
                                                    padding: "2px 7px",
                                                    border: "1px solid #d1d5db",
                                                    borderRadius: "3px",
                                                    background: "#f8fafc",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {formatDate(training.date)}
                                                <span>A:C {formatNumber(athlete.acRatio, 2)}</span>
                                                <strong>{formatNumber(training.trimp)} TRIMP</strong>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default function WeeklyGoal({
    currentTrimp,
    targetTrimp,
    weekLabel,
    acRiskAthletes,
    underExpectedAthletes,
}: WeeklyGoalProps) {
    const progress = targetTrimp > 0 ? Math.round((currentTrimp / targetTrimp) * 100) : 0
    const clampedProgress = Math.min(progress, 100)
    const progressColor = progress >= 100 ? "#15803d" : progress >= 80 ? "#f59e0b" : "#0056b3"

    return (
        <div className="sd-box">
            <div className="sd-box-header">
                <h2>Weekly Goal</h2>
                <span className="sd-progress-text">{weekLabel}</span>
            </div>
            <div className="sd-box-content" style={{ display: "grid", gap: "16px" }}>
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                        <div>
                            <div className="sd-metric-title">TRIMP echipa</div>
                            <div className="sd-metric-value">
                                {formatNumber(currentTrimp)} / {formatNumber(targetTrimp)}
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div className="sd-metric-title">Progres</div>
                            <div className="sd-metric-value">{progress}%</div>
                        </div>
                    </div>
                    <div className="sd-progress-bar" aria-label={`Progres weekly goal ${progress}%`}>
                        <div
                            className="sd-progress-fill"
                            style={{ width: `${clampedProgress}%`, backgroundColor: progressColor }}
                        />
                    </div>
                    <div className="sd-progress-text">
                        Targetul simplu este media TRIMP a echipei din ultimele 4 saptamani.
                    </div>
                </div>

                <div className="sd-metrics" style={{ marginBottom: 0 }}>
                    <div className="sd-box sd-metric-box" style={{ marginBottom: 0, padding: "14px" }}>
                        <div className="sd-metric-title">Atleti cu A:C risk</div>
                        <div className="sd-metric-value">{acRiskAthletes.length}</div>
                    </div>
                    <div className="sd-box sd-metric-box" style={{ marginBottom: 0, padding: "14px" }}>
                        <div className="sd-metric-title">Atleti sub media asteptata</div>
                        <div className="sd-metric-value">{underExpectedAthletes.length}</div>
                    </div>
                </div>

                <details>
                    <summary className="sd-btn-secondary" style={{ width: "fit-content" }}>
                        Atleti cu A:C risk
                    </summary>
                    <div style={{ marginTop: "12px" }}>
                        {athleteRows(acRiskAthletes, "Nu exista atleti peste pragul A:C risk.")}
                    </div>
                </details>

                <details>
                    <summary className="sd-btn-secondary" style={{ width: "fit-content" }}>
                        Atleti sub media asteptata
                    </summary>
                    <div style={{ marginTop: "12px" }}>
                        {athleteRows(underExpectedAthletes, "Nu exista atleti sub media asteptata.")}
                    </div>
                </details>
            </div>
        </div>
    )
}
