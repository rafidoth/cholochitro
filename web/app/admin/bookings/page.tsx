'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { useAdminBookings, useUpdateBookingStatus } from '@/hooks';
import type { Booking } from '@/lib/types';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '@/lib/types';
import { formatShortDate, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Loader2 } from 'lucide-react';

const SKELETON_COUNT = 5;

// Memoized table header
const tableHeader = (
  <TableHeader>
    <TableRow>
      <TableHead>Booking ID</TableHead>
      <TableHead>Movie</TableHead>
      <TableHead>Date/Time</TableHead>
      <TableHead>Seats</TableHead>
      <TableHead>Total</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
);

// Memoized BookingRow component
interface BookingRowProps {
  booking: Booking;
  onEdit: (booking: Booking) => void;
}

const BookingRow = memo(function BookingRow({ booking, onEdit }: BookingRowProps) {
  const handleEdit = useCallback(() => onEdit(booking), [booking, onEdit]);
  
  // Use toSorted for immutability
  const sortedSeats = useMemo(() => booking.seats.toSorted().join(', '), [booking.seats]);

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">
        {booking.id.slice(0, 8)}...
      </TableCell>
      <TableCell className="font-medium">
        {booking.showtime?.movie?.title || 'N/A'}
      </TableCell>
      <TableCell>
        {booking.showtime ? (
          <>
            {formatShortDate(booking.showtime.showDate)}
            <br />
            <span className="text-muted-foreground">
              {formatTime(booking.showtime.showTime)}
            </span>
          </>
        ) : (
          'N/A'
        )}
      </TableCell>
      <TableCell>{sortedSeats}</TableCell>
      <TableCell>${booking.totalPrice.toFixed(2)}</TableCell>
      <TableCell>
        <Badge className={BOOKING_STATUS_COLORS[booking.status]}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={handleEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

// Memoized Pagination component
interface PaginationProps {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

const Pagination = memo(function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: PaginationProps) {
  return (
    <div className="flex justify-center gap-2 mt-4">
      <Button variant="outline" onClick={onPrevious} disabled={page === 1}>
        Previous
      </Button>
      <span className="flex items-center px-4 text-sm">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" onClick={onNext} disabled={page === totalPages}>
        Next
      </Button>
    </div>
  );
});

// Memoized Loading Skeleton
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
});

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [editDialog, setEditDialog] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  // TanStack Query hooks
  const { data: bookingsData, isLoading } = useAdminBookings({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit: 10,
  });
  const updateStatusMutation = useUpdateBookingStatus();

  const bookings = bookingsData?.data.bookings ?? [];
  const totalPages = bookingsData?.data.totalPages ?? 1;

  // Memoized callbacks
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const openEditDialog = useCallback((booking: Booking) => {
    setEditDialog(booking);
    setNewStatus(booking.status);
  }, []);

  const closeEditDialog = useCallback(() => {
    setEditDialog(null);
  }, []);

  const handleUpdateStatus = useCallback(async () => {
    if (!editDialog || newStatus === editDialog.status) return;

    try {
      await updateStatusMutation.mutateAsync({ id: editDialog.id, status: newStatus });
      setEditDialog(null);
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  }, [editDialog, newStatus, updateStatusMutation]);

  // Functional setState for pagination
  const handlePrevious = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const handleNext = useCallback(() => {
    setPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const handleNewStatusChange = useCallback((value: string) => {
    setNewStatus(value);
  }, []);

  // Derived state for button disabled
  const isUpdateDisabled = updateStatusMutation.isPending || newStatus === editDialog?.status;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage customer bookings</p>
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bookings</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              {tableHeader}
              <TableBody>
                {bookings.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    onEdit={openEditDialog}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />
          ) : null}
        </>
      )}

      {/* Edit Status Dialog */}
      <Dialog open={!!editDialog} onOpenChange={closeEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Booking ID</p>
                <p className="font-mono">{editDialog?.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Movie</p>
                <p>{editDialog?.showtime?.movie?.title || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <Select value={newStatus} onValueChange={handleNewStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdateDisabled}>
              {updateStatusMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
