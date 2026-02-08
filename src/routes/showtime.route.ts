import { Router } from "express";
import { validateRequest } from "@/middlewares/http_request_validator";
import {
    createShowtimeSchema,
    updateShowtimeSchema,
    showtimeIdParamSchema,
    movieShowtimesParamSchema,
    listShowtimesQuerySchema,
} from "@/types/showtime.schema";
import {
    listShowtimesHandler,
    getShowtimeHandler,
    getMovieShowtimesHandler,
    createShowtimeHandler,
    updateShowtimeHandler,
    deleteShowtimeHandler,
} from "@/controllers/showtime.controller";
import { authenticate, requireAdmin } from "@/middlewares/auth.middleware";

export const showtimeRouter: Router = Router();

// Public routes
showtimeRouter.get(
    "/",
    validateRequest({ query: listShowtimesQuerySchema.shape.query }),
    listShowtimesHandler
);

showtimeRouter.get(
    "/:id",
    validateRequest({ params: showtimeIdParamSchema.shape.params }),
    getShowtimeHandler
);

// Movie showtimes route (mounted under /movies/:movieId/showtimes)
export const movieShowtimesRouter: Router = Router({ mergeParams: true });

movieShowtimesRouter.get(
    "/",
    validateRequest({ params: movieShowtimesParamSchema.shape.params }),
    getMovieShowtimesHandler
);

// Admin routes
export const adminShowtimeRouter: Router = Router();

adminShowtimeRouter.post(
    "/",
    authenticate,
    requireAdmin,
    validateRequest({ body: createShowtimeSchema.shape.body }),
    createShowtimeHandler
);

adminShowtimeRouter.put(
    "/:id",
    authenticate,
    requireAdmin,
    validateRequest({
        params: updateShowtimeSchema.shape.params,
        body: updateShowtimeSchema.shape.body,
    }),
    updateShowtimeHandler
);

adminShowtimeRouter.delete(
    "/:id",
    authenticate,
    requireAdmin,
    validateRequest({ params: showtimeIdParamSchema.shape.params }),
    deleteShowtimeHandler
);
