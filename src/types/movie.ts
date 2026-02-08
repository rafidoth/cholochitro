export type MovieStatus = 'now_showing' | 'coming_soon' | 'ended';

export interface Movie {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    genre: string | null;
    posterUrl: string | null;
    status: MovieStatus;
    releaseDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface MovieResponse {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    genre: string | null;
    posterUrl: string | null;
    status: MovieStatus;
    releaseDate: Date | null;
    createdAt: Date;
}
