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

const jucatoriData = [
    { rank: 1, name: "Erling Haaland", team: "Man City", goals: 27, assists: 5 },
    { rank: 2, name: "Cole Palmer", team: "Chelsea", goals: 22, assists: 11 },
    { rank: 3, name: "Alexander Isak", team: "Newcastle", goals: 21, assists: 4 },
    { rank: 4, name: "Mohamed Salah", team: "Liverpool", goals: 18, assists: 12 },
    { rank: 5, name: "Bukayo Saka", team: "Arsenal", goals: 15, assists: 13 },
    { rank: 6, name: "Son Heung-min", team: "Tottenham", goals: 14, assists: 8 },
    { rank: 7, name: "Ollie Watkins", team: "Aston Villa", goals: 13, assists: 9 },
    { rank: 8, name: "Phil Foden", team: "Man City", goals: 12, assists: 8 },
]

export default function DashboardSidebar() {
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
                            <span className="dsb-panel-title">Top Marcatori</span>
                            <span className="dsb-panel-season">2024/25</span>
                        </div>
                        <table className="dsb-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Jucător</th>
                                    <th>Echipă</th>
                                    <th title="Goluri">G</th>
                                    <th title="Pase decisive">A</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jucatoriData.map((row) => (
                                    <tr key={row.rank}>
                                        <td className="dsb-pos">{row.rank}</td>
                                        <td className="dsb-player-name">{row.name}</td>
                                        <td className="dsb-team-small">{row.team}</td>
                                        <td className="dsb-pts">{row.goals}</td>
                                        <td>{row.assists}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </aside>
    )
}
