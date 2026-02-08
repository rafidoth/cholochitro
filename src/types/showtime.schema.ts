import { z } from "zod";

export const createShowtimeSchema = z.object({
    body: z.object({
        movieId: z.string().uuid("Invalid movie ID"),
        showDate: z.string().date("Invalid date format (YYYY-MM-DD)"),
        showTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
        price: z.number().positive("Price must be a positive number"),
    }),
});

export const updateShowtimeSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid showtime ID"),
    }),
    body: z.object({
        movieId: z.string().uuid("Invalid movie ID").optional(),
        showDate: z.string().date("Invalid date format (YYYY-MM-DD)").optional(),
        showTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)").optional(),
        price: z.number().positive("Price must be a positive number").optional(),
    }),
});

export const showtimeIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid showtime ID"),
    }),
});

export const movieShowtimesParamSchema = z.object({
    params: z.object({
        movieId: z.string().uuid("Invalid movie ID"),
    }),
});

export const listShowtimesQuerySchema = z.object({
    query: z.object({
        movieId: z.string().uuid("Invalid movie ID").optional(),
        date: z.string().date("Invalid date format").optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
    }),
});

export type CreateShowtimeRequest = z.infer<typeof createShowtimeSchema.shape.body>;
export type UpdateShowtimeRequest = z.infer<typeof updateShowtimeSchema.shape.body>;
export type ListShowtimesQuery = z.infer<typeof listShowtimesQuerySchema.shape.query>;
