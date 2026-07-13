"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { addActivity, deleteActivity, importActivities, type ActivityImportResult } from "./actions"
import ActivityModal from "./ActivityModal"
import { parseCsv } from "@/lib/csv"

type Activity = {
  id: number
  date: Date | string
  durationMin: number
  avgHeartRate: number | null
  sport: string | null
  notes: string | null
  trimp: number | null
}

type DailyLoad = {
  id: number
  date: Date | string
  trimp: number
  atl: number
  ctl: number
  tsb: number
  acRatio: number
  monotony: number | null
  strain: number | null
}

type Profile = {
  restingHeartRate: number | null
  maxHeartRate: number | null
  gender: string | null
}

type Props = {
  initialActivities: Activity[]
  latestLoad: DailyLoad | null
  profile: Profile
  shouldOpenNewActivityModal?: boolean
  defaultSport?: "fotbal" | "tenis"
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid #ddd",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "bold",
  color: "#555",
  display: "block",
  marginBottom: "4px",
}

const FIELD_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
}

const SPORT_OPTIONS = [
  { value: "fotbal", label: "Fotbal" },
  { value: "tenis", label: "Tenis" },
  { value: "alergare", label: "Alergare" },
  { value: "ciclism", label: "Ciclism" },
  { value: "inot", label: "Inot" },
  { value: "fitness", label: "Fitness / Sala" },
  { value: "alta", label: "Alta" },
]

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("ro-RO", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m} min`
  return `${h}h ${m}min`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function FormBadge({ tsb }: { tsb: number }) {
  let label = "Optimal"
  let color = "#2a7a2a"
  let bg = "#e8f5e9"
  if (tsb > 10) { label = "Fresh"; color = "#0056b3"; bg = "#e8f0fb" }
  else if (tsb < -30) { label = "Supraantrenat"; color = "#c00"; bg = "#fdecea" }
  else if (tsb < -10) { label = "Obosit"; color = "#b36000"; bg = "#fff3e0" }
  return (
    <span style={{ backgroundColor: bg, color, padding: "2px 8px", fontSize: "11px", fontWeight: "bold" }}>
      {label}
    </span>
  )
}

function RiskBadge({ ratio }: { ratio: number }) {
  let label = "Safe"
  let color = "#2a7a2a"
  let bg = "#e8f5e9"
  if (ratio < 0.8) { label = "Detrenare"; color = "#888"; bg = "#f5f5f5" }
  else if (ratio > 1.5) { label = "Risc ridicat"; color = "#c00"; bg = "#fdecea" }
  else if (ratio > 1.3) { label = "Atentie"; color = "#b36000"; bg = "#fff3e0" }
  return (
    <span style={{ backgroundColor: bg, color, padding: "2px 8px", fontSize: "11px", fontWeight: "bold" }}>
      {label}
    </span>
  )
}

export default function ActivityManager({ initialActivities, latestLoad, profile, shouldOpenNewActivityModal = false, defaultSport = "fotbal" }: Props) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [currentLoad] = useState<DailyLoad | null>(latestLoad)
  const [isPending, startTransition] = useTransition()
  const [date, setDate] = useState(today())
  const [durationMin, setDurationMin] = useState("")
  const [avgHeartRate, setAvgHeartRate] = useState("")
  const [sport, setSport] = useState(defaultSport)
  const [notes, setNotes] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const hasOpenedFromQueryRef = useRef(false)
  const csvFileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState("")
  const [importResults, setImportResults] = useState<ActivityImportResult[]>([])

  const hasCardiacData = !!(profile.restingHeartRate && profile.maxHeartRate)

  useEffect(() => {
    if (!shouldOpenNewActivityModal || hasOpenedFromQueryRef.current) {
      return
    }

    hasOpenedFromQueryRef.current = true
    setIsActivityModalOpen(true)
  }, [shouldOpenNewActivityModal])

  function resetForm() {
    setDate(today())
    setDurationMin("")
    setAvgHeartRate("")
    setSport(defaultSport)
    setNotes("")
    setFormError(null)
    setFormSuccess(null)
  }

  function closeActivityModal() {
    setIsActivityModalOpen(false)
    resetForm()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const fd = new FormData()
    fd.append("date", date)
    fd.append("durationMin", durationMin)
    if (avgHeartRate) fd.append("avgHeartRate", avgHeartRate)
    fd.append("sport", sport)
    if (notes) fd.append("notes", notes)

    startTransition(async () => {
      const result = await addActivity(fd)
      if (!result.success) {
        setFormError(result.error)
        return
      }

      const newAct: Activity = {
        id: result.activityId,
        date: new Date(date).toISOString(),
        durationMin: parseFloat(durationMin),
        avgHeartRate: avgHeartRate ? parseFloat(avgHeartRate) : null,
        sport,
        notes: notes || null,
        trimp: result.trimp,
      }
      setActivities((prev) => [newAct, ...prev])

      const trimpMsg = result.trimp != null
        ? ` TRIMP calculat: ${result.trimp}.`
        : " TRIMP nu a putut fi calculat (completati datele cardiace in profil)."
      setFormSuccess(`Activitate adaugata cu succes!${trimpMsg} Reincarca pagina pentru valorile noi CTL/ATL/TSB.`)
      setDurationMin("")
      setAvgHeartRate("")
      setNotes("")
      setDate(today())
      setIsActivityModalOpen(false)
    })
  }

  async function handleDelete(id: number) {
    if (!confirm("Stergi aceasta activitate? Metricele de training load vor fi recalculate.")) return
    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteActivity(id)
      if (!result.success) {
        alert(result.error ?? "Eroare la stergere")
      } else {
        setActivities((prev) => prev.filter((a) => a.id !== id))
      }
      setDeletingId(null)
    })
  }

  async function submitCsv(file: File) {
    setImporting(true)
    setImportError("")
    setImportResults([])
    try {
      const records = parseCsv((await file.text()).replace(/^\uFEFF/, ""))
      const headers = records.shift()?.map((value) => value.toLowerCase().trim()) ?? []
      const required = ["date", "durationmin"]
      const missing = required.filter((name) => !headers.includes(name))
      if (missing.length) throw new Error(`Lipsesc coloanele obligatorii: ${missing.join(", ")}.`)
      const value = (row: string[], name: string) => row[headers.indexOf(name)] ?? ""
      const rows = records.map((row) => ({
        date: value(row, "date"),
        durationMin: value(row, "durationmin"),
        sport: value(row, "sport"),
        avgHeartRate: value(row, "avgheartrate"),
        notes: value(row, "notes"),
      }))
      if (!rows.length) throw new Error("Fisierul CSV nu contine activitati.")

      const results = (await importActivities(rows)).results
      setImportResults(results)
      const created = results.filter((result) => result.success && result.id)
      setActivities((current) => [
        ...created.map((result) => ({
          id: result.id!,
          date: result.activityDate!,
          durationMin: result.durationMin!,
          avgHeartRate: result.avgHeartRate,
          sport: result.sport,
          notes: result.notes,
          trimp: result.trimp ?? null,
        })),
        ...current,
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Importul a esuat.")
    } finally {
      setImporting(false)
      if (csvFileRef.current) csvFileRef.current.value = ""
    }
  }

  function downloadCsvTemplate() {
    const csv = `date,durationMin,sport,avgHeartRate,notes\n2026-07-12,90,${defaultSport},155,Antrenament tactic`
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "model-import-activitati.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {currentLoad && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div className="sd-box sd-metric-box">
            <div className="sd-metric-title">Fitness (CTL)</div>
            <div className="sd-metric-value">{currentLoad.ctl.toFixed(1)}</div>
            <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>EWMA 42 zile</div>
          </div>
          <div className="sd-box sd-metric-box">
            <div className="sd-metric-title">Fatigue (ATL)</div>
            <div className="sd-metric-value">{currentLoad.atl.toFixed(1)}</div>
            <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>EWMA 7 zile</div>
          </div>
          <div className="sd-box sd-metric-box">
            <div className="sd-metric-title">Form (TSB)</div>
            <div className="sd-metric-value" style={{ color: currentLoad.tsb > 0 ? "#0056b3" : currentLoad.tsb < -20 ? "#c00" : "#333" }}>
              {currentLoad.tsb > 0 ? "+" : ""}{currentLoad.tsb.toFixed(1)}
            </div>
            <div style={{ marginTop: "6px" }}><FormBadge tsb={currentLoad.tsb} /></div>
          </div>
          <div className="sd-box sd-metric-box">
            <div className="sd-metric-title">Workload Ratio</div>
            <div className="sd-metric-value">{currentLoad.acRatio.toFixed(2)}</div>
            <div style={{ marginTop: "6px" }}><RiskBadge ratio={currentLoad.acRatio} /></div>
          </div>
          {currentLoad.monotony != null && (
            <div className="sd-box sd-metric-box">
              <div className="sd-metric-title">Monotony</div>
              <div className="sd-metric-value">{currentLoad.monotony.toFixed(2)}</div>
              <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>Varietate antrenament</div>
            </div>
          )}
          {currentLoad.strain != null && (
            <div className="sd-box sd-metric-box">
              <div className="sd-metric-title">Strain</div>
              <div className="sd-metric-value">{currentLoad.strain.toFixed(1)}</div>
              <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>Sarcina saptamanala</div>
            </div>
          )}
        </div>
      )}

      {!hasCardiacData && (
        <div style={{ backgroundColor: "#fff8e1", border: "1px solid #ffe082", padding: "12px 16px", fontSize: "13px", color: "#795548", marginBottom: "20px" }}>
          <strong>Datele cardiace lipsesc din profil</strong> (HR_rest, HR_max). Fara acestea, TRIMP nu poate fi calculat.
          Contactati antrenorul sau administratorul pentru completare.
        </div>
      )}

      <div className="sd-box" style={{ marginBottom: "24px" }}>
        <div className="sd-box-header">
          <h2>Adauga activitate noua</h2>
        </div>
        <div className="sd-box-content">
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ ...FIELD_STYLE, flex: "1 1 140px" }}>
              <label htmlFor="act-date" style={LABEL_STYLE}>Data *</label>
              <input id="act-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required max={today()} style={INPUT_STYLE} />
            </div>
            <div style={{ ...FIELD_STYLE, flex: "1 1 140px" }}>
              <label htmlFor="act-duration" style={LABEL_STYLE}>Durata (minute) *</label>
              <input id="act-duration" type="number" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} required min="1" max="600" step="1" placeholder="ex. 90" style={INPUT_STYLE} />
            </div>
            <div style={{ ...FIELD_STYLE, flex: "1 1 160px" }}>
              <label htmlFor="act-sport" style={LABEL_STYLE}>Sport</label>
              <select id="act-sport" value={sport} onChange={(e) => setSport(e.target.value)} style={{ ...INPUT_STYLE, backgroundColor: "#fff" }}>
                {SPORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div style={{ ...FIELD_STYLE, flex: "1 1 160px" }}>
              <label htmlFor="act-hr" style={LABEL_STYLE}>FC medie (bpm){!hasCardiacData && <span style={{ color: "#b36000", marginLeft: "4px" }}>- necesar profil</span>}</label>
              <input id="act-hr" type="number" value={avgHeartRate} onChange={(e) => setAvgHeartRate(e.target.value)} min="30" max="250" step="1" placeholder="ex. 155" style={INPUT_STYLE} />
            </div>
            <div style={{ ...FIELD_STYLE, flex: "1 1 100%", width: "100%" }}>
              <label htmlFor="act-notes" style={LABEL_STYLE}>Note (optional)</label>
              <textarea id="act-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} placeholder="ex. Antrenament tactic, teren greu, recuperare dupa meci..." style={{ ...INPUT_STYLE, resize: "vertical" }} />
            </div>
            <button id="act-submit" type="submit" disabled={isPending} style={{ backgroundColor: isPending ? "#aaa" : "#0056b3", color: "#fff", border: "none", padding: "8px 24px", fontSize: "13px", fontWeight: "bold", cursor: isPending ? "not-allowed" : "pointer", alignSelf: "flex-end" }}>
              {isPending ? "Se salveaza..." : "Adauga activitate"}
            </button>
          </form>
          {formError && <p style={{ color: "#c00", fontSize: "12px", marginTop: "10px" }}>Eroare: {formError}</p>}
          {formSuccess && <p style={{ color: "#2a7a2a", fontSize: "12px", marginTop: "10px" }}>{formSuccess}</p>}
        </div>
      </div>

      <div className="sd-box" style={{ marginBottom: "24px" }}>
        <div className="sd-box-header"><h2>Importa activitati din CSV</h2></div>
        <div className="sd-box-content">
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="button" onClick={downloadCsvTemplate} className="sd-btn-secondary">Descarca model CSV</button>
            <label className="sd-btn-primary" style={{ cursor: importing ? "not-allowed" : "pointer" }}>
              {importing ? "Se importa..." : "Alege fisier CSV"}
              <input ref={csvFileRef} type="file" accept=".csv,text/csv" disabled={importing || isPending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void submitCsv(file) }} style={{ display: "none" }} />
            </label>
          </div>
          {importError && <p style={{ color: "#c00", fontSize: "12px" }}>{importError}</p>}
          {importResults.length > 0 && (
            <div style={{ marginTop: "14px", overflowX: "auto" }}>
              <p style={{ fontSize: "13px", fontWeight: 700 }}>Import finalizat: {importResults.filter((result) => result.success).length} create, {importResults.filter((result) => !result.success).length} respinse.</p>
              <table className="sd-table">
                <thead><tr><th>Rand</th><th>Data</th><th>Sport</th><th>Rezultat</th><th>ID / eroare</th></tr></thead>
                <tbody>
                  {importResults.map((result) => (
                    <tr key={`${result.row}-${result.date}`}>
                      <td>{result.row}</td><td>{result.date || "-"}</td><td>{result.sport}</td>
                      <td style={{ color: result.success ? "#2a7a2a" : "#c00", fontWeight: 700 }}>{result.success ? "Creata" : "Respinsa"}</td>
                      <td>{result.id ?? result.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="sd-box">
        <div className="sd-box-header">
          <h2>Activitatile mele ({activities.length})</h2>
        </div>
        <div className="sd-box-content" style={{ padding: 0 }}>
          <table className="sd-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Sport</th>
                <th>Durata</th>
                <th>FC medie</th>
                <th>TRIMP</th>
                <th>Note</th>
                <th>Actiuni</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => (
                <tr key={act.id}>
                  <td style={{ fontSize: "13px" }}>{formatDate(act.date)}</td>
                  <td>
                    {act.sport ? (
                      <span style={{ backgroundColor: "#e8f0fb", color: "#0056b3", padding: "2px 8px", fontSize: "11px", fontWeight: "bold" }}>
                        {SPORT_OPTIONS.find((option) => option.value === act.sport)?.label ?? act.sport}
                      </span>
                    ) : <span style={{ color: "#999" }}>-</span>}
                  </td>
                  <td style={{ fontSize: "13px" }}>{formatDuration(act.durationMin)}</td>
                  <td style={{ fontSize: "13px", color: "#555" }}>{act.avgHeartRate ? `${act.avgHeartRate} bpm` : <span style={{ color: "#999" }}>-</span>}</td>
                  <td>
                    {act.trimp != null ? (
                      <span style={{ backgroundColor: "#e8f5e9", color: "#2a7a2a", padding: "2px 8px", fontSize: "11px", fontWeight: "bold" }}>{act.trimp.toFixed(1)}</span>
                    ) : <span style={{ color: "#999", fontSize: "11px" }}>N/A</span>}
                  </td>
                  <td style={{ fontSize: "12px", color: "#666", maxWidth: "200px" }}>
                    {act.notes ? <span title={act.notes}>{act.notes.length > 50 ? act.notes.slice(0, 50) + "..." : act.notes}</span> : <span style={{ color: "#999" }}>-</span>}
                  </td>
                  <td>
                    <button onClick={() => handleDelete(act.id)} disabled={isPending && deletingId === act.id} style={{ fontSize: "11px", border: "1px solid #c00", color: "#c00", backgroundColor: "transparent", padding: "2px 8px", cursor: "pointer" }}>
                      {isPending && deletingId === act.id ? "..." : "Sterge"}
                    </button>
                  </td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#999", padding: "24px" }}>
                    Nu ai adaugat nicio activitate inca. Completeaza formularul de mai sus!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isActivityModalOpen && (
        <ActivityModal
          date={date}
          durationMin={durationMin}
          avgHeartRate={avgHeartRate}
          sport={sport}
          notes={notes}
          hasCardiacData={hasCardiacData}
          sportOptions={SPORT_OPTIONS}
          isPending={isPending}
          formError={formError}
          formSuccess={formSuccess}
          today={today()}
          onDateChange={setDate}
          onDurationChange={setDurationMin}
          onHeartRateChange={setAvgHeartRate}
          onSportChange={setSport}
          onNotesChange={setNotes}
          onClose={closeActivityModal}
          onSubmit={handleSubmit}
        />
      )}
    </>
  )
}