'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useBooking, useCancelBooking, useConfirmBooking } from '@/hooks';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Calendar, Clock, Ticket, Loader2, CheckCircle2 } from 'lucide-react';

// Auth loading state - hoisted
const authLoadingState = (
  <div className="container py-8">
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  </div>
);

// Memoized Loading Skeleton
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <Button variant="ghost" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Bookings
      </Button>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    </div>
  );
});

// Back button - reused
const backButton = (
  <Button variant="ghost" asChild className="mb-6">
    <Link href="/bookings">
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to Bookings
    </Link>
  </Button>
);

// Memoized DateTimeInfo component
interface DateTimeInfoProps {
  showDate: string;
  showTime: string;
}

const DateTimeInfo = memo(function DateTimeInfo({ showDate, showTime }: DateTimeInfoProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
        <Calendar className="h-5 w-5 mb-2 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Date</span>
        <span className="font-medium text-center">
          {formatDate(showDate)}
        </span>
      </div>
      <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
        <Clock className="h-5 w-5 mb-2 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Time</span>
        <span className="font-medium">
          {formatTime(showTime)}
        </span>
      </div>
    </div>
  );
});

// Memoized SeatsList component
interface SeatsListProps {
  seats: string[];
}

const SeatsList = memo(function SeatsList({ seats }: SeatsListProps) {
  const sortedSeats = useMemo(() => seats.toSorted(), [seats]);
  
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">
        Seats ({seats.length})
      </h3>
      <div className="flex flex-wrap justify-center gap-2">
        {sortedSeats.map((seat) => (
          <Badge key={seat} variant="outline" className="text-lg px-4 py-2">
            {seat}
          </Badge>
        ))}
      </div>
    </div>
  );
});

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const bookingId = params.id as string;

  const [cancelDialog, setCancelDialog] = useState(false);

  // TanStack Query hooks
  const { data: booking, isLoading, error } = useBooking(bookingId);
  const cancelMutation = useCancelBooking();
  const confirmMutation = useConfirmBooking();

  // Memoized callbacks
  const handleCancel = useCallback(async () => {
    await cancelMutation.mutateAsync(bookingId);
    setCancelDialog(false);
  }, [cancelMutation, bookingId]);

  const handleConfirm = useCallback(async () => {
    await confirmMutation.mutateAsync(bookingId);
  }, [confirmMutation, bookingId]);

  const openCancelDialog = useCallback(() => {
    setCancelDialog(true);
  }, []);

  const closeCancelDialog = useCallback(() => {
    setCancelDialog(false);
  }, []);

  // Memoized error message
  const mutationError = useMemo(() => {
    if (cancelMutation.error instanceof Error) return cancelMutation.error.message;
    if (confirmMutation.error instanceof Error) return confirmMutation.error.message;
    return null;
  }, [cancelMutation.error, confirmMutation.error]);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push(`/auth/login?redirect=/bookings/${bookingId}`);
    return null;
  }

  if (authLoading) {
    return authLoadingState;
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error && !booking) {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        {backButton}
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load booking'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      {backButton}

      <Card>
        <CardHeader className="text-center pb-2">
          {booking.status === 'confirmed' ? (
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
          ) : null}
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Ticket className="h-6 w-6" />
            {booking.status === 'confirmed' ? 'Your Ticket' : 'Booking Details'}
          </CardTitle>
          <Badge className={`${BOOKING_STATUS_COLORS[booking.status]} mx-auto`}>
            {BOOKING_STATUS_LABELS[booking.status]}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {mutationError ? (
            <Alert variant="destructive">
              <AlertDescription>{mutationError}</AlertDescription>
            </Alert>
          ) : null}

          {/* Movie Info */}
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {booking.showtime?.movie?.title || 'Movie'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Booking ID: {booking.id}
            </p>
          </div>

          <Separator />

          {/* Showtime Info */}
          {booking.showtime ? (
            <DateTimeInfo
              showDate={booking.showtime.showDate}
              showTime={booking.showtime.showTime}
            />
          ) : null}

          <Separator />

          {/* Seats */}
          <SeatsList seats={booking.seats} />

          <Separator />

          {/* Price */}
          <div className="flex justify-between items-center text-lg">
            <span>Total Amount</span>
            <span className="font-bold text-2xl">${booking.totalPrice.toFixed(2)}</span>
          </div>

          {/* Booking Time */}
          <p className="text-xs text-muted-foreground text-center">
            Booked on {new Date(booking.createdAt).toLocaleString()}
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {booking.status === 'pending' ? (
            <>
              <Button
                className="w-full"
                size="lg"
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm & Pay
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={openCancelDialog}
                disabled={cancelMutation.isPending}
              >
                Cancel Booking
              </Button>
            </>
          ) : null}
          {booking.status === 'confirmed' ? (
            <p className="text-sm text-muted-foreground text-center">
              Please show this ticket at the cinema entrance
            </p>
          ) : null}
          {booking.status === 'cancelled' ? (
            <Button asChild className="w-full">
              <Link href="/movies">Book Another Movie</Link>
            </Button>
          ) : null}
        </CardFooter>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog} onOpenChange={closeCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeCancelDialog}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
