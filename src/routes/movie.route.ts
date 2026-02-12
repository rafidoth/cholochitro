import { Router } from "express";
import { validateRequest } from "@/middlewares/http_request_validator";
import {
    movieIdParamSchema,
    listMoviesQuerySchema,
} from "@/types/movie.schema";
import {
    listMoviesHandler,
    getMovieHandler,
} from "@/controllers/movie.controller";

export const movieRouter: Router = Router();

// Public routes no auth needed
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

