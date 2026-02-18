import { pool } from "@/config/database";
import type { Showtime } from "@/types/showtime";

export const showtimeRepository = {
    async create(data: {
        movieId: string;
        showDate: string;
        showTime: string;
        price: number;
    }): Promise<Showtime> {
        const query = `
            INSERT INTO showtimes (movie_id, show_date, show_time, price)
            VALUES ($1, $2, $3, $4)
            RETURNING id, movie_id, show_date, show_time, price, created_at, updated_at
        `;
        const values = [data.movieId, data.showDate, data.showTime, data.price];
        const result = await pool.query(query, values);
        return mapRowToShowtime(result.rows[0]);
    },

    async createMany(items: {
        movieId: string;
        showDate: string;
        showTime: string;
        price: number;
    }[]): Promise<Showtime[]> {
        if (items.length === 0) return [];

        const valuePlaceholders: string[] = [];
        const values: (string | number)[] = [];
        let paramIndex = 1;

        for (const item of items) {
            valuePlaceholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
            values.push(item.movieId, item.showDate, item.showTime, item.price);
            paramIndex += 4;
        }

        const query = `
            INSERT INTO showtimes (movie_id, show_date, show_time, price)
            VALUES ${valuePlaceholders.join(', ')}
            RETURNING id, movie_id, show_date, show_time, price, created_at, updated_at
        `;
        const result = await pool.query(query, values);
        return result.rows.map(mapRowToShowtime);
    },

    async findById(id: string): Promise<Showtime | null> {
        const query = `
            SELECT id, movie_id, show_date, show_time, price, created_at, updated_at
            FROM showtimes
            WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return mapRowToShowtime(result.rows[0]);
    },

    async findByIdWithMovie(id: string): Promise<{
        showtime: Showtime;
        movie: { id: string; title: string; posterUrl: string | null };
    } | null> {
        const query = `
            SELECT 
                s.id, s.movie_id, s.show_date, s.show_time, s.price, s.created_at, s.updated_at,
                m.id as m_id, m.title as m_title, m.poster_url as m_poster_url
            FROM showtimes s
            JOIN movies m ON s.movie_id = m.id
            WHERE s.id = $1
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            showtime: mapRowToShowtime(row),
            movie: {
                id: row.m_id,
                title: row.m_title,
                posterUrl: row.m_poster_url,
            },
        };
    },

    async findByMovieId(movieId: string): Promise<Showtime[]> {
        const query = `
            SELECT id, movie_id, show_date, show_time, price, created_at, updated_at
            FROM showtimes
            WHERE movie_id = $1
            ORDER BY show_date, show_time
        `;
        const result = await pool.query(query, [movieId]);
        return result.rows.map(mapRowToShowtime);
    },

    async findAll(options: {
        movieId?: string;
        date?: string;
        page: number;
        limit: number;
    }): Promise<{ showtimes: Showtime[]; total: number }> {
        const conditions: string[] = [];
        const values: (string | number)[] = [];
        let paramIndex = 1;

        if (options.movieId) {
            conditions.push(`movie_id = $${paramIndex}`);
            values.push(options.movieId);
            paramIndex++;
        }
        if (options.date) {
            conditions.push(`show_date = $${paramIndex}`);
            values.push(options.date);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countQuery = `SELECT COUNT(*) FROM showtimes ${whereClause}`;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        const offset = (options.page - 1) * options.limit;
        values.push(options.limit, offset);

        const query = `
            SELECT id, movie_id, show_date, show_time, price, created_at, updated_at
            FROM showtimes
            ${whereClause}
            ORDER BY show_date, show_time
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const result = await pool.query(query, values);
        return {
            showtimes: result.rows.map(mapRowToShowtime),
            total,
        };
    },

    async update(
        id: string,
        data: Partial<{
            movieId: string;
            showDate: string;
            showTime: string;
            price: number;
        }>
    ): Promise<Showtime | null> {
        const updates: string[] = [];
        const values: (string | number)[] = [];
        let paramIndex = 1;

        if (data.movieId !== undefined) {
            updates.push(`movie_id = $${paramIndex}`);
            values.push(data.movieId);
            paramIndex++;
        }
        if (data.showDate !== undefined) {
            updates.push(`show_date = $${paramIndex}`);
            values.push(data.showDate);
            paramIndex++;
        }
        if (data.showTime !== undefined) {
            updates.push(`show_time = $${paramIndex}`);
            values.push(data.showTime);
            paramIndex++;
        }
        if (data.price !== undefined) {
            updates.push(`price = $${paramIndex}`);
            values.push(data.price);
            paramIndex++;
        }

        if (updates.length === 0) {
            return this.findById(id);
        }

        values.push(id);
        const query = `
            UPDATE showtimes
            SET ${updates.join(", ")}
            WHERE id = $${paramIndex}
            RETURNING id, movie_id, show_date, show_time, price, created_at, updated_at
        `;

        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return null;
        }
        return mapRowToShowtime(result.rows[0]);
    },

    async delete(id: string): Promise<boolean> {
        const query = `DELETE FROM showtimes WHERE id = $1`;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    },
};

function mapRowToShowtime(row: {
    id: string;
    movie_id: string;
    show_date: Date;
    show_time: string;
    price: string | number;
    created_at: Date;
    updated_at: Date;
}): Showtime {
    return {
        id: row.id,
        movieId: row.movie_id,
        showDate: row.show_date,
        showTime: row.show_time,
        price: typeof row.price === "string" ? parseFloat(row.price) : row.price,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
