import dotenv from 'dotenv'
dotenv.config()

export default {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ai_discussion?schema=public',
  PORT: parseInt(process.env.PORT || '8200', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  ADMIN_ROLE_ID: process.env.ADMIN_ROLE_ID ? parseInt(process.env.ADMIN_ROLE_ID, 10) : undefined,
}