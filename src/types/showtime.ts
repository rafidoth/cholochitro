import type { Movie } from "./movie";

export interface Showtime {
    id: string;
    movieId: string;
    showDate: Date;
    showTime: string;
    price: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ShowtimeResponse {
    id: string;
    movieId: string;
    showDate: Date;
    showTime: string;
    price: number;
    createdAt: Date;
}

export interface ShowtimeWithMovie extends ShowtimeResponse {
    movie: Movie;
}
