"use client"

import { useState } from "react"

type SidebarTab = "clasament" | "jucatori"

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
}

function formatMetric(value: number | null) {
    return value === null ? "-" : value.toFixed(1)
}

export default function DashboardSidebar({
    players,
    standings,
    standingsLeagueName,
}: DashboardSidebarProps) {
    const [activeTab, setActiveTab] = useState<SidebarTab>("clasament")
    const relegationStartPosition = standings.length - 1
    const playoffStartPosition = standings.length - 3

    return (
        <aside className="dsb-sidebar">
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
                            <span className="dsb-panel-season">2026/27</span>
                        </div>
                        <table className="dsb-table dsb-standings-table">
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
                                                        : row.pos >= relegationStartPosition
                                                            ? "dsb-row-relegation"
                                                            : row.pos >= playoffStartPosition
                                                                ? "dsb-row-playoff"
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
                            <span className="dsb-legend-dot dsb-legend-playoff" style={{ marginLeft: 12 }} /> Baraj
                            <span className="dsb-legend-dot dsb-legend-relegation" style={{ marginLeft: 12 }} /> Retrogradare
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
