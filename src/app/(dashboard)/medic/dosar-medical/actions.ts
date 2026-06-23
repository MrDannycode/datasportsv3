"use server"

import { prisma as db } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Severity } from "@prisma/client"

export async function getMedicalRecords() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "medic") {
        throw new Error("Unauthorized")
    }

    return db.medicalRecord.findMany({
        include: {
            athlete: {
                include: {
                    user: {
                        include: {
                            profile: true
                        }
                    }
                }
            },
            injuries: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

export async function getFootballAthletes() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "medic") {
        throw new Error("Unauthorized")
    }

    return db.footballAthlete.findMany({
        include: {
            user: {
                include: {
                    profile: true
                }
            }
        }
    })
}

export async function saveMedicalRecord(data: {
    id?: number,
    athleteId: number,
    diagnosis: string,
    treatment: string,
    startDate: Date,
    endDate?: Date | null,
    isAvailable: boolean,
    injuries: {
        id?: number,
        injuryType: string,
        bodyPart: string,
        severity: Severity,
        recoveryDays: number,
        notes?: string
    }[]
}) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "medic") {
        throw new Error("Unauthorized")
    }

    const { id, athleteId, diagnosis, treatment, startDate, endDate, isAvailable, injuries } = data;

    if (id) {
        // Update
        return db.$transaction(async (tx) => {
            const updatedRecord = await tx.medicalRecord.update({
                where: { id },
                data: {
                    athleteId,
                    diagnosis,
                    treatment,
                    startDate,
                    endDate,
                    isAvailable,
                }
            });

            // Update injuries: for simplicity, we delete existing and recreate, or we can upsert if we track IDs
            // Deleting all existing injuries for this record and recreating them is easier to manage
            await tx.injury.deleteMany({
                where: { medicalRecordId: id }
            });

            if (injuries && injuries.length > 0) {
                await tx.injury.createMany({
                    data: injuries.map(inj => ({
                        medicalRecordId: id,
                        injuryType: inj.injuryType,
                        bodyPart: inj.bodyPart,
                        severity: inj.severity,
                        recoveryDays: inj.recoveryDays,
                        notes: inj.notes
                    }))
                });
            }

            return updatedRecord;
        });
    } else {
        // Create
        return db.medicalRecord.create({
            data: {
                athleteId,
                medicId: Number(session.user.id),
                diagnosis,
                treatment,
                startDate,
                endDate,
                isAvailable,
                injuries: {
                    create: injuries.map(inj => ({
                        injuryType: inj.injuryType,
                        bodyPart: inj.bodyPart,
                        severity: inj.severity,
                        recoveryDays: inj.recoveryDays,
                        notes: inj.notes
                    }))
                }
            }
        });
    }
}
