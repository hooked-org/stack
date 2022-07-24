import type { users } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()

export interface SafeUser {
  id: number
  name: string
  email: string
  tier: number
}

export const userToSafeUser = (user: users): SafeUser => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    tier: user.tier,
  }
}