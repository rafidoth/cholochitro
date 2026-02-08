import { bookingRepository } from "@/data/booking.data";
import { showtimeRepository } from "@/data/showtime.data";
import type { CreateBookingRequest, ListBookingsQuery } from "@/types/booking.schema";
import type { BookingResponse, BookingStatus, BookingWithDetails } from "@/types/booking";
import { generateAllSeats } from "@/types/booking";

export class BookingServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = "BookingServiceError";
    }
}

export const bookingService = {
    async create(userId: string, data: CreateBookingRequest): Promise<BookingResponse> {
        // Verify showtime exists and get price
        const showtime = await showtimeRepository.findById(data.showtimeId);
        if (!showtime) {
            throw new BookingServiceError("Showtime not found", "SHOWTIME_NOT_FOUND", 404);
        }

        // Check if any of the selected seats are already taken
        const takenSeats = await bookingRepository.areSeatsTaken(data.showtimeId, data.seats);
        if (takenSeats.length > 0) {
            throw new BookingServiceError(
                `Seats already taken: ${takenSeats.join(", ")}`,
                "SEATS_TAKEN",
                409
            );
        }

        // Calculate total price
        const totalPrice = showtime.price * data.seats.length;

        // Create booking
        const booking = await bookingRepository.create({
            userId,
            showtimeId: data.showtimeId,
            totalPrice,
            seats: data.seats,
        });

        return {
            id: booking.id,
            userId: booking.userId,
            showtimeId: booking.showtimeId,
            status: booking.status,
            totalPrice: booking.totalPrice,
            seats: booking.seats,
            createdAt: booking.createdAt,
        };
    },

    async getById(id: string, userId?: string): Promise<BookingWithDetails> {
        const booking = await bookingRepository.findByIdWithDetails(id);
        if (!booking) {
            throw new BookingServiceError("Booking not found", "BOOKING_NOT_FOUND", 404);
        }

        // If userId provided, verify ownership
        if (userId && booking.userId !== userId) {
            throw new BookingServiceError("Booking not found", "BOOKING_NOT_FOUND", 404);
        }

        return booking;
    },

    async listByUser(
        userId: string,
        query: ListBookingsQuery
    ): Promise<{
        bookings: BookingWithDetails[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { bookings, total } = await bookingRepository.findByUserId(userId, {
            status: query.status,
            page: query.page,
            limit: query.limit,
        });

        return {
            bookings,
            total,
            page: query.page,
            limit: query.limit,
            totalPages: Math.ceil(total / query.limit),
        };
    },

    async listAll(query: ListBookingsQuery): Promise<{
        bookings: BookingWithDetails[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { bookings, total } = await bookingRepository.findAll({
            status: query.status,
            page: query.page,
            limit: query.limit,
        });

        return {
            bookings,
            total,
            page: query.page,
            limit: query.limit,
            totalPages: Math.ceil(total / query.limit),
        };
    },

    async cancel(id: string, userId?: string): Promise<BookingResponse> {
        const booking = await bookingRepository.findById(id);
        if (!booking) {
            throw new BookingServiceError("Booking not found", "BOOKING_NOT_FOUND", 404);
        }

        // If userId provided, verify ownership
        if (userId && booking.userId !== userId) {
            throw new BookingServiceError("Booking not found", "BOOKING_NOT_FOUND", 404);
        }

        if (booking.status === "cancelled") {
            throw new BookingServiceError("Booking already cancelled", "ALREADY_CANCELLED", 400);
        }

        const updated = await bookingRepository.updateStatus(id, "cancelled");
        if (!updated) {
            throw new BookingServiceError("Failed to cancel booking", "UPDATE_FAILED", 500);
        }

        return {
            id: updated.id,
            userId: updated.userId,
            showtimeId: updated.showtimeId,
            status: updated.status,
            totalPrice: updated.totalPrice,
            seats: booking.seats,
            createdAt: updated.createdAt,
        };
    },

    async confirm(id: string, userId?: string): Promise<BookingResponse> {
        const booking = await bookingRepository.findById(id);
        if (!booking) {
            throw new BookingServiceError("Booking not found", "BOOKING_NOT_FOUND", 404);
        }

        // If userId provided, verify ownership
        if (userId && booking.userId !== userId) {
            throw new BookingServiceError("Booking not found", "BOOKING_NOT_FOUND", 404);
        }

        if (booking.status === "cancelled") {
            throw new BookingServiceError("Cannot confirm cancelled booking", "BOOKING_CANCELLED", 400);
        }

        if (booking.status === "confirmed") {
            throw new BookingServiceError("Booking already confirmed", "ALREADY_CONFIRMED", 400);
        }

        // Mock payment - in production, this would integrate with a payment gateway
        const updated = await bookingRepository.updateStatus(id, "confirmed");
        if (!updated) {
            throw new BookingServiceError("Failed to confirm booking", "UPDATE_FAILED", 500);
        }

        return {
            id: updated.id,
            userId: updated.userId,
            showtimeId: updated.showtimeId,
            status: updated.status,
            totalPrice: updated.totalPrice,
            seats: booking.seats,
            createdAt: updated.createdAt,
        };
    },

    async updateStatus(id: string, status: BookingStatus): Promise<BookingResponse> {
        const booking = await bookingRepository.findById(id);
        if (!booking) {
            throw new BookingServiceError("Booking not found", "BOOKING_NOT_FOUND", 404);
        }

        const updated = await bookingRepository.updateStatus(id, status);
        if (!updated) {
            throw new BookingServiceError("Failed to update booking", "UPDATE_FAILED", 500);
        }

        return {
            id: updated.id,
            userId: updated.userId,
            showtimeId: updated.showtimeId,
            status: updated.status,
            totalPrice: updated.totalPrice,
            seats: booking.seats,
            createdAt: updated.createdAt,
        };
    },

    async getSeatAvailability(showtimeId: string): Promise<{
        showtimeId: string;
        totalSeats: number;
        availableSeats: string[];
        bookedSeats: string[];
    }> {
        // Verify showtime exists
        const showtime = await showtimeRepository.findById(showtimeId);
        if (!showtime) {
            throw new BookingServiceError("Showtime not found", "SHOWTIME_NOT_FOUND", 404);
        }

        const allSeats = generateAllSeats();
        const bookedSeats = await bookingRepository.getBookedSeats(showtimeId);
        const availableSeats = allSeats.filter((seat) => !bookedSeats.includes(seat));

        return {
            showtimeId,
            totalSeats: allSeats.length,
            availableSeats,
            bookedSeats,
        };
    },
};
