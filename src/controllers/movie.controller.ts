import { movieService, MovieServiceError } from "@/services/movie.service";
import { logger } from "@/utils/logger";
import { Request, Response } from "express";

export const listMoviesHandler = async (req: Request, res: Response) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const result = await movieService.list({
            status: status as "now_showing" | "coming_soon" | "ended" | undefined,
            page: Number(page),
            limit: Number(limit),
        });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        logger.error({ error }, "Unexpected error listing movies");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const getMovieHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const movie = await movieService.getById(id);

        res.status(200).json({
            success: true,
            data: movie,
        });
    } catch (error) {
        if (error instanceof MovieServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Get movie failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error getting movie");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const createMovieHandler = async (req: Request, res: Response) => {
    try {
        const movie = await movieService.create(req.body);

        logger.info({ movieId: movie.id }, "Movie created successfully");

        res.status(201).json({
            success: true,
            message: "Movie created successfully",
            data: movie,
        });
    } catch (error) {
        if (error instanceof MovieServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Create movie failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error creating movie");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const updateMovieHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const movie = await movieService.update(id, req.body);

        logger.info({ movieId: movie.id }, "Movie updated successfully");

        res.status(200).json({
            success: true,
            message: "Movie updated successfully",
            data: movie,
        });
    } catch (error) {
        if (error instanceof MovieServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Update movie failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error updating movie");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const deleteMovieHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await movieService.delete(id);

        logger.info({ movieId: id }, "Movie deleted successfully");

        res.status(200).json({
            success: true,
            message: "Movie deleted successfully",
        });
    } catch (error) {
        if (error instanceof MovieServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Delete movie failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error deleting movie");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};
