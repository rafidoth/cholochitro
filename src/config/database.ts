import pg from 'pg'
import { envs } from './env'
import { logger } from '@/utils/logger'

const { Pool } = pg

const createPool = (db_url: string) => {
    return new Pool({
        connectionString: db_url
    })
}

const getConnectionString = () => {
    if (envs.NODE_ENV === "test") {
        return envs.TEST_DATABASE_URL
    }
    return envs.DATABASE_URL
}

export const pool = createPool(getConnectionString())

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
