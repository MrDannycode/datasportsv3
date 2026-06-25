"use client"

import { useState } from "react"

type SidebarTab = "clasament" | "jucatori"

const clasamentData = [
    { pos: 1, team: "Manchester City", played: 30, won: 22, drawn: 5, lost: 3, pts: 71 },
    { pos: 2, team: "Arsenal", played: 30, won: 21, drawn: 5, lost: 4, pts: 68 },
    { pos: 3, team: "Liverpool", played: 30, won: 20, drawn: 6, lost: 4, pts: 66 },
    { pos: 4, team: "Aston Villa", played: 30, won: 18, drawn: 4, lost: 8, pts: 58 },
    { pos: 5, team: "Tottenham", played: 30, won: 14, drawn: 6, lost: 10, pts: 48 },
    { pos: 6, team: "Chelsea", played: 30, won: 13, drawn: 7, lost: 10, pts: 46 },
    { pos: 7, team: "Newcastle", played: 30, won: 13, drawn: 5, lost: 12, pts: 44 },
    { pos: 8, team: "Man United", played: 30, won: 11, drawn: 5, lost: 14, pts: 38 },
]

export type SidebarPlayer = {
    id: number
    name: string
    team: string
    atl: number | null
    tsb: number | null
}

type DashboardSidebarProps = {
    players: SidebarPlayer[]
}

function formatMetric(value: number | null) {
    return value === null ? "-" : value.toFixed(1)
}

export default function DashboardSidebar({ players }: DashboardSidebarProps) {
    const [activeTab, setActiveTab] = useState<SidebarTab>("clasament")

    return (
        <aside className="dsb-sidebar">
            {/* Tab buttons */}
            <div className="dsb-tabs">
                <button
                    id="dsb-btn-clasament"
                    className={`dsb-tab-btn${activeTab === "clasament" ? " dsb-tab-btn--active" : ""}`}
                    onClick={() => setActiveTab("clasament")}
                >
                    🏆 Clasament
                </button>
                <button
                    id="dsb-btn-jucatori"
                    className={`dsb-tab-btn${activeTab === "jucatori" ? " dsb-tab-btn--active" : ""}`}
                    onClick={() => setActiveTab("jucatori")}
                >
                    ⚽ Jucători
                </button>
            </div>

            {/* Tab content */}
            <div className="dsb-content">
                {activeTab === "clasament" && (
                    <div className="dsb-panel" id="dsb-panel-clasament">
                        <div className="dsb-panel-header">
                            <span className="dsb-panel-title">Premier League</span>
                            <span className="dsb-panel-season">2024/25</span>
                        </div>
                        <table className="dsb-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Echipă</th>
                                    <th title="Meciuri jucate">MJ</th>
                                    <th title="Victorii">V</th>
                                    <th title="Egaluri">E</th>
                                    <th title="Înfrângeri">Î</th>
                                    <th title="Puncte">Pct</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clasamentData.map((row) => (
                                    <tr
                                        key={row.pos}
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
                                ))}
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
                                    <th>Jucător</th>
                                    <th>Echipă</th>
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
                                            <td className="dsb-team-small">{row.team}</td>
                                            <td className="dsb-pts">{formatMetric(row.atl)}</td>
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
