import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

// Hook to get showtimes list
export function useShowtimes(params?: {
  movieId?: string;
  date?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.showtimes.list(params),
    queryFn: () => api.getShowtimes(params),
  });
}

// Hook to get single showtime
export function useShowtime(id: string) {
  return useQuery({
    queryKey: queryKeys.showtimes.detail(id),
    queryFn: async () => {
      const response = await api.getShowtime(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// Hook to get showtime seats
export function useShowtimeSeats(showtimeId: string) {
  return useQuery({
    queryKey: queryKeys.showtimes.seats(showtimeId),
    queryFn: () => api.getShowtimeSeats(showtimeId),
    enabled: !!showtimeId,
  });
}

// Admin: Create showtime mutation
export function useCreateShowtime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (showtime: {
      movieId: string;
      showDate: string;
      showTime: string;
      price: number;
    }) => api.createShowtime(showtime),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.showtimes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.movies.showtimes(variables.movieId) });
    },
  });
}

// Admin: Update showtime mutation
export function useUpdateShowtime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      showtime,
    }: {
      id: string;
      showtime: Partial<{
        movieId: string;
        showDate: string;
        showTime: string;
        price: number;
      }>;
    }) => api.updateShowtime(id, showtime),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.showtimes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.showtimes.detail(variables.id) });
    },
  });
}

// Admin: Delete showtime mutation
export function useDeleteShowtime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteShowtime(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.showtimes.all });
    },
  });
}
