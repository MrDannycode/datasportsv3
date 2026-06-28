"use client"

import { useState } from "react"

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

export default function ActivitiesCalendar({ events, initialMonth }: ActivityCalendarProps) {
    const [visibleMonth, setVisibleMonth] = useState(() => parseMonth(initialMonth))

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
