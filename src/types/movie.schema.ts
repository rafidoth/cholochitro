import { z } from "zod";

export const createMovieSchema = z.object({
    body: z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        durationMinutes: z.number().int().positive("Duration must be a positive number"),
        genre: z.string().optional(),
        posterUrl: z.url("Invalid URL").optional(),
        status: z.enum(["now_showing", "coming_soon", "ended"]).default("coming_soon"),
        releaseDate: z.iso.datetime("Invalid date format").optional(),
    }),
});

export const updateMovieSchema = z.object({
    params: z.object({
        id: z.uuid("Invalid movie ID"),
    }),
    body: z.object({
        title: z.string().min(1, "Title is required").optional(),
        description: z.string().optional(),
        durationMinutes: z.number().int().positive("Duration must be a positive number").optional(),
        genre: z.string().optional(),
        posterUrl: z.url("Invalid URL").optional(),
        status: z.enum(["now_showing", "coming_soon", "ended"]).optional(),
        releaseDate: z.iso.datetime("Invalid date format").optional(),
    }),
});

export const movieIdParamSchema = z.object({
    params: z.object({
        id: z.uuid("Invalid movie ID"),
    }),
});

export const listMoviesQuerySchema = z.object({
    query: z.object({
        status: z.enum(["now_showing", "coming_soon", "ended"]).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
    }),
});

export type CreateMovieRequest = z.infer<typeof createMovieSchema.shape.body>;
export type UpdateMovieRequest = z.infer<typeof updateMovieSchema.shape.body>;
export type ListMoviesQuery = z.infer<typeof listMoviesQuerySchema.shape.query>;
