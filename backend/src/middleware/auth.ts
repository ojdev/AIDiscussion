import jwt from 'jsonwebtoken'
import config from '../config.js'

export async function verifyToken(req: any, reply: any) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing or invalid authorization header' })
  }

  const token = authHeader.slice(7)

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { apiKey: string; userId: number; role: string }
    req.user = decoded
    return true
  } catch (err) {
    return reply.code(401).send({ error: 'Invalid or expired token' })
  }
}