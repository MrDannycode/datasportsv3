"use client"

import { useState } from "react"

type SidebarTab = "clasament" | "jucatori"

export type SidebarRecentInjury = {
    id: number
    athleteName: string
    injuryType: string
    bodyPart: string
    severity: string
    createdAt: string
}

export type SidebarWeeklyGoalTraining = {
    id: number
    date: string
    trimp: number | null
}

export type SidebarWeeklyGoalAthlete = {
    id: number
    name: string
    acRatio: number | null
    currentWeekTrimp: number
    expectedTrimp: number
    trainings: SidebarWeeklyGoalTraining[]
}

export type SidebarWeeklyGoal = {
    currentTrimp: number
    targetTrimp: number
    weekLabel: string
    acRiskAthletes: SidebarWeeklyGoalAthlete[]
    underExpectedAthletes: SidebarWeeklyGoalAthlete[]
}

export type SidebarPlayer = {

    id: number
    name: string
    ctl: number | null
    atl: number | null
    tsb: number | null
}

export type SidebarStanding = {
    pos: number
    team: string
    played: number
    won: number
    drawn: number
    lost: number
    pts: number
}

type DashboardSidebarProps = {
    players: SidebarPlayer[]
    standings: SidebarStanding[]
    standingsLeagueName: string | null
    recentInjuries?: SidebarRecentInjury[]
    weeklyGoal?: SidebarWeeklyGoal | null
}

function formatMetric(value: number | null) {
    return value === null ? "-" : value.toFixed(1)
}

function formatNumber(value: number | null | undefined, digits = 0) {
    if (value == null || Number.isNaN(value)) return "-"
    return value.toLocaleString("ro-RO", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
    })
}

function formatShortDate(value: string) {
    return new Date(value).toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "short",
    })
}

function renderWeeklyAthletes(athletes: SidebarWeeklyGoalAthlete[], emptyMessage: string) {
    if (athletes.length === 0) {
        return <p className="sd-progress-text">{emptyMessage}</p>
    }

    return (
        <ul className="sd-list">
            {athletes.map((athlete) => (
                <li key={athlete.id}>
                    <strong>{athlete.name}</strong>
                    <br />
                    A:C {formatNumber(athlete.acRatio, 2)} | TRIMP {formatNumber(athlete.currentWeekTrimp)} / {formatNumber(athlete.expectedTrimp)}
                    {athlete.trainings.length > 0 && (
                        <div style={{ display: "grid", gap: "4px", marginTop: "6px" }}>
                            {athlete.trainings.map((training) => (
                                <span key={training.id} className="sd-progress-text">
                                    {formatShortDate(training.date)} | A:C {formatNumber(athlete.acRatio, 2)} | {formatNumber(training.trimp)} TRIMP
                                </span>
                            ))}
                        </div>
                    )}
                </li>
            ))}
        </ul>
    )
}

export default function DashboardSidebar({
    players,
    standings,
    standingsLeagueName,
    recentInjuries,
    weeklyGoal,
}: DashboardSidebarProps) {
    const [activeTab, setActiveTab] = useState<SidebarTab>("clasament")

    return (
        <aside className="dsb-sidebar">
            {weeklyGoal && (
                <div className="sd-box">
                    <div className="sd-box-header">
                        <h2>Weekly Goal</h2>
                    </div>
                    <div className="sd-box-content" style={{ display: "grid", gap: "12px" }}>
                        <div>
                            <div className="sd-metric-title">{weeklyGoal.weekLabel}</div>
                            <div className="sd-metric-value" style={{ fontSize: "18px" }}>
                                {formatNumber(weeklyGoal.currentTrimp)} / {formatNumber(weeklyGoal.targetTrimp)}
                            </div>
                            <div className="sd-progress-bar" aria-label={`Weekly Goal ${weeklyGoal.targetTrimp > 0 ? Math.round((weeklyGoal.currentTrimp / weeklyGoal.targetTrimp) * 100) : 0}%`}>
                                <div
                                    className="sd-progress-fill"
                                    style={{
                                        width: `${weeklyGoal.targetTrimp > 0 ? Math.min(Math.round((weeklyGoal.currentTrimp / weeklyGoal.targetTrimp) * 100), 100) : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <div className="sd-box sd-metric-box" style={{ marginBottom: 0, padding: "10px" }}>
                                <div className="sd-metric-title">A:C risk</div>
                                <div className="sd-metric-value" style={{ fontSize: "20px" }}>{weeklyGoal.acRiskAthletes.length}</div>
                            </div>
                            <div className="sd-box sd-metric-box" style={{ marginBottom: 0, padding: "10px" }}>
                                <div className="sd-metric-title">Sub medie</div>
                                <div className="sd-metric-value" style={{ fontSize: "20px" }}>{weeklyGoal.underExpectedAthletes.length}</div>
                            </div>
                        </div>
                        <details>
                            <summary className="sd-btn-secondary" style={{ width: "100%", textAlign: "center" }}>
                                Atleti cu A:C risk
                            </summary>
                            <div style={{ marginTop: "10px" }}>
                                {renderWeeklyAthletes(weeklyGoal.acRiskAthletes, "Nu exista atleti cu A:C risk.")}
                            </div>
                        </details>
                        <details>
                            <summary className="sd-btn-secondary" style={{ width: "100%", textAlign: "center" }}>
                                Atleti sub media asteptata
                            </summary>
                            <div style={{ marginTop: "10px" }}>
                                {renderWeeklyAthletes(weeklyGoal.underExpectedAthletes, "Nu exista atleti sub media asteptata.")}
                            </div>
                        </details>
                    </div>
                </div>
            )}
            {recentInjuries && (

                <div className="sd-box">
                    <div className="sd-box-header">
                        <h2>Accidentari Recente</h2>
                    </div>
                    <div className="sd-box-content">
                        {recentInjuries.length === 0 ? (
                            <div className="sd-empty-state">
                                <p>Nu exista accidentari recente.</p>
                            </div>
                        ) : (
                            <ul className="sd-list">
                                {recentInjuries.map((injury) => (
                                    <li key={injury.id}>
                                        <strong>{injury.athleteName}</strong>
                                        <br />
                                        {injury.injuryType} - {injury.bodyPart}
                                        <br />
                                        <span style={{ color: "#666" }}>
                                            {injury.severity} - {" "}
                                            {new Date(injury.createdAt).toLocaleDateString("ro-RO", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
            <div className="dsb-tabs">
                <button
                    id="dsb-btn-clasament"
                    className={`dsb-tab-btn${activeTab === "clasament" ? " dsb-tab-btn--active" : ""}`}
                    onClick={() => setActiveTab("clasament")}
                >
                    Clasament
                </button>
                <button
                    id="dsb-btn-jucatori"
                    className={`dsb-tab-btn${activeTab === "jucatori" ? " dsb-tab-btn--active" : ""}`}
                    onClick={() => setActiveTab("jucatori")}
                >
                    Jucatori
                </button>
            </div>

            <div className="dsb-content">
                {activeTab === "clasament" && (
                    <div className="dsb-panel" id="dsb-panel-clasament">
                        <div className="dsb-panel-header">
                            <span className="dsb-panel-title">{standingsLeagueName ?? "Clasament"}</span>
                            <span className="dsb-panel-season">2024/25</span>
                        </div>
                        <table className="dsb-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th title="Echipa">Echipa</th>
                                    <th title="Meciuri jucate">MJ</th>
                                    <th title="Victorii">V</th>
                                    <th title="Egaluri">E</th>
                                    <th title="Infrangeri">I</th>
                                    <th title="Puncte">Pct</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7}>Nu exista clasament pentru liga contului logat.</td>
                                    </tr>
                                ) : (
                                    standings.map((row) => (
                                        <tr
                                            key={row.team}
                                            className={
                                                row.pos <= 4
                                                    ? "dsb-row-ucl"
                                                    : row.pos <= 6
                                                        ? "dsb-row-uel"
                                                        : ""
                                            }
                                        >
                                            <td className="dsb-pos">{row.pos}</td>
                                            <td className="dsb-team-name">{row.team}</td>
                                            <td>{row.played}</td>
                                            <td>{row.won}</td>
                                            <td>{row.drawn}</td>
                                            <td>{row.lost}</td>
                                            <td className="dsb-pts">{row.pts}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="dsb-legend">
                            <span className="dsb-legend-dot dsb-legend-ucl" /> UCL
                            <span className="dsb-legend-dot dsb-legend-uel" style={{ marginLeft: 12 }} /> UEL
                        </div>
                    </div>
                )}

                {activeTab === "jucatori" && (
                    <div className="dsb-panel" id="dsb-panel-jucatori">
                        <div className="dsb-panel-header">
                            <span className="dsb-panel-title">Jucatorii Echipei</span>
                            <span className="dsb-panel-season">2024/25</span>
                        </div>
                        <table className="dsb-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Jucator</th>
                                    <th title="Chronic Training Load">CTL</th>
                                    <th title="Acute Training Load">ATL</th>
                                    <th title="Training Stress Balance">TSB</th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>Nu exista jucatori pentru echipa contului logat.</td>
                                    </tr>
                                ) : (
                                    players.map((row, index) => (
                                        <tr key={row.id}>
                                            <td className="dsb-pos">{index + 1}</td>
                                            <td className="dsb-player-name">{row.name}</td>
                                            <td className="dsb-pts">{formatMetric(row.ctl)}</td>
                                            <td>{formatMetric(row.atl)}</td>
                                            <td>{formatMetric(row.tsb)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </aside>
    )
}
