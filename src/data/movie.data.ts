import { pool } from "@/config/database";
import type { Movie, MovieStatus } from "@/types/movie";

export const movieRepository = {
    async create(data: {
        title: string;
        description?: string;
        durationMinutes: number;
        genre?: string;
        posterUrl?: string;
        status: MovieStatus;
        releaseDate?: string;
    }): Promise<Movie> {
        const query = `
            INSERT INTO movies (title, description, duration_minutes, genre, poster_url, status, release_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, title, description, duration_minutes, genre, poster_url, status, release_date, created_at, updated_at
        `;
        const values = [
            data.title,
            data.description || null,
            data.durationMinutes,
            data.genre || null,
            data.posterUrl || null,
            data.status,
            data.releaseDate || null,
        ];
        const result = await pool.query(query, values);
        return mapRowToMovie(result.rows[0]);
    },

    async findById(id: string): Promise<Movie | null> {
        const query = `
            SELECT id, title, description, duration_minutes, genre, poster_url, status, release_date, created_at, updated_at
            FROM movies
            WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return mapRowToMovie(result.rows[0]);
    },

    async findAll(options: {
        status?: MovieStatus;
        page: number;
        limit: number;
    }): Promise<{ movies: Movie[]; total: number }> {
        let whereClause = "";
        const values: (string | number)[] = [];
        let paramIndex = 1;

        if (options.status) {
            whereClause = `WHERE status = $${paramIndex}`;
            values.push(options.status);
            paramIndex++;
        }

        const countQuery = `SELECT COUNT(*) FROM movies ${whereClause}`;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        const offset = (options.page - 1) * options.limit;
        values.push(options.limit, offset);

        const query = `
            SELECT id, title, description, duration_minutes, genre, poster_url, status, release_date, created_at, updated_at
            FROM movies
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const result = await pool.query(query, values);
        return {
            movies: result.rows.map(mapRowToMovie),
            total,
        };
    },

    async update(
        id: string,
        data: Partial<{
            title: string;
            description: string;
            durationMinutes: number;
            genre: string;
            posterUrl: string;
            status: MovieStatus;
            releaseDate: string;
        }>
    ): Promise<Movie | null> {
        const updates: string[] = [];
        const values: (string | number)[] = [];
        let paramIndex = 1;

        if (data.title !== undefined) {
            updates.push(`title = $${paramIndex}`);
            values.push(data.title);
            paramIndex++;
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex}`);
            values.push(data.description);
            paramIndex++;
        }
        if (data.durationMinutes !== undefined) {
            updates.push(`duration_minutes = $${paramIndex}`);
            values.push(data.durationMinutes);
            paramIndex++;
        }
        if (data.genre !== undefined) {
            updates.push(`genre = $${paramIndex}`);
            values.push(data.genre);
            paramIndex++;
        }
        if (data.posterUrl !== undefined) {
            updates.push(`poster_url = $${paramIndex}`);
            values.push(data.posterUrl);
            paramIndex++;
        }
        if (data.status !== undefined) {
            updates.push(`status = $${paramIndex}`);
            values.push(data.status);
            paramIndex++;
        }
        if (data.releaseDate !== undefined) {
            updates.push(`release_date = $${paramIndex}`);
            values.push(data.releaseDate);
            paramIndex++;
        }

        if (updates.length === 0) {
            return this.findById(id);
        }

        values.push(id);
        const query = `
            UPDATE movies
            SET ${updates.join(", ")}
            WHERE id = $${paramIndex}
            RETURNING id, title, description, duration_minutes, genre, poster_url, status, release_date, created_at, updated_at
        `;

        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return null;
        }
        return mapRowToMovie(result.rows[0]);
    },

    async delete(id: string): Promise<boolean> {
        const query = `DELETE FROM movies WHERE id = $1`;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    },
};

function mapRowToMovie(row: {
    id: string;
    title: string;
    description: string | null;
    duration_minutes: number;
    genre: string | null;
    poster_url: string | null;
    status: MovieStatus;
    release_date: Date | null;
    created_at: Date;
    updated_at: Date;
}): Movie {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        durationMinutes: row.duration_minutes,
        genre: row.genre,
        posterUrl: row.poster_url,
        status: row.status,
        releaseDate: row.release_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
