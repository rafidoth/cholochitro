import { showtimeRepository } from "@/data/showtime.data";
import { movieRepository } from "@/data/movie.data";
import type { CreateShowtimeRequest, UpdateShowtimeRequest, ListShowtimesQuery } from "@/types/showtime.schema";
import type { Showtime, ShowtimeResponse } from "@/types/showtime";

export class ShowtimeServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = "ShowtimeServiceError";
    }
}

function toShowtimeResponse(showtime: Showtime): ShowtimeResponse {
    return {
        id: showtime.id,
        movieId: showtime.movieId,
        showDate: showtime.showDate,
        showTime: showtime.showTime,
        price: showtime.price,
        createdAt: showtime.createdAt,
    };
}

export const showtimeService = {
    async create(data: CreateShowtimeRequest): Promise<ShowtimeResponse> {
        // Verify movie exists
        const movie = await movieRepository.findById(data.movieId);
        if (!movie) {
            throw new ShowtimeServiceError("Movie not found", "MOVIE_NOT_FOUND", 404);
        }

        const showtime = await showtimeRepository.create({
            movieId: data.movieId,
            showDate: data.showDate,
            showTime: data.showTime,
            price: data.price,
        });

        return toShowtimeResponse(showtime);
    },

    async getById(id: string): Promise<ShowtimeResponse> {
        const showtime = await showtimeRepository.findById(id);
        if (!showtime) {
            throw new ShowtimeServiceError("Showtime not found", "SHOWTIME_NOT_FOUND", 404);
        }
        return toShowtimeResponse(showtime);
    },

    async getByMovieId(movieId: string): Promise<ShowtimeResponse[]> {
        // Verify movie exists
        const movie = await movieRepository.findById(movieId);
        if (!movie) {
            throw new ShowtimeServiceError("Movie not found", "MOVIE_NOT_FOUND", 404);
        }

        const showtimes = await showtimeRepository.findByMovieId(movieId);
        return showtimes.map(toShowtimeResponse);
    },

    async list(query: ListShowtimesQuery): Promise<{
        showtimes: ShowtimeResponse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { showtimes, total } = await showtimeRepository.findAll({
            movieId: query.movieId,
            date: query.date,
            page: query.page,
            limit: query.limit,
        });

        return {
            showtimes: showtimes.map(toShowtimeResponse),
            total,
            page: query.page,
            limit: query.limit,
            totalPages: Math.ceil(total / query.limit),
        };
    },

    async update(id: string, data: UpdateShowtimeRequest): Promise<ShowtimeResponse> {
        // If updating movieId, verify movie exists
        if (data.movieId) {
            const movie = await movieRepository.findById(data.movieId);
            if (!movie) {
                throw new ShowtimeServiceError("Movie not found", "MOVIE_NOT_FOUND", 404);
            }
        }

        const showtime = await showtimeRepository.update(id, {
            movieId: data.movieId,
            showDate: data.showDate,
            showTime: data.showTime,
            price: data.price,
        });

        if (!showtime) {
            throw new ShowtimeServiceError("Showtime not found", "SHOWTIME_NOT_FOUND", 404);
        }

        return toShowtimeResponse(showtime);
    },

    async delete(id: string): Promise<void> {
        const deleted = await showtimeRepository.delete(id);
        if (!deleted) {
            throw new ShowtimeServiceError("Showtime not found", "SHOWTIME_NOT_FOUND", 404);
        }
    },
};
