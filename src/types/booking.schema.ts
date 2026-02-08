import { z } from "zod";
import { isValidSeat } from "./booking";

const seatValidator = z.string().refine(isValidSeat, {
    message: "Invalid seat format. Use format like A1, B5, J10 (rows A-J, columns 1-10)",
});

export const createBookingSchema = z.object({
    body: z.object({
        showtimeId: z.string().uuid("Invalid showtime ID"),
        seats: z.array(seatValidator).min(1, "At least one seat is required").max(10, "Maximum 10 seats per booking"),
    }),
});

export const bookingIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid booking ID"),
    }),
});

export const showtimeSeatsParamSchema = z.object({
    params: z.object({
        showtimeId: z.string().uuid("Invalid showtime ID"),
    }),
});

export const listBookingsQuerySchema = z.object({
    query: z.object({
        status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
    }),
});

export const updateBookingStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid booking ID"),
    }),
    body: z.object({
        status: z.enum(["pending", "confirmed", "cancelled"]),
    }),
});

export type CreateBookingRequest = z.infer<typeof createBookingSchema.shape.body>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema.shape.query>;
export type UpdateBookingStatusRequest = z.infer<typeof updateBookingStatusSchema.shape.body>;
