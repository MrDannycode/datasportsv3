"use client"

import { useState } from "react"
import { useTableMode } from "@/components/table-mode-provider"

type ActivityCalendarEvent = {
    id: string
    date: string
    label: string
    title: string
    details: string
    color: string
    backgroundColor: string
}

type ActivityCalendarProps = {
    events: ActivityCalendarEvent[]
    initialMonth: string
}

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"]
const WEEKDAY_LABELS_NORMAL = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"]

function formatDateKey(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function buildMonthDays(monthDate: Date) {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const mondayStartOffset = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const totalCells = Math.ceil((mondayStartOffset + daysInMonth) / 7) * 7

    return Array.from({ length: totalCells }, (_, index) => {
        const date = new Date(year, month, index - mondayStartOffset + 1)
        return {
            date,
            key: formatDateKey(date),
            day: date.getDate(),
            isCurrentMonth: date.getMonth() === month,
        }
    })
}

function parseMonth(value: string) {
    const [year, month] = value.split("-").map(Number)
    return new Date(year, month - 1, 1)
}

function shiftMonth(monthDate: Date, delta: number) {
    return new Date(monthDate.getFullYear(), monthDate.getMonth() + delta, 1)
}

const TODAY_KEY = formatDateKey(new Date())

export default function ActivitiesCalendar({ events, initialMonth }: ActivityCalendarProps) {
    const [visibleMonth, setVisibleMonth] = useState(() => parseMonth(initialMonth))
    const { tableMode } = useTableMode()

    if (tableMode === "normal") {
        return (
            <NormalCalendar
                events={events}
                visibleMonth={visibleMonth}
                setVisibleMonth={setVisibleMonth}
            />
        )
    }

    /* ── Focus mode — original design ─────────────────────────── */
    if (events.length === 0) {
        return <p style={{ fontSize: "14px", color: "#666" }}>Nu exista activitati, meciuri sau antrenamente programate.</p>
    }

    const activityCalendarDays = buildMonthDays(visibleMonth)
    const activityEventsByDate = events.reduce<Record<string, ActivityCalendarEvent[]>>((acc, event) => {
        const key = formatDateKey(new Date(event.date))
        acc[key] = [...(acc[key] ?? []), event]
        return acc
    }, {})

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                <button
                    type="button"
                    onClick={() => setVisibleMonth((currentMonth) => shiftMonth(currentMonth, -1))}
                    style={{
                        border: "1px solid #d0d7de",
                        backgroundColor: "#fff",
                        color: "#333",
                        padding: "4px 8px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        cursor: "pointer",
                    }}
                    aria-label="Luna anterioara"
                >
                    {"<"}
                </button>
                <strong style={{ fontSize: "13px", color: "#333", textTransform: "capitalize" }}>
                    {visibleMonth.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}
                </strong>
                <button
                    type="button"
                    onClick={() => setVisibleMonth((currentMonth) => shiftMonth(currentMonth, 1))}
                    style={{
                        border: "1px solid #d0d7de",
                        backgroundColor: "#fff",
                        color: "#333",
                        padding: "4px 8px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        cursor: "pointer",
                    }}
                    aria-label="Luna urmatoare"
                >
                    {">"}
                </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", color: "#666" }}>
                    {events.length} evenimente
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "11px", color: "#555" }}>
                    <span><strong style={{ color: "#2a7a2a" }}>Fitness</strong></span>
                    <span><strong style={{ color: "#9a4b00" }}>Meci</strong></span>
                    <span><strong style={{ color: "#0056b3" }}>Antrenament</strong></span>
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(28px, 1fr))", gap: "4px", marginBottom: "4px" }}>
                {WEEKDAY_LABELS.map((label, index) => (
                    <div key={`${label}-${index}`} style={{ fontSize: "11px", color: "#777", fontWeight: "bold", textAlign: "center" }}>
                        {label}
                    </div>
                ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(28px, 1fr))", gap: "4px" }}>
                {activityCalendarDays.map((day) => {
                    const dayEvents = activityEventsByDate[day.key] ?? []
                    const dayTitle = dayEvents
                        .map((event) => `${event.title} - ${event.details}`)
                        .join("\n")

                    return (
                        <div
                            key={day.key}
                            title={dayTitle || undefined}
                            style={{
                                minHeight: "58px",
                                border: "1px solid #e2e2e2",
                                backgroundColor: dayEvents.length > 0 ? "#f8fbff" : day.isCurrentMonth ? "#fff" : "#f7f7f7",
                                color: day.isCurrentMonth ? "#333" : "#aaa",
                                padding: "4px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "3px",
                                overflow: "hidden",
                            }}
                        >
                            <span style={{ fontSize: "11px", fontWeight: dayEvents.length > 0 ? "bold" : "normal", lineHeight: 1 }}>
                                {day.day}
                            </span>
                            {dayEvents.slice(0, 3).map((event) => (
                                <span
                                    key={event.id}
                                    style={{
                                        display: "block",
                                        backgroundColor: event.backgroundColor,
                                        color: event.color,
                                        border: `1px solid ${event.color}`,
                                        fontSize: "10px",
                                        fontWeight: "bold",
                                        lineHeight: "12px",
                                        padding: "1px 3px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {event.label}
                                </span>
                            ))}
                            {dayEvents.length > 3 && (
                                <span style={{ fontSize: "10px", color: "#333", fontWeight: "bold", lineHeight: 1 }}>
                                    +{dayEvents.length - 3}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   Normal mode — premium calendar
═══════════════════════════════════════════════════════════════ */
function NormalCalendar({
    events,
    visibleMonth,
    setVisibleMonth,
}: {
    events: ActivityCalendarEvent[]
    visibleMonth: Date
    setVisibleMonth: React.Dispatch<React.SetStateAction<Date>>
}) {
    const [hoveredDay, setHoveredDay] = useState<string | null>(null)

    /* detect dark within Normal mode via CSS class on <html> */
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark")

    const t = isDark
        ? {
              bg: "rgba(7,26,18,0.92)",
              headerBg: "linear-gradient(135deg,#064e3b 0%,#065f46 100%)",
              navBtn: "rgba(52,211,153,0.10)",
              navBtnHover: "rgba(52,211,153,0.22)",
              navBtnBorder: "rgba(52,211,153,0.28)",
              navBtnColor: "#6ee7b7",
              monthColor: "#d1fae5",
              weekdayColor: "rgba(110,231,183,0.60)",
              dayBg: "rgba(13,33,24,0.70)",
              dayBgOtherMonth: "rgba(7,26,18,0.40)",
              dayBgHover: "rgba(52,211,153,0.12)",
              dayBgToday: "rgba(5,150,105,0.20)",
              dayBgEvent: "rgba(52,211,153,0.10)",
              dayBorder: "rgba(16,185,129,0.18)",
              dayBorderToday: "#34d399",
              dayNumColor: "#a7f3d0",
              dayNumOtherMonth: "rgba(107,114,128,0.50)",
              dayNumToday: "#6ee7b7",
              plusColor: "rgba(110,231,183,0.70)",
              emptyText: "#34d399",
              countColor: "rgba(110,231,183,0.55)",
              legendColors: { fitness: "#6ee7b7", match: "#fb923c", training: "#60a5fa" },
              shadow: "0 8px 32px rgba(0,0,0,0.40), 0 2px 8px rgba(5,150,105,0.15)",
          }
        : {
              bg: "#ffffff",
              headerBg: "linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%)",
              navBtn: "rgba(5,150,105,0.07)",
              navBtnHover: "rgba(5,150,105,0.16)",
              navBtnBorder: "rgba(16,185,129,0.30)",
              navBtnColor: "#065f46",
              monthColor: "#064e3b",
              weekdayColor: "rgba(6,78,59,0.50)",
              dayBg: "#fafffe",
              dayBgOtherMonth: "#f3f4f6",
              dayBgHover: "rgba(5,150,105,0.08)",
              dayBgToday: "rgba(5,150,105,0.12)",
              dayBgEvent: "rgba(209,250,229,0.70)",
              dayBorder: "rgba(16,185,129,0.15)",
              dayBorderToday: "#059669",
              dayNumColor: "#1f2937",
              dayNumOtherMonth: "#c9d1d9",
              dayNumToday: "#059669",
              plusColor: "#6b7280",
              emptyText: "#059669",
              countColor: "rgba(107,114,128,0.65)",
              legendColors: { fitness: "#059669", match: "#ea580c", training: "#2563eb" },
              shadow: "0 4px 24px rgba(5,150,105,0.10), 0 1px 6px rgba(5,150,105,0.06)",
          }

    if (events.length === 0) {
        return (
            <div style={{
                padding: "24px",
                borderRadius: "16px",
                background: t.bg,
                boxShadow: t.shadow,
                textAlign: "center",
                fontSize: "14px",
                color: t.emptyText,
                fontWeight: 500,
            }}>
                Nu există activități, meciuri sau antrenamente programate.
            </div>
        )
    }

    const activityCalendarDays = buildMonthDays(visibleMonth)
    const activityEventsByDate = events.reduce<Record<string, ActivityCalendarEvent[]>>((acc, event) => {
        const key = formatDateKey(new Date(event.date))
        acc[key] = [...(acc[key] ?? []), event]
        return acc
    }, {})

    return (
        <div style={{
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: t.shadow,
            border: `1px solid ${t.dayBorder}`,
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}>
            {/* Header */}
            <div style={{
                background: t.headerBg,
                padding: "16px 18px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                borderBottom: `1px solid ${t.dayBorder}`,
            }}>
                <NormalNavButton
                    label="←"
                    ariaLabel="Luna anterioară"
                    onClick={() => setVisibleMonth(m => shiftMonth(m, -1))}
                    color={t.navBtnColor}
                    bg={t.navBtn}
                    hoverBg={t.navBtnHover}
                    border={t.navBtnBorder}
                />
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: t.monthColor,
                        textTransform: "capitalize",
                        letterSpacing: "0.02em",
                    }}>
                        {visibleMonth.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}
                    </div>
                    <div style={{ fontSize: "11px", color: t.countColor, marginTop: "2px", fontWeight: 500 }}>
                        {events.length} {events.length === 1 ? "eveniment" : "evenimente"}
                    </div>
                </div>
                <NormalNavButton
                    label="→"
                    ariaLabel="Luna următoare"
                    onClick={() => setVisibleMonth(m => shiftMonth(m, 1))}
                    color={t.navBtnColor}
                    bg={t.navBtn}
                    hoverBg={t.navBtnHover}
                    border={t.navBtnBorder}
                />
            </div>

            {/* Body */}
            <div style={{ background: t.bg, padding: "14px" }}>
                {/* Weekday headers */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "4px",
                    marginBottom: "8px",
                }}>
                    {WEEKDAY_LABELS_NORMAL.map((label, i) => (
                        <div key={i} style={{
                            textAlign: "center",
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "0.07em",
                            color: t.weekdayColor,
                            textTransform: "uppercase",
                            paddingBottom: "4px",
                        }}>
                            {label}
                        </div>
                    ))}
                </div>

                {/* Day grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                    {activityCalendarDays.map((day) => {
                        const dayEvents = activityEventsByDate[day.key] ?? []
                        const isToday = day.key === TODAY_KEY
                        const hasEvents = dayEvents.length > 0
                        const isHovered = hoveredDay === day.key
                        const dayTitle = dayEvents.map(e => `${e.title} – ${e.details}`).join("\n")

                        let dayBg = day.isCurrentMonth
                            ? (hasEvents ? t.dayBgEvent : t.dayBg)
                            : t.dayBgOtherMonth
                        if (isToday) dayBg = t.dayBgToday
                        if (isHovered && day.isCurrentMonth) dayBg = t.dayBgHover

                        return (
                            <div
                                key={day.key}
                                title={dayTitle || undefined}
                                onMouseEnter={() => setHoveredDay(day.key)}
                                onMouseLeave={() => setHoveredDay(null)}
                                style={{
                                    minHeight: "62px",
                                    borderRadius: "10px",
                                    border: isToday
                                        ? `2px solid ${t.dayBorderToday}`
                                        : `1px solid ${t.dayBorder}`,
                                    backgroundColor: dayBg,
                                    padding: "5px 4px 4px 5px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "3px",
                                    overflow: "hidden",
                                    cursor: hasEvents ? "pointer" : "default",
                                    transition: "background 0.15s ease, box-shadow 0.15s ease",
                                    boxShadow: isHovered && hasEvents
                                        ? "0 2px 10px rgba(5,150,105,0.18)"
                                        : "none",
                                }}
                            >
                                <span style={{
                                    fontSize: "11px",
                                    fontWeight: isToday ? 800 : (hasEvents ? 600 : 400),
                                    lineHeight: 1.1,
                                    color: !day.isCurrentMonth
                                        ? t.dayNumOtherMonth
                                        : isToday
                                            ? t.dayNumToday
                                            : t.dayNumColor,
                                    marginBottom: "1px",
                                }}>
                                    {day.day}
                                </span>
                                {dayEvents.slice(0, 3).map((event) => (
                                    <span
                                        key={event.id}
                                        style={{
                                            display: "block",
                                            backgroundColor: event.backgroundColor,
                                            color: event.color,
                                            border: `1px solid ${event.color}22`,
                                            borderLeft: `3px solid ${event.color}`,
                                            fontSize: "9px",
                                            fontWeight: 700,
                                            lineHeight: "13px",
                                            padding: "0px 4px",
                                            borderRadius: "4px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            letterSpacing: "0.02em",
                                        }}
                                    >
                                        {event.label}
                                    </span>
                                ))}
                                {dayEvents.length > 3 && (
                                    <span style={{ fontSize: "9px", color: t.plusColor, fontWeight: 700, lineHeight: 1 }}>
                                        +{dayEvents.length - 3}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Legend */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "16px",
                    marginTop: "14px",
                    paddingTop: "12px",
                    borderTop: `1px solid ${t.dayBorder}`,
                }}>
                    {([
                        { label: "Fitness", color: t.legendColors.fitness },
                        { label: "Meci",    color: t.legendColors.match },
                        { label: "Antren.", color: t.legendColors.training },
                    ] as const).map(({ label, color }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "2px",
                                background: color,
                                display: "inline-block",
                                flexShrink: 0,
                            }} />
                            <span style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: t.countColor,
                                letterSpacing: "0.03em",
                            }}>
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function NormalNavButton({
    label, ariaLabel, onClick, color, bg, hoverBg, border,
}: {
    label: string
    ariaLabel: string
    onClick: () => void
    color: string
    bg: string
    hoverBg: string
    border: string
}) {
    const [hovered, setHovered] = useState(false)
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: "32px",
                height: "32px",
                borderRadius: "9px",
                border: `1px solid ${border}`,
                background: hovered ? hoverBg : bg,
                color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.15s ease",
                lineHeight: 1,
            }}
        >
            {label}
        </button>
    )
}
