"use client"

import { useState } from "react"
import AthleteInviteModal from "@/app/(dashboard)/manager-fotbal/AthleteInviteModal"
import { inviteAthlete, type AthleteInviteInput, type AthleteInviteResult } from "@/app/(dashboard)/manager-fotbal/athlete-actions"

type Team = { id: number; name: string }

const emptyInvite: AthleteInviteInput = { email: "", firstName: "", lastName: "", position: "mijlocas", preferredFoot: "dreapta", teamId: "", jerseyNumber: "" }

interface Props {
    label: string
    teams: Team[]
    isActive?: boolean
}

export default function AddAthleteNavButton({ label, teams, isActive = false }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [invite, setInvite] = useState<AthleteInviteInput>(emptyInvite)
    const [inviteResult, setInviteResult] = useState<AthleteInviteResult | null>(null)
    const [busy, setBusy] = useState(false)

    const update = (name: keyof AthleteInviteInput, value: string) => setInvite(current => ({ ...current, [name]: value }))

    const closeModal = () => {
        setIsOpen(false)
        setInviteResult(null)
    }

    async function submitInvite(event: React.FormEvent) {
        event.preventDefault()
        setBusy(true)
        setInviteResult(null)
        try {
            const result = await inviteAthlete(invite)
            setInviteResult(result)
            if (result.success) {
                setInvite(emptyInvite)
            }
        } finally {
            setBusy(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`sd-nav-button${isActive ? " active" : ""}`}
            >
                {label}
            </button>

            {isOpen && (
                <AthleteInviteModal
                    invite={invite}
                    teams={teams}
                    busy={busy}
                    inviteResult={inviteResult}
                    onUpdate={update}
                    onClose={closeModal}
                    onSubmit={submitInvite}
                />
            )}
        </>
    )
}