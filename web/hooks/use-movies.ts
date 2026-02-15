import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

// Hook to get movies list
export function useMovies(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.movies.list(params),
    queryFn: () => api.getMovies(params),
  });
}

// Hook to get single movie
export function useMovie(id: string) {
  return useQuery({
    queryKey: queryKeys.movies.detail(id),
    queryFn: async () => {
      const response = await api.getMovie(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// Hook to get movie showtimes
export function useMovieShowtimes(movieId: string) {
  return useQuery({
    queryKey: queryKeys.movies.showtimes(movieId),
    queryFn: () => api.getMovieShowtimes(movieId),
    enabled: !!movieId,
  });
}

// Admin: Create movie mutation
export function useCreateMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movie: {
      title: string;
      description?: string;
      durationMinutes: number;
      genre?: string;
      posterUrl?: string;
      status?: string;
      releaseDate?: string;
    }) => api.createMovie(movie),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
    },
  });
}

// Admin: Update movie mutation
export function useUpdateMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      movie,
    }: {
      id: string;
      movie: Partial<{
        title: string;
        description: string;
        durationMinutes: number;
        genre: string;
        posterUrl: string;
        status: string;
        releaseDate: string;
      }>;
    }) => api.updateMovie(id, movie),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.movies.detail(variables.id) });
    },
  });
}

// Admin: Delete movie mutation
export function useDeleteMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteMovie(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
    },
  });
}
