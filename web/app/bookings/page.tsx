'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useBookings, useCancelBooking, useConfirmBooking } from '@/hooks';
import type { Booking } from '@/lib/types';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '@/lib/types';
import { formatShortDate, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, Ticket, Loader2 } from 'lucide-react';

// Memoized BookingCard component
interface BookingCardProps {
    booking: Booking;
    onCancel: (id: string) => void;
    onConfirm: (id: string) => void;
    isConfirming: boolean;
}

const BookingCard = memo(function BookingCard({
    booking,
    onCancel,
    onConfirm,
    isConfirming,
}: BookingCardProps) {
    const handleCancel = useCallback(() => {
        onCancel(booking.id);
    }, [booking.id, onCancel]);

    const handleConfirm = useCallback(() => {
        onConfirm(booking.id);
    }, [booking.id, onConfirm]);

    // Use toSorted for immutability
    const sortedSeats = useMemo(
        () => booking.seats.toSorted(),
        [booking.seats]
    );

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">
                            {booking.showtime?.movie?.title || 'Movie'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Booking ID: {booking.id.slice(0, 8)}...
                        </p>
                    </div>
                    <Badge className={BOOKING_STATUS_COLORS[booking.status]}>
                        {BOOKING_STATUS_LABELS[booking.status]}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {booking.showtime ? (
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatShortDate(booking.showtime.showDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(booking.showtime.showTime)}</span>
                        </div>
                    </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Seats:</span>
                    {sortedSeats.map((seat) => (
                        <Badge key={seat} variant="secondary">
                            {seat}
                        </Badge>
                    ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-semibold">${booking.totalPrice.toFixed(2)}</span>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                {booking.status === 'pending' ? (
                    <>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleConfirm}
                            disabled={isConfirming}
                        >
                            {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm & Pay
                        </Button>
                    </>
                ) : null}
                {booking.status === 'confirmed' ? (
                    <Button asChild className="w-full">
                        <Link href={`/bookings/${booking.id}`}>View Ticket</Link>
                    </Button>
                ) : null}
                {booking.status === 'cancelled' ? (
                    <Button variant="outline" asChild className="w-full">
                        <Link href="/movies">Book Again</Link>
                    </Button>
                ) : null}
            </CardFooter>
        </Card>
    );
});

// Memoized skeleton component
const BookingCardSkeleton = memo(function BookingCardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    );
});

// Hoist static skeleton array count
const SKELETON_COUNT = 6;

// Empty state component
interface EmptyStateProps {
    hasFilter: boolean;
}

const EmptyState = memo(function EmptyState({ hasFilter }: EmptyStateProps) {
    return (
        <div className="text-center py-16">
            <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No bookings found</h2>
            <p className="text-muted-foreground mb-4">
                {hasFilter
                    ? 'Try changing the filter to see more bookings'
                    : "You haven't made any bookings yet"}
            </p>
            <Button asChild>
                <Link href="/movies">Browse Movies</Link>
            </Button>
        </div>
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
        <div className="flex justify-center gap-2 mt-8">
            <Button
                variant="outline"
                onClick={onPrevious}
                disabled={page === 1}
            >
                Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {totalPages}
            </span>
            <Button
                variant="outline"
                onClick={onNext}
                disabled={page === totalPages}
            >
                Next
            </Button>
        </div>
    );
});

// Auth loading state - hoisted
const authLoadingState = (
    <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    </div>
);

export default function BookingsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [status, setStatus] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [cancelDialog, setCancelDialog] = useState<string | null>(null);

    // TanStack Query hooks
    const { data: bookingsData, isLoading } = useBookings({
        status: status === 'all' ? undefined : status,
        page,
        limit: 10,
    });

    const cancelMutation = useCancelBooking();
    const confirmMutation = useConfirmBooking();

    const bookings = bookingsData?.data.bookings ?? [];
    const totalPages = bookingsData?.data.totalPages ?? 1;

    // Memoized callbacks
    const handleStatusChange = useCallback((value: string) => {
        setStatus(value);
        setPage(1);
    }, []);

    const handleCancel = useCallback(async (id: string) => {
        await cancelMutation.mutateAsync(id);
        setCancelDialog(null);
    }, [cancelMutation]);

    const handleConfirm = useCallback(async (id: string) => {
        await confirmMutation.mutateAsync(id);
    }, [confirmMutation]);

    const openCancelDialog = useCallback((id: string) => {
        setCancelDialog(id);
    }, []);

    const closeCancelDialog = useCallback(() => {
        setCancelDialog(null);
    }, []);

    // Use functional setState for pagination
    const handlePrevious = useCallback(() => {
        setPage((p) => Math.max(1, p - 1));
    }, []);

    const handleNext = useCallback(() => {
        setPage((p) => Math.min(totalPages, p + 1));
    }, [totalPages]);

    // Redirect if not authenticated
    if (!authLoading && !isAuthenticated) {
        router.push('/auth/login?redirect=/bookings');
        return null;
    }

    if (authLoading) {
        return authLoadingState;
    }

    return (
        <div className="container py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">My Bookings</h1>
                    <p className="text-muted-foreground">Manage your movie ticket bookings</p>
                </div>
                <Select value={status} onValueChange={handleStatusChange}>
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
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                        <BookingCardSkeleton key={i} />
                    ))}
                </div>
            ) : bookings.length === 0 ? (
                <EmptyState hasFilter={status !== 'all'} />
            ) : (
                <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map((booking) => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                onCancel={openCancelDialog}
                                onConfirm={handleConfirm}
                                isConfirming={confirmMutation.isPending && confirmMutation.variables === booking.id}
                            />
                        ))}
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

            {/* Cancel Confirmation Dialog */}
            <Dialog open={!!cancelDialog} onOpenChange={closeCancelDialog}>
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
                            onClick={() => cancelDialog && handleCancel(cancelDialog)}
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
