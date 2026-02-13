// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// Movie types
export type MovieStatus = 'now_showing' | 'coming_soon' | 'ended';

export interface Movie {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  genre: string | null;
  posterUrl: string | null;
  status: MovieStatus;
  releaseDate: string | null;
  createdAt: string;
}

export interface MoviesResponse {
  success: boolean;
  data: {
    movies: Movie[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Showtime types
export interface Showtime {
  id: string;
  movieId: string;
  showDate: string;
  showTime: string;
  price: number;
  createdAt: string;
}

export interface ShowtimeWithMovie extends Showtime {
  movie?: {
    id: string;
    title: string;
    posterUrl: string | null;
  };
}

export interface ShowtimesResponse {
  success: boolean;
  data: {
    showtimes: Showtime[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SeatsResponse {
  success: boolean;
  data: {
    showtimeId: string;
    totalSeats: number;
    availableSeats: string[];
    bookedSeats: string[];
  };
}

// Booking types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  userId: string;
  showtimeId: string;
  status: BookingStatus;
  totalPrice: number;
  seats: string[];
  createdAt: string;
  showtime?: {
    id: string;
    showDate: string;
    showTime: string;
    movie?: {
      id: string;
      title: string;
      posterUrl: string | null;
    };
  };
}

export interface BookingsResponse {
  success: boolean;
  data: {
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data: Booking;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
}
