"use client"

import { useState } from "react"
import type { TournamentWithDifficulty } from "@/app/api/tournaments/route"
import { DIFFICULTY_LABELS, type Difficulty } from "@/lib/tournament-difficulty"

type Props = {
    tournament: TournamentWithDifficulty
    showPlayersDefault?: boolean
}

const DIFFICULTY_ICONS: Record<Difficulty, string> = {
    greu: "🔴",
    mediu: "🟡",
    usor: "🟢",
}

const MAX_VISIBLE_PLAYERS = 30

const SURFACE_LABELS: Record<string, string> = {
    zgura: "Zgură",
    iarba: "Iarbă",
    hard: "Hard",
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty | null }) {
    if (!difficulty) {
        return (
            <span className="sd-difficulty-badge sd-difficulty-unknown">
                ? Necunoscut
            </span>
        )
    }
    return (
        <span className={`sd-difficulty-badge sd-difficulty-${difficulty}`}>
            {DIFFICULTY_ICONS[difficulty]} {DIFFICULTY_LABELS[difficulty]}
        </span>
    )
}

function SurfaceBadge({ surface }: { surface: string | null }) {
    if (!surface) return null
    const cls = `sd-surface-badge sd-surface-${surface}`
    return <span className={cls}>{SURFACE_LABELS[surface] ?? surface}</span>
}

export default function TournamentCard({ tournament, showPlayersDefault = false }: Props) {
    const [expanded, setExpanded] = useState(showPlayersDefault)
    const visiblePlayers = tournament.players.slice(0, MAX_VISIBLE_PLAYERS)

    return (
        <div className="sd-tournament-card">
            {/* Header */}
            <div className="sd-tournament-card-header">
                <span className="sd-tournament-card-name">{tournament.name}</span>
                <DifficultyBadge difficulty={tournament.difficulty} />
            </div>

            {/* Body */}
            <div className="sd-tournament-card-body">
                {tournament.location && (
                    <div className="sd-tournament-meta">
                        <span className="sd-tournament-meta-icon">📍</span>
                        <span>{tournament.location}</span>
                    </div>
                )}
                <div className="sd-tournament-meta">
                    <span className="sd-tournament-meta-icon">📅</span>
                    <span>
                        {formatDate(tournament.startDate)}
                        {tournament.endDate && ` — ${formatDate(tournament.endDate)}`}
                    </span>
                </div>
                {tournament.surface && (
                    <div className="sd-tournament-meta">
                        <span className="sd-tournament-meta-icon">🎾</span>
                        <SurfaceBadge surface={tournament.surface} />
                    </div>
                )}
                <div className="sd-tournament-meta">
                    <span className="sd-tournament-meta-icon">👥</span>
                    <span>{tournament.playerCount} jucători înscriși</span>
                    {tournament.avgRanking !== null && (
                        <span className="sd-avg-ranking">
                            Avg #{tournament.avgRanking}
                        </span>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="sd-tournament-card-footer">
                {tournament.playerCount > 0 ? (
                    <button
                        id={`tournament-players-toggle-${tournament.id}`}
                        className="sd-players-toggle"
                        onClick={() => setExpanded((prev) => !prev)}
                        aria-expanded={expanded}
                    >
                        {expanded ? "▲ Ascunde jucători" : "▼ Vezi jucători"}
                    </button>
                ) : (
                    <span style={{ fontSize: 12, color: "#aaa" }}>
                        Nicio încriere încă
                    </span>
                )}
                {tournament.lastSyncAt && (
                    <span style={{ fontSize: 11, color: "#aaa" }}>
                        Sync: {formatDate(tournament.lastSyncAt)}
                    </span>
                )}
            </div>

            {/* Tabel jucători (expandabil) */}
            {expanded && tournament.players.length > 0 && (
                <div className="sd-players-table-wrap">
                    <table className="sd-table" style={{ margin: "0 14px 12px", width: "calc(100% - 28px)" }}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Jucător</th>
                                <th title="Ranking ATP/WTA">Ranking</th>
                                <th>Nați.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visiblePlayers.map((p, idx) => (
                                <tr key={p.id}>
                                    <td className="sd-pos">{idx + 1}</td>
                                    <td>{p.playerName}</td>
                                    <td>
                                        {p.atpWtaRanking !== null ? (
                                            <strong>#{p.atpWtaRanking}</strong>
                                        ) : (
                                            <span style={{ color: "#aaa" }}>—</span>
                                        )}
                                    </td>
                                    <td>{p.nationality ?? "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

