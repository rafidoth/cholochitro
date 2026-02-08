import { movieRepository } from "@/data/movie.data";
import type { CreateMovieRequest, UpdateMovieRequest, ListMoviesQuery } from "@/types/movie.schema";
import type { Movie, MovieResponse } from "@/types/movie";

export class MovieServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = "MovieServiceError";
    }
}

function toMovieResponse(movie: Movie): MovieResponse {
    return {
        id: movie.id,
        title: movie.title,
        description: movie.description,
        durationMinutes: movie.durationMinutes,
        genre: movie.genre,
        posterUrl: movie.posterUrl,
        status: movie.status,
        releaseDate: movie.releaseDate,
        createdAt: movie.createdAt,
    };
}

export const movieService = {
    async create(data: CreateMovieRequest): Promise<MovieResponse> {
        const movie = await movieRepository.create({
            title: data.title,
            description: data.description,
            durationMinutes: data.durationMinutes,
            genre: data.genre,
            posterUrl: data.posterUrl,
            status: data.status,
            releaseDate: data.releaseDate,
        });
        return toMovieResponse(movie);
    },

    async getById(id: string): Promise<MovieResponse> {
        const movie = await movieRepository.findById(id);
        if (!movie) {
            throw new MovieServiceError("Movie not found", "MOVIE_NOT_FOUND", 404);
        }
        return toMovieResponse(movie);
    },

    async list(query: ListMoviesQuery): Promise<{
        movies: MovieResponse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { movies, total } = await movieRepository.findAll({
            status: query.status,
            page: query.page,
            limit: query.limit,
        });

        return {
            movies: movies.map(toMovieResponse),
            total,
            page: query.page,
            limit: query.limit,
            totalPages: Math.ceil(total / query.limit),
        };
    },

    async update(id: string, data: UpdateMovieRequest): Promise<MovieResponse> {
        const movie = await movieRepository.update(id, {
            title: data.title,
            description: data.description,
            durationMinutes: data.durationMinutes,
            genre: data.genre,
            posterUrl: data.posterUrl,
            status: data.status,
            releaseDate: data.releaseDate,
        });

        if (!movie) {
            throw new MovieServiceError("Movie not found", "MOVIE_NOT_FOUND", 404);
        }

        return toMovieResponse(movie);
    },

    async delete(id: string): Promise<void> {
        const deleted = await movieRepository.delete(id);
        if (!deleted) {
            throw new MovieServiceError("Movie not found", "MOVIE_NOT_FOUND", 404);
        }
    },
};
