"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type UpdateProfileResult =
  | { success: true }
  | { success: false; error: string }

export async function updateMyProfile(formData: FormData): Promise<UpdateProfileResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Neautorizat" }
  }

  const userId = Number(session.user.id)
  
  // Extragem datele din formular
  const firstName = formData.get("firstName") as string | null
  const lastName = formData.get("lastName") as string | null
  const phone = formData.get("phone") as string | null
  const dateOfBirthStr = formData.get("dateOfBirth") as string | null
  const restingHeartRateStr = formData.get("restingHeartRate") as string | null
  const maxHeartRateStr = formData.get("maxHeartRate") as string | null
  const genderStr = formData.get("gender") as string | null
  
  // Date specifice sportivilor
  const heightCmStr = formData.get("heightCm") as string | null
  const weightKgStr = formData.get("weightKg") as string | null
  const preferredFoot = formData.get("preferredFoot") as string | null // pentru fotbalisti
  const preferredHand = formData.get("preferredHand") as string | null // pentru tenismani
  const atpWtaRankingStr = formData.get("atpWtaRanking") as string | null // pentru tenismani
  
  if (!firstName || !lastName) {
    return { success: false, error: "Numele și prenumele sunt obligatorii" }
  }

  const profileData: any = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone ? phone.trim() : null,
  }

  if (dateOfBirthStr) {
    profileData.dateOfBirth = new Date(dateOfBirthStr)
  }

  if (restingHeartRateStr) {
    const hr = parseInt(restingHeartRateStr)
    if (!isNaN(hr) && hr > 30 && hr < 200) {
      profileData.restingHeartRate = hr
    }
  }

  if (maxHeartRateStr) {
    const hr = parseInt(maxHeartRateStr)
    if (!isNaN(hr) && hr > 100 && hr <= 250) {
      profileData.maxHeartRate = hr
    }
  }

  if (genderStr === "MALE" || genderStr === "FEMALE") {
    profileData.gender = genderStr
  }

  try {
    // 1. Actualizare Profil
    const updatedProfile = await prisma.profile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData,
      },
    })

    // 2. Verificare si actualizare atlet fotbal (daca e cazul)
    if (heightCmStr || weightKgStr || preferredFoot || preferredHand || atpWtaRankingStr !== null) {
      const footballAthlete = await prisma.footballAthlete.findUnique({ where: { userId } })
      if (footballAthlete) {
        const updateData: any = {}
        if (heightCmStr) updateData.heightCm = parseFloat(heightCmStr)
        if (weightKgStr) updateData.weightKg = parseFloat(weightKgStr)
        if (preferredFoot === "stanga" || preferredFoot === "dreapta" || preferredFoot === "ambele") {
          updateData.preferredFoot = preferredFoot
        }
        await prisma.footballAthlete.update({
          where: { userId },
          data: updateData
        })
      }
      
      if (session.user.role === "atlet_tenis") {
        const updateData: any = {}
        if (heightCmStr) updateData.heightCm = parseFloat(heightCmStr)
        if (weightKgStr) updateData.weightKg = parseFloat(weightKgStr)
        if (preferredHand === "stanga" || preferredHand === "dreapta") {
          updateData.preferredHand = preferredHand
        }
        if (atpWtaRankingStr !== null) {
          const ranking = parseInt(atpWtaRankingStr)
          updateData.atpWtaRanking = !isNaN(ranking) && ranking > 0 ? ranking : null
        }

        await prisma.tennisAthlete.upsert({
          where: { userId },
          update: updateData,
          create: {
            userId,
            preferredHand: preferredHand === "stanga" || preferredHand === "dreapta" ? preferredHand : "dreapta",
            playingStyle: "baseline",
            ...updateData,
          },
        })
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Eroare update profil:", error)
    return { success: false, error: "A apărut o eroare la salvarea profilului" }
  }
}


