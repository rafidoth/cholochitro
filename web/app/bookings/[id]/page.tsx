'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import type { Booking, BookingStatus } from '@/lib/types';
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
import { ArrowLeft, Calendar, Clock, Film, Ticket, Loader2, CheckCircle2 } from 'lucide-react';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(timeString: string) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

const statusColors: Record<BookingStatus, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const statusLabels: Record<BookingStatus, string> = {
  pending: 'Pending Payment',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/bookings/${bookingId}`);
    }
  }, [authLoading, isAuthenticated, router, bookingId]);

  useEffect(() => {
    const fetchBooking = async () => {
      setIsLoading(true);
      try {
        const response = await api.getBooking(bookingId);
        setBooking(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchBooking();
    }
  }, [bookingId, isAuthenticated]);

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await api.cancelBooking(bookingId);
      setBooking((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
      setCancelDialog(false);
    }
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await api.confirmBooking(bookingId);
      setBooking((prev) => (prev ? { ...prev, status: 'confirmed' } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm booking');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (isLoading) {
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
  }

  if (error && !booking) {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/bookings">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Link>
      </Button>

      <Card>
        <CardHeader className="text-center pb-2">
          {booking.status === 'confirmed' && (
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
          )}
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Ticket className="h-6 w-6" />
            {booking.status === 'confirmed' ? 'Your Ticket' : 'Booking Details'}
          </CardTitle>
          <Badge className={`${statusColors[booking.status]} mx-auto`}>
            {statusLabels[booking.status]}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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
          {booking.showtime && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="font-medium text-center">
                  {formatDate(booking.showtime.showDate)}
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <Clock className="h-5 w-5 mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="font-medium">
                  {formatTime(booking.showtime.showTime)}
                </span>
              </div>
            </div>
          )}

          <Separator />

          {/* Seats */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">
              Seats ({booking.seats.length})
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {booking.seats.sort().map((seat) => (
                <Badge key={seat} variant="outline" className="text-lg px-4 py-2">
                  {seat}
                </Badge>
              ))}
            </div>
          </div>

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
          {booking.status === 'pending' && (
            <>
              <Button className="w-full" size="lg" onClick={handleConfirm} disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Pay
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCancelDialog(true)}
                disabled={actionLoading}
              >
                Cancel Booking
              </Button>
            </>
          )}
          {booking.status === 'confirmed' && (
            <p className="text-sm text-muted-foreground text-center">
              Please show this ticket at the cinema entrance
            </p>
          )}
          {booking.status === 'cancelled' && (
            <Button asChild className="w-full">
              <Link href="/movies">Book Another Movie</Link>
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(false)}>
              Keep Booking
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
