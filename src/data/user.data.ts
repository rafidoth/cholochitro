import { pool } from "@/config/database";
import type { User, UserRole } from "@/types/user";

export const userRepository = {
    async create(
        email: string,
        passwordHash: string,
        displayName: string,
        role: UserRole = 'user'
    ): Promise<User> {
        const query = `
            INSERT INTO users (email, password_hash, display_name, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, password_hash, display_name, role, created_at, updated_at
        `;
        const values = [email, passwordHash, displayName, role];
        const result = await pool.query(query, values);
        return mapRowToUser(result.rows[0]);
    },

    async findByEmail(email: string): Promise<User | null> {
        const query = `
            SELECT id, email, password_hash, display_name, role, created_at, updated_at
            FROM users
            WHERE email = $1
        `;
        const result = await pool.query(query, [email]);
        if (result.rows.length === 0) {
            return null;
        }
        return mapRowToUser(result.rows[0]);
    },

    async findById(id: string): Promise<User | null> {
        const query = `
            SELECT id, email, password_hash, display_name, role, created_at, updated_at
            FROM users
            WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return mapRowToUser(result.rows[0]);
    },

    async deleteById(id: string): Promise<boolean> {
        const query = `
            DELETE FROM users
            WHERE id = $1
            RETURNING id
        `;
        const result = await pool.query(query, [id]);
        return result.rowCount !== null && result.rowCount > 0;
    },

    async deleteByEmail(email: string): Promise<boolean> {
        const query = `
            DELETE FROM users
            WHERE email = $1
            RETURNING id
        `;
        const result = await pool.query(query, [email]);
        return result.rowCount !== null && result.rowCount > 0;
    }

};

function mapRowToUser(row: {
    id: string;
    email: string;
    password_hash: string;
    display_name: string;
    role: UserRole;
    created_at: Date;
    updated_at: Date;
}): User {
    return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        displayName: row.display_name,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
