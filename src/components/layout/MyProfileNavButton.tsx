"use client"

import { useState, useTransition } from "react"
import MyProfileModal from "./MyProfileModal"
import { updateMyProfile } from "@/app/(dashboard)/actions/profile"

type ProfileData = {
  firstName: string
  lastName: string
  dateOfBirth: string | null
  phone: string | null
  restingHeartRate: number | null
  maxHeartRate: number | null
  gender: "MALE" | "FEMALE" | null
  heightCm?: number | null
  weightKg?: number | null
  preferredFoot?: string | null
  preferredHand?: string | null
  sportType?: "fotbal" | "tenis" | null
}

export default function MyProfileNavButton({
  label,
  isActive = false,
  initialData,
}: {
  label: string
  isActive?: boolean
  initialData: ProfileData
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent, data: any) {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const fd = new FormData()
    if (data.firstName) fd.append("firstName", data.firstName)
    if (data.lastName) fd.append("lastName", data.lastName)
    if (data.dateOfBirth) fd.append("dateOfBirth", data.dateOfBirth)
    if (data.phone) fd.append("phone", data.phone)
    if (data.gender) fd.append("gender", data.gender)
    if (data.restingHeartRate) fd.append("restingHeartRate", data.restingHeartRate)
    if (data.maxHeartRate) fd.append("maxHeartRate", data.maxHeartRate)
    if (data.heightCm) fd.append("heightCm", data.heightCm)
    if (data.weightKg) fd.append("weightKg", data.weightKg)
    if (data.preferredFoot) fd.append("preferredFoot", data.preferredFoot)
    if (data.preferredHand) fd.append("preferredHand", data.preferredHand)

    startTransition(async () => {
      const result = await updateMyProfile(fd)
      if (!result.success) {
        setFormError(result.error || "Eroare necunoscuta")
        return
      }

      setFormSuccess("Profil salvat cu succes! Reîncarcă pagina pentru a vedea datele noi.")
      setTimeout(() => {
        setIsOpen(false)
        window.location.reload()
      }, 1500)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={isActive ? "active" : ""}
        style={{
          margin: "0 10px",
          fontWeight: "bold",
          color: "#555",
          fontSize: "14px",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        {label}
      </button>

      {isOpen && (
        <MyProfileModal
          initialData={initialData}
          isPending={isPending}
          formError={formError}
          formSuccess={formSuccess}
          onSubmit={handleSubmit}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
