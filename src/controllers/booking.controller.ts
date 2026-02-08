import { bookingService, BookingServiceError } from "@/services/booking.service";
import { logger } from "@/utils/logger";
import { Request, Response } from "express";

export const createBookingHandler = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
                code: "AUTH_REQUIRED",
            });
            return;
        }

        const booking = await bookingService.create(req.user.userId, req.body);

        logger.info({ bookingId: booking.id, userId: req.user.userId }, "Booking created successfully");

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking,
        });
    } catch (error) {
        if (error instanceof BookingServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Create booking failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error creating booking");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const listUserBookingsHandler = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
                code: "AUTH_REQUIRED",
            });
            return;
        }

        const { status, page = 1, limit = 10 } = req.query;

        const result = await bookingService.listByUser(req.user.userId, {
            status: status as "pending" | "confirmed" | "cancelled" | undefined,
            page: Number(page),
            limit: Number(limit),
        });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        logger.error({ error }, "Unexpected error listing bookings");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const getBookingHandler = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
                code: "AUTH_REQUIRED",
            });
            return;
        }

        const id = req.params.id as string;
        const booking = await bookingService.getById(id, req.user.userId);

        res.status(200).json({
            success: true,
            data: booking,
        });
    } catch (error) {
        if (error instanceof BookingServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Get booking failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error getting booking");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const cancelBookingHandler = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
                code: "AUTH_REQUIRED",
            });
            return;
        }

        const id = req.params.id as string;
        const booking = await bookingService.cancel(id, req.user.userId);

        logger.info({ bookingId: id, userId: req.user.userId }, "Booking cancelled successfully");

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            data: booking,
        });
    } catch (error) {
        if (error instanceof BookingServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Cancel booking failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error cancelling booking");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const confirmBookingHandler = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
                code: "AUTH_REQUIRED",
            });
            return;
        }

        const id = req.params.id as string;
        const booking = await bookingService.confirm(id, req.user.userId);

        logger.info({ bookingId: id, userId: req.user.userId }, "Booking confirmed successfully");

        res.status(200).json({
            success: true,
            message: "Booking confirmed successfully (mock payment)",
            data: booking,
        });
    } catch (error) {
        if (error instanceof BookingServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Confirm booking failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error confirming booking");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const getSeatAvailabilityHandler = async (req: Request, res: Response) => {
    try {
        const showtimeId = req.params.showtimeId as string;
        const availability = await bookingService.getSeatAvailability(showtimeId);

        res.status(200).json({
            success: true,
            data: availability,
        });
    } catch (error) {
        if (error instanceof BookingServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Get seat availability failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error getting seat availability");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

// Admin handlers
export const listAllBookingsHandler = async (req: Request, res: Response) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const result = await bookingService.listAll({
            status: status as "pending" | "confirmed" | "cancelled" | undefined,
            page: Number(page),
            limit: Number(limit),
        });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        logger.error({ error }, "Unexpected error listing all bookings");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const updateBookingStatusHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;

        const booking = await bookingService.updateStatus(id, status);

        logger.info({ bookingId: id, status }, "Booking status updated by admin");

        res.status(200).json({
            success: true,
            message: "Booking status updated successfully",
            data: booking,
        });
    } catch (error) {
        if (error instanceof BookingServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Update booking status failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error updating booking status");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};
