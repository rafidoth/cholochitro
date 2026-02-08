import { Router } from "express";
import { validateRequest } from "@/middlewares/http_request_validator";
import {
    createBookingSchema,
    bookingIdParamSchema,
    showtimeSeatsParamSchema,
    listBookingsQuerySchema,
    updateBookingStatusSchema,
} from "@/types/booking.schema";
import {
    createBookingHandler,
    listUserBookingsHandler,
    getBookingHandler,
    cancelBookingHandler,
    confirmBookingHandler,
    getSeatAvailabilityHandler,
    listAllBookingsHandler,
    updateBookingStatusHandler,
} from "@/controllers/booking.controller";
import { authenticate, requireAdmin } from "@/middlewares/auth.middleware";

export const bookingRouter: Router = Router();

// All booking routes require authentication
bookingRouter.use(authenticate);

bookingRouter.post(
    "/",
    validateRequest({ body: createBookingSchema.shape.body }),
    createBookingHandler
);

bookingRouter.get(
    "/",
    validateRequest({ query: listBookingsQuerySchema.shape.query }),
    listUserBookingsHandler
);

bookingRouter.get(
    "/:id",
    validateRequest({ params: bookingIdParamSchema.shape.params }),
    getBookingHandler
);

bookingRouter.delete(
    "/:id",
    validateRequest({ params: bookingIdParamSchema.shape.params }),
    cancelBookingHandler
);

bookingRouter.post(
    "/:id/confirm",
    validateRequest({ params: bookingIdParamSchema.shape.params }),
    confirmBookingHandler
);

// Seat availability route (public)
export const seatRouter: Router = Router();

seatRouter.get(
    "/:showtimeId/seats",
    validateRequest({ params: showtimeSeatsParamSchema.shape.params }),
    getSeatAvailabilityHandler
);

// Admin routes
export const adminBookingRouter: Router = Router();

adminBookingRouter.get(
    "/",
    authenticate,
    requireAdmin,
    validateRequest({ query: listBookingsQuerySchema.shape.query }),
    listAllBookingsHandler
);

adminBookingRouter.put(
    "/:id/status",
    authenticate,
    requireAdmin,
    validateRequest({
        params: updateBookingStatusSchema.shape.params,
        body: updateBookingStatusSchema.shape.body,
    }),
    updateBookingStatusHandler
);
