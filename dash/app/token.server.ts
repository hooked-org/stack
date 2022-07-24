import { prisma } from './db.server';
import crypto from 'crypto'
import { getCookie } from './cookies';
import type { users } from '@prisma/client';

export const getRandomKey = (length: number) => {
  return crypto.randomBytes(length).toString('hex');
}

export const createToken = (userId: string, key: string, validFor: number) => {
  const expires = Math.floor((new Date().getTime() / 1000) + validFor);
  const salt = getRandomKey(16)
  const payload = Buffer.from(`${expires}.${userId}.${salt}`, 'utf8').toString('base64')
  const signature = crypto.createHmac('sha256', key).update(payload).digest('hex')
  return { token: `${payload}.${signature}`, expires };
}

export const verifyToken = (token: string, key: string) => {
  const [payload, signature] = token.split('.');
  const decoded = Buffer.from(payload, 'base64').toString('utf8')
  const [expires, userId] = decoded.split('.')
  const expectedSignature = crypto.createHmac('sha256', key).update(payload).digest('hex')
  return {
    valid: signature === expectedSignature && parseInt(expires) > Math.floor((new Date().getTime() / 1000)),
    userId
  }
}

export const userFromCookie = async (request: any): Promise<users> => {
  const cookie = await getCookie(request)
  if (cookie.token) {
    const [payload, signature] = cookie.token.split('.')
    if (!payload || !signature) throw new Error('Invalid token')
    const decoded = Buffer.from(payload, 'base64').toString('utf8')
    const [expires, userId] = decoded.split('.')
    if (!expires || !userId) throw new Error('Invalid token')
    const user = await prisma.users.findFirstOrThrow({ where: { id: parseInt(userId) } })
    if (!user) throw new Error('Invalid token')
    return user
  }
  throw new Error('Invalid token')
}