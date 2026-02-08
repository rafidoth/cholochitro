import { pool } from "@/config/database";
import type { Booking, BookingSeat, BookingStatus, BookingWithDetails } from "@/types/booking";

export const bookingRepository = {
    async create(data: {
        userId: string;
        showtimeId: string;
        totalPrice: number;
        seats: string[];
    }): Promise<Booking & { seats: string[] }> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Create booking
            const bookingQuery = `
                INSERT INTO bookings (user_id, showtime_id, total_price, status)
                VALUES ($1, $2, $3, 'pending')
                RETURNING id, user_id, showtime_id, status, total_price, created_at, updated_at
            `;
            const bookingResult = await client.query(bookingQuery, [
                data.userId,
                data.showtimeId,
                data.totalPrice,
            ]);
            const booking = mapRowToBooking(bookingResult.rows[0]);

            // Create booking seats
            for (const seat of data.seats) {
                const seatQuery = `
                    INSERT INTO booking_seats (booking_id, showtime_id, seat_number)
                    VALUES ($1, $2, $3)
                `;
                await client.query(seatQuery, [booking.id, data.showtimeId, seat]);
            }

            await client.query("COMMIT");

            return {
                ...booking,
                seats: data.seats,
            };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    },

    async findById(id: string): Promise<(Booking & { seats: string[] }) | null> {
        const bookingQuery = `
            SELECT id, user_id, showtime_id, status, total_price, created_at, updated_at
            FROM bookings
            WHERE id = $1
        `;
        const bookingResult = await pool.query(bookingQuery, [id]);
        if (bookingResult.rows.length === 0) {
            return null;
        }

        const seatsQuery = `
            SELECT seat_number FROM booking_seats WHERE booking_id = $1
        `;
        const seatsResult = await pool.query(seatsQuery, [id]);

        return {
            ...mapRowToBooking(bookingResult.rows[0]),
            seats: seatsResult.rows.map((r) => r.seat_number),
        };
    },

    async findByIdWithDetails(id: string): Promise<BookingWithDetails | null> {
        const query = `
            SELECT 
                b.id, b.user_id, b.showtime_id, b.status, b.total_price, b.created_at, b.updated_at,
                s.show_date, s.show_time,
                m.id as movie_id, m.title as movie_title, m.poster_url as movie_poster_url
            FROM bookings b
            JOIN showtimes s ON b.showtime_id = s.id
            JOIN movies m ON s.movie_id = m.id
            WHERE b.id = $1
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }

        const seatsQuery = `SELECT seat_number FROM booking_seats WHERE booking_id = $1`;
        const seatsResult = await pool.query(seatsQuery, [id]);

        const row = result.rows[0];
        return {
            id: row.id,
            userId: row.user_id,
            showtimeId: row.showtime_id,
            status: row.status,
            totalPrice: parseFloat(row.total_price),
            seats: seatsResult.rows.map((r) => r.seat_number),
            createdAt: row.created_at,
            showtime: {
                id: row.showtime_id,
                showDate: row.show_date,
                showTime: row.show_time,
                movie: {
                    id: row.movie_id,
                    title: row.movie_title,
                    posterUrl: row.movie_poster_url,
                },
            },
        };
    },

    async findByUserId(
        userId: string,
        options: { status?: BookingStatus; page: number; limit: number }
    ): Promise<{ bookings: BookingWithDetails[]; total: number }> {
        const conditions = ["b.user_id = $1"];
        const values: (string | number)[] = [userId];
        let paramIndex = 2;

        if (options.status) {
            conditions.push(`b.status = $${paramIndex}`);
            values.push(options.status);
            paramIndex++;
        }

        const whereClause = `WHERE ${conditions.join(" AND ")}`;

        const countQuery = `SELECT COUNT(*) FROM bookings b ${whereClause}`;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        const offset = (options.page - 1) * options.limit;
        values.push(options.limit, offset);

        const query = `
            SELECT 
                b.id, b.user_id, b.showtime_id, b.status, b.total_price, b.created_at, b.updated_at,
                s.show_date, s.show_time,
                m.id as movie_id, m.title as movie_title, m.poster_url as movie_poster_url
            FROM bookings b
            JOIN showtimes s ON b.showtime_id = s.id
            JOIN movies m ON s.movie_id = m.id
            ${whereClause}
            ORDER BY b.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const result = await pool.query(query, values);

        // Fetch seats for each booking
        const bookings: BookingWithDetails[] = [];
        for (const row of result.rows) {
            const seatsQuery = `SELECT seat_number FROM booking_seats WHERE booking_id = $1`;
            const seatsResult = await pool.query(seatsQuery, [row.id]);

            bookings.push({
                id: row.id,
                userId: row.user_id,
                showtimeId: row.showtime_id,
                status: row.status,
                totalPrice: parseFloat(row.total_price),
                seats: seatsResult.rows.map((r) => r.seat_number),
                createdAt: row.created_at,
                showtime: {
                    id: row.showtime_id,
                    showDate: row.show_date,
                    showTime: row.show_time,
                    movie: {
                        id: row.movie_id,
                        title: row.movie_title,
                        posterUrl: row.movie_poster_url,
                    },
                },
            });
        }

        return { bookings, total };
    },

    async findAll(options: {
        status?: BookingStatus;
        page: number;
        limit: number;
    }): Promise<{ bookings: BookingWithDetails[]; total: number }> {
        const conditions: string[] = [];
        const values: (string | number)[] = [];
        let paramIndex = 1;

        if (options.status) {
            conditions.push(`b.status = $${paramIndex}`);
            values.push(options.status);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countQuery = `SELECT COUNT(*) FROM bookings b ${whereClause}`;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        const offset = (options.page - 1) * options.limit;
        values.push(options.limit, offset);

        const query = `
            SELECT 
                b.id, b.user_id, b.showtime_id, b.status, b.total_price, b.created_at, b.updated_at,
                s.show_date, s.show_time,
                m.id as movie_id, m.title as movie_title, m.poster_url as movie_poster_url
            FROM bookings b
            JOIN showtimes s ON b.showtime_id = s.id
            JOIN movies m ON s.movie_id = m.id
            ${whereClause}
            ORDER BY b.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const result = await pool.query(query, values);

        const bookings: BookingWithDetails[] = [];
        for (const row of result.rows) {
            const seatsQuery = `SELECT seat_number FROM booking_seats WHERE booking_id = $1`;
            const seatsResult = await pool.query(seatsQuery, [row.id]);

            bookings.push({
                id: row.id,
                userId: row.user_id,
                showtimeId: row.showtime_id,
                status: row.status,
                totalPrice: parseFloat(row.total_price),
                seats: seatsResult.rows.map((r) => r.seat_number),
                createdAt: row.created_at,
                showtime: {
                    id: row.showtime_id,
                    showDate: row.show_date,
                    showTime: row.show_time,
                    movie: {
                        id: row.movie_id,
                        title: row.movie_title,
                        posterUrl: row.movie_poster_url,
                    },
                },
            });
        }

        return { bookings, total };
    },

    async updateStatus(id: string, status: BookingStatus): Promise<Booking | null> {
        const query = `
            UPDATE bookings
            SET status = $1
            WHERE id = $2
            RETURNING id, user_id, showtime_id, status, total_price, created_at, updated_at
        `;
        const result = await pool.query(query, [status, id]);
        if (result.rows.length === 0) {
            return null;
        }
        return mapRowToBooking(result.rows[0]);
    },

    async delete(id: string): Promise<boolean> {
        const query = `DELETE FROM bookings WHERE id = $1`;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    },

    async getBookedSeats(showtimeId: string): Promise<string[]> {
        const query = `
            SELECT bs.seat_number
            FROM booking_seats bs
            JOIN bookings b ON bs.booking_id = b.id
            WHERE bs.showtime_id = $1 AND b.status != 'cancelled'
        `;
        const result = await pool.query(query, [showtimeId]);
        return result.rows.map((r) => r.seat_number);
    },

    async areSeatsTaken(showtimeId: string, seats: string[]): Promise<string[]> {
        const query = `
            SELECT bs.seat_number
            FROM booking_seats bs
            JOIN bookings b ON bs.booking_id = b.id
            WHERE bs.showtime_id = $1 AND bs.seat_number = ANY($2) AND b.status != 'cancelled'
        `;
        const result = await pool.query(query, [showtimeId, seats]);
        return result.rows.map((r) => r.seat_number);
    },
};

function mapRowToBooking(row: {
    id: string;
    user_id: string;
    showtime_id: string;
    status: BookingStatus;
    total_price: string | number;
    created_at: Date;
    updated_at: Date;
}): Booking {
    return {
        id: row.id,
        userId: row.user_id,
        showtimeId: row.showtime_id,
        status: row.status,
        totalPrice: typeof row.total_price === "string" ? parseFloat(row.total_price) : row.total_price,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
