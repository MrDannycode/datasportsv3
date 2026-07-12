"use client"
import { useMemo, useState } from "react"
export type InjuryHistoryItem = { id: number; date: string; athleteId: number; athleteName: string; severity: "usoara" | "medie" | "grava" }
const levels = ["usoara", "medie", "grava"] as const
const meta = { usoara: { label: "Usoare", color: "#22c55e" }, medie: { label: "Medii", color: "#f59e0b" }, grava: { label: "Grave", color: "#ef4444" } }
const W = 1100, H = 420, P = { top: 30, right: 24, bottom: 64, left: 48 }
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
const weekKey = (date: Date) => `${monthKey(date)}-s${Math.min(4, Math.ceil(date.getDate() / 7))}`
function bucketLabel(key: string) {
    const [year, month, week] = key.split("-")
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleDateString("ro-RO", { month: "short" })
    return week ? `S${week.slice(1)} ${monthName}` : `${monthName} ${year.slice(2)}`
}
export default function InjuryHistoryChart({ injuries }: { injuries: InjuryHistoryItem[] }) {
    const [months, setMonths] = useState(3), [athlete, setAthlete] = useState("all")
    const athletes = useMemo(() => Array.from(new Map(injuries.map(i => [i.athleteId, i.athleteName]))).sort((a, b) => a[1].localeCompare(b[1], "ro")), [injuries])
    const data = useMemo(() => {
        const now = new Date()
        const selectedMonths = Array.from({ length: months }, (_, index) =>
            new Date(now.getFullYear(), now.getMonth() - months + index + 1, 1)
        )
        const keys = months === 3
            ? selectedMonths.flatMap(date => Array.from({ length: 4 }, (_, index) => `${monthKey(date)}-s${index + 1}`))
            : selectedMonths.map(monthKey)
        const values = new Map(keys.map(key => [key, {
            usoara: 0,
            medie: 0,
            grava: 0,
            athleteNames: {
                usoara: new Set<string>(),
                medie: new Set<string>(),
                grava: new Set<string>(),
            },
        }]))

        injuries.forEach(injury => {
            if (athlete !== "all" && injury.athleteId !== Number(athlete)) return
            const date = new Date(injury.date)
            const value = values.get(months === 3 ? weekKey(date) : monthKey(date))
            if (value) {
                value[injury.severity] += 1
                value.athleteNames[injury.severity].add(injury.athleteName)
            }
        })

        return keys.map(key => ({ key, ...values.get(key)! }))
    }, [athlete, injuries, months])
    const total = data.reduce((s, d) => s + d.usoara + d.medie + d.grava, 0), max = Math.max(1, ...data.map(d => d.usoara + d.medie + d.grava)), chartH = H - P.top - P.bottom, slot = (W - P.left - P.right) / data.length, bar = Math.min(38, slot * .58), ticks = Array.from(new Set([0, Math.ceil(max / 2), max]))
    return <div className="injury-history-chart">
        <div className="injury-history-chart__toolbar"><div><strong>{total} accidentari</strong><p>{months === 3 ? "Evolutia saptamanala, cu 4 saptamani pentru fiecare luna" : "Evolutia lunara a accidentarilor inregistrate"}</p></div><div className="injury-history-chart__filters">
            <select aria-label="Filtreaza dupa atlet" value={athlete} onChange={e => setAthlete(e.target.value)}><option value="all">Toti atletii</option>{athletes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
            <select aria-label="Selecteaza perioada" value={months} onChange={e => setMonths(Number(e.target.value))}><option value={3}>Ultimele 3 luni</option><option value={6}>Ultimele 6 luni</option><option value={12}>Ultimele 12 luni</option></select>
        </div></div>
        {total === 0 ? <div className="sd-empty-state"><p>Nu exista accidentari in perioada selectata.</p></div> : <div className="injury-history-chart__canvas"><svg role="img" aria-label={`Istoricul ${months === 3 ? "saptamanal" : "lunar"} al accidentarilor dupa severitate`} viewBox={`0 0 ${W} ${H}`}>
            {ticks.map(t => { const y = P.top + chartH - t / max * chartH; return <g key={t}><line x1={P.left} x2={W - P.right} y1={y} y2={y} stroke="#e2e8f0" /><text x={P.left - 9} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">{t}</text></g> })}
            {data.map((d, index) => { const x = P.left + index * slot + (slot - bar) / 2; let y = P.top + chartH; return <g key={d.key}>{levels.map(level => { const value = d[level], height = value / max * chartH, athleteNames = Array.from(d.athleteNames[level]).join(", "); y -= height; return <rect key={level} x={x} y={y} width={bar} height={height} fill={meta[level].color}><title>{bucketLabel(d.key)}: {value} {meta[level].label.toLowerCase()}{athleteNames ? ` — ${athleteNames}` : ""}</title></rect> })}<text x={x + bar / 2} y={H - 24} textAnchor="middle" fontSize="10" fill="#64748b" transform={`rotate(-30 ${x + bar / 2} ${H - 24})`}>{bucketLabel(d.key)}</text></g> })}
        </svg></div>}
        <div className="injury-history-chart__legend">{levels.map(level => <span key={level}><i style={{ backgroundColor: meta[level].color }} />{meta[level].label}</span>)}</div>
    </div>
}
