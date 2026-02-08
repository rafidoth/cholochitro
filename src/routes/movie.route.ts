import { Router } from "express";
import { validateRequest } from "@/middlewares/http_request_validator";
import {
    createMovieSchema,
    updateMovieSchema,
    movieIdParamSchema,
    listMoviesQuerySchema,
} from "@/types/movie.schema";
import {
    listMoviesHandler,
    getMovieHandler,
    createMovieHandler,
    updateMovieHandler,
    deleteMovieHandler,
} from "@/controllers/movie.controller";
import { authenticate, requireAdmin } from "@/middlewares/auth.middleware";

export const movieRouter: Router = Router();

// Public routes
movieRouter.get(
    "/",
    validateRequest({ query: listMoviesQuerySchema.shape.query }),
    listMoviesHandler
);

movieRouter.get(
    "/:id",
    validateRequest({ params: movieIdParamSchema.shape.params }),
    getMovieHandler
);

// Admin routes
export const adminMovieRouter: Router = Router();

adminMovieRouter.post(
    "/",
    authenticate,
    requireAdmin,
    validateRequest({ body: createMovieSchema.shape.body }),
    createMovieHandler
);

adminMovieRouter.put(
    "/:id",
    authenticate,
    requireAdmin,
    validateRequest({
        params: updateMovieSchema.shape.params,
        body: updateMovieSchema.shape.body,
    }),
    updateMovieHandler
);

adminMovieRouter.delete(
    "/:id",
    authenticate,
    requireAdmin,
    validateRequest({ params: movieIdParamSchema.shape.params }),
    deleteMovieHandler
);
