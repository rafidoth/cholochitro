import { Request, Response, Router } from "express";
import { authRouter } from "@/routes/auth.route";
import { movieRouter, adminMovieRouter } from "@/routes/movie.route";
import { showtimeRouter, movieShowtimesRouter, adminShowtimeRouter } from "@/routes/showtime.route";
import { bookingRouter, seatRouter, adminBookingRouter } from "@/routes/booking.route";
import { pingDatabase } from "@/config/database"

export const registerRoutes = (app: Router) => {
    const v1_router = Router();

    // Health check
    v1_router.get("/health", healthCheck);

    // Auth routes
    v1_router.use("/auth", authRouter);

    // Movie routes
    v1_router.use("/movies", movieRouter);
    v1_router.use("/movies/:movieId/showtimes", movieShowtimesRouter);

    // Showtime routes
    v1_router.use("/showtimes", showtimeRouter);
    v1_router.use("/showtimes", seatRouter);

    // Booking routes
    v1_router.use("/bookings", bookingRouter);

    // Admin routes
    v1_router.use("/admin/movies", adminMovieRouter);
    v1_router.use("/admin/showtimes", adminShowtimeRouter);
    v1_router.use("/admin/bookings", adminBookingRouter);

    app.use("/api/v1", v1_router);
};


const healthCheck = async (req: Request, res: Response) => {
    try {
        await pingDatabase()
        res.status(200).json({
            status: "OK"
        })
    } catch (err) {
        res.status(3).json({
            status: "Faulty",
            error: (err as Error).message
        })
    }
}

