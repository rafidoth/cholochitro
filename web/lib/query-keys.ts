// Query keys for TanStack Query
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
  },

  // Movies
  movies: {
    all: ['movies'] as const,
    list: (params?: { status?: string; page?: number; limit?: number }) =>
      ['movies', 'list', params] as const,
    detail: (id: string) => ['movies', 'detail', id] as const,
    showtimes: (movieId: string) => ['movies', movieId, 'showtimes'] as const,
  },

  // Showtimes
  showtimes: {
    all: ['showtimes'] as const,
    list: (params?: { movieId?: string; date?: string; page?: number; limit?: number }) =>
      ['showtimes', 'list', params] as const,
    detail: (id: string) => ['showtimes', 'detail', id] as const,
    seats: (showtimeId: string) => ['showtimes', showtimeId, 'seats'] as const,
  },

  // Bookings
  bookings: {
    all: ['bookings'] as const,
    list: (params?: { status?: string; page?: number; limit?: number }) =>
      ['bookings', 'list', params] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
  },

  // Admin
  admin: {
    bookings: {
      all: ['admin', 'bookings'] as const,
      list: (params?: { status?: string; page?: number; limit?: number }) =>
        ['admin', 'bookings', 'list', params] as const,
    },
  },
};
