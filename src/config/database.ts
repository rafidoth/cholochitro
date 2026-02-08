import pg from 'pg'
import { envs } from './env'
import { logger } from '@/utils/logger'

const { Pool } = pg
const connectionString = envs.DATABASE_URL

export const pool = new Pool({
    connectionString,
})


export const pingDatabase = async () => {
    try {
        await pool.query('SELECT 1');
        logger.info("Database Connection is OK.")
        return true;
    } catch (err) {
        logger.error({ error: (err as Error).message }, 'Database connection failed')
        return false;
    }
}
