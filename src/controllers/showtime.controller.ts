import { showtimeService, ShowtimeServiceError } from "@/services/showtime.service";
import { logger } from "@/utils/logger";
import { Request, Response } from "express";

export const listShowtimesHandler = async (req: Request, res: Response) => {
    try {
        const { movieId, date, page = 1, limit = 10 } = req.query;

        const result = await showtimeService.list({
            movieId: movieId as string | undefined,
            date: date as string | undefined,
            page: Number(page),
            limit: Number(limit),
        });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        logger.error({ error }, "Unexpected error listing showtimes");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const getShowtimeHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const showtime = await showtimeService.getById(id);

        res.status(200).json({
            success: true,
            data: showtime,
        });
    } catch (error) {
        if (error instanceof ShowtimeServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Get showtime failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error getting showtime");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const getMovieShowtimesHandler = async (req: Request, res: Response) => {
    try {
        const movieId = req.params.movieId as string;
        const showtimes = await showtimeService.getByMovieId(movieId);

        res.status(200).json({
            success: true,
            data: showtimes,
        });
    } catch (error) {
        if (error instanceof ShowtimeServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Get movie showtimes failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error getting movie showtimes");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const createShowtimeHandler = async (req: Request, res: Response) => {
    try {
        const showtime = await showtimeService.create(req.body);

        logger.info({ showtimeId: showtime.id }, "Showtime created successfully");

        res.status(201).json({
            success: true,
            message: "Showtime created successfully",
            data: showtime,
        });
    } catch (error) {
        if (error instanceof ShowtimeServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Create showtime failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error creating showtime");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const updateShowtimeHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const showtime = await showtimeService.update(id, req.body);

        logger.info({ showtimeId: showtime.id }, "Showtime updated successfully");

        res.status(200).json({
            success: true,
            message: "Showtime updated successfully",
            data: showtime,
        });
    } catch (error) {
        if (error instanceof ShowtimeServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Update showtime failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error updating showtime");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const deleteShowtimeHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await showtimeService.delete(id);

        logger.info({ showtimeId: id }, "Showtime deleted successfully");

        res.status(200).json({
            success: true,
            message: "Showtime deleted successfully",
        });
    } catch (error) {
        if (error instanceof ShowtimeServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Delete showtime failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error deleting showtime");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};
