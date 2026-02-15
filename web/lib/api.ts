import type {
    AuthResponse,
    User,
    Movie,
    MoviesResponse,
    Showtime,
    ShowtimesResponse,
    SeatsResponse,
    Booking,
    BookingsResponse,
    BookingResponse,
    ApiResponse,
    ShowtimesResponseForMovie,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem('token', token);
            } else {
                localStorage.removeItem('token');
            }
        }
    }

    getToken(): string | null {
        if (this.token) return this.token;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('token');
        }
        return this.token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = this.getToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'An error occurred');
        }

        return data;
    }

    // Auth endpoints
    async register(email: string, password: string, displayName: string): Promise<AuthResponse> {
        const response = await this.request<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, displayName }),
        });
        if (response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await this.request<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async logout(): Promise<void> {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.setToken(null);
        }
    }

    async getMe(): Promise<ApiResponse<User>> {
        return this.request<ApiResponse<User>>('/auth/me');
    }

    // Movies endpoints
    async getMovies(params?: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<MoviesResponse> {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set('status', params.status);
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());

        const queryString = searchParams.toString();
        return this.request<MoviesResponse>(`/movies${queryString ? `?${queryString}` : ''}`);
    }

    async getMovie(id: string): Promise<ApiResponse<Movie>> {
        return this.request<ApiResponse<Movie>>(`/movies/${id}`);
    }

    async getMovieShowtimes(movieId: string): Promise<ShowtimesResponseForMovie> {
        return this.request<ShowtimesResponseForMovie>(`/movies/${movieId}/showtimes`);
    }

    // Showtimes endpoints
    async getShowtimes(params?: {
        movieId?: string;
        date?: string;
        page?: number;
        limit?: number;
    }): Promise<ShowtimesResponse> {
        const searchParams = new URLSearchParams();
        if (params?.movieId) searchParams.set('movieId', params.movieId);
        if (params?.date) searchParams.set('date', params.date);
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());

        const queryString = searchParams.toString();
        return this.request<ShowtimesResponse>(`/showtimes${queryString ? `?${queryString}` : ''}`);
    }

    async getShowtime(id: string): Promise<ApiResponse<Showtime>> {
        return this.request<ApiResponse<Showtime>>(`/showtimes/${id}`);
    }

    async getShowtimeSeats(showtimeId: string): Promise<SeatsResponse> {
        return this.request<SeatsResponse>(`/showtimes/${showtimeId}/seats`);
    }

    // Bookings endpoints
    async createBooking(showtimeId: string, seats: string[]): Promise<BookingResponse> {
        return this.request<BookingResponse>('/bookings', {
            method: 'POST',
            body: JSON.stringify({ showtimeId, seats }),
        });
    }

    async getBookings(params?: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<BookingsResponse> {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set('status', params.status);
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());

        const queryString = searchParams.toString();
        return this.request<BookingsResponse>(`/bookings${queryString ? `?${queryString}` : ''}`);
    }

    async getBooking(id: string): Promise<ApiResponse<Booking>> {
        return this.request<ApiResponse<Booking>>(`/bookings/${id}`);
    }

    async cancelBooking(id: string): Promise<BookingResponse> {
        return this.request<BookingResponse>(`/bookings/${id}`, {
            method: 'DELETE',
        });
    }

    async confirmBooking(id: string): Promise<BookingResponse> {
        return this.request<BookingResponse>(`/bookings/${id}/confirm`, {
            method: 'POST',
        });
    }

    // Admin endpoints
    async createMovie(movie: {
        title: string;
        description?: string;
        durationMinutes: number;
        genre?: string;
        posterUrl?: string;
        status?: string;
        releaseDate?: string;
    }): Promise<ApiResponse<Movie>> {
        return this.request<ApiResponse<Movie>>('/admin/movies', {
            method: 'POST',
            body: JSON.stringify(movie),
        });
    }

    async updateMovie(id: string, movie: Partial<{
        title: string;
        description: string;
        durationMinutes: number;
        genre: string;
        posterUrl: string;
        status: string;
        releaseDate: string;
    }>): Promise<ApiResponse<Movie>> {
        return this.request<ApiResponse<Movie>>(`/admin/movies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(movie),
        });
    }

    async deleteMovie(id: string): Promise<ApiResponse<null>> {
        return this.request<ApiResponse<null>>(`/admin/movies/${id}`, {
            method: 'DELETE',
        });
    }

    async createShowtime(showtime: {
        movieId: string;
        showDate: string;
        showTime: string;
        price: number;
    }): Promise<ApiResponse<Showtime>> {
        return this.request<ApiResponse<Showtime>>('/admin/showtimes', {
            method: 'POST',
            body: JSON.stringify(showtime),
        });
    }

    async updateShowtime(id: string, showtime: Partial<{
        movieId: string;
        showDate: string;
        showTime: string;
        price: number;
    }>): Promise<ApiResponse<Showtime>> {
        return this.request<ApiResponse<Showtime>>(`/admin/showtimes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(showtime),
        });
    }

    async deleteShowtime(id: string): Promise<ApiResponse<null>> {
        return this.request<ApiResponse<null>>(`/admin/showtimes/${id}`, {
            method: 'DELETE',
        });
    }

    async getAdminBookings(params?: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<BookingsResponse> {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set('status', params.status);
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());

        const queryString = searchParams.toString();
        return this.request<BookingsResponse>(`/admin/bookings${queryString ? `?${queryString}` : ''}`);
    }

    async updateBookingStatus(id: string, status: string): Promise<BookingResponse> {
        return this.request<BookingResponse>(`/admin/bookings/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }
}

export const api = new ApiClient();
