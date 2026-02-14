import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

// Hook to get user bookings
export function useBookings(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.bookings.list(params),
    queryFn: () => api.getBookings(params),
  });
}

// Hook to get single booking
export function useBooking(id: string) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: async () => {
      const response = await api.getBooking(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// Hook to create booking
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ showtimeId, seats }: { showtimeId: string; seats: string[] }) =>
      api.createBooking(showtimeId, seats),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.showtimes.seats(variables.showtimeId) });
    },
  });
}

// Hook to cancel booking
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
    },
  });
}

// Hook to confirm booking
export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.confirmBooking(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
    },
  });
}

// Admin: Get all bookings
export function useAdminBookings(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.admin.bookings.list(params),
    queryFn: () => api.getAdminBookings(params),
  });
}

// Admin: Update booking status
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}
