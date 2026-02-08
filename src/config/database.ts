import pg from 'pg'
import { envs } from './env'

const { Pool } = pg
const connectionString = envs.DATABASE_URL

export const pool = new Pool({
    connectionString,
})



