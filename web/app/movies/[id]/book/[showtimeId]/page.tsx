'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useMovie } from '@/hooks/use-movies';
import { useShowtime, useShowtimeSeats } from '@/hooks/use-showtimes';
import { useCreateBooking } from '@/hooks/use-bookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Monitor } from 'lucide-react';
import { cn, formatDate, formatTime } from '@/lib/utils';

// Hoist constants to module level
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;
const COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const LEFT_COLUMNS = COLUMNS.slice(0, 5);
const RIGHT_COLUMNS = COLUMNS.slice(5);
const MAX_SEATS = 10;

// Hoist static JSX elements
const screenIndicator = (
    <div className="flex flex-col items-center gap-2 mb-8">
        <div className="w-3/4 h-2 bg-primary rounded-full" />
        <div className="flex items-center gap-2 text-muted-foreground">
            <Monitor className="h-4 w-4" />
            <span className="text-sm">Screen</span>
        </div>
    </div>
);

const seatLegend = (
    <div className="flex justify-center gap-6 pt-4">
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-lg bg-secondary" />
            <span className="text-sm text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-lg bg-primary" />
            <span className="text-sm text-muted-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-lg bg-muted" />
            <span className="text-sm text-muted-foreground">Booked</span>
        </div>
    </div>
);

// Memoized Seat component
interface SeatProps {
    seatId: string;
    isBooked: boolean;
    isSelected: boolean;
    onSelect: (seatId: string) => void;
}

const Seat = memo(function Seat({ seatId, isBooked, isSelected, onSelect }: SeatProps) {
    const handleClick = useCallback(() => {
        onSelect(seatId);
    }, [seatId, onSelect]);

    return (
        <button
            className={cn(
                'w-8 h-8 rounded-t-lg text-xs font-medium transition-colors',
                isBooked ? 'bg-muted text-muted-foreground cursor-not-allowed' : null,
                !isBooked && !isSelected ? 'bg-secondary hover:bg-primary/20 cursor-pointer' : null,
                isSelected ? 'bg-primary text-primary-foreground' : null
            )}
            disabled={isBooked}
            onClick={handleClick}
            title={isBooked ? 'Already booked' : seatId}
        >
            {seatId}
        </button>
    );
});

// Memoized Loading Skeleton
const LoadingSkeleton = memo(function LoadingSkeleton() {
    return (
        <div className="container py-8">
            <Button variant="ghost" className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Skeleton className="h-[500px] w-full rounded-lg" />
                </div>
                <div>
                    <Skeleton className="h-[300px] w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
});

// Auth loading state
const authLoadingState = (
    <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    </div>
);

// Memoized SeatRow component
interface SeatRowProps {
    row: string;
    bookedSeats: string[];
    selectedSeats: string[];
    onSeatSelect: (seatId: string) => void;
}

const SeatRow = memo(function SeatRow({ row, bookedSeats, selectedSeats, onSeatSelect }: SeatRowProps) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-6 text-sm font-medium text-muted-foreground">{row}</span>
            <div className="flex gap-1">
                {LEFT_COLUMNS.map((col) => {
                    const seatId = `${row}${col}`;
                    return (
                        <Seat
                            key={seatId}
                            seatId={seatId}
                            isBooked={bookedSeats.includes(seatId)}
                            isSelected={selectedSeats.includes(seatId)}
                            onSelect={onSeatSelect}
                        />
                    );
                })}
            </div>
            <div className="w-8" /> {/* Aisle */}
            <div className="flex gap-1">
                {RIGHT_COLUMNS.map((col) => {
                    const seatId = `${row}${col}`;
                    return (
                        <Seat
                            key={seatId}
                            seatId={seatId}
                            isBooked={bookedSeats.includes(seatId)}
                            isSelected={selectedSeats.includes(seatId)}
                            onSelect={onSeatSelect}
                        />
                    );
                })}
            </div>
            <span className="w-6 text-sm font-medium text-muted-foreground">{row}</span>
        </div>
    );
});

// Memoized BookingSummary component
interface BookingSummaryProps {
    movie: { title: string; genre: string | null } | null;
    showtime: { showDate: string; showTime: string; price: number } | null;
    selectedSeats: string[];
    totalPrice: number;
    error: string;
    isPending: boolean;
    onBook: () => void;
}

const BookingSummary = memo(function BookingSummary({
    movie,
    showtime,
    selectedSeats,
    totalPrice,
    error,
    isPending,
    onBook,
}: BookingSummaryProps) {
    const sortedSeats = useMemo(
        () => (selectedSeats.length > 0 ? selectedSeats.toSorted().join(', ') : '-'),
        [selectedSeats]
    );

    const buttonText = selectedSeats.length === 0
        ? 'Select seats to continue'
        : `Book ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''}`;

    return (
        <Card className="sticky top-24">
            <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {movie ? (
                    <div>
                        <h3 className="font-semibold">{movie.title}</h3>
                        {movie.genre ? (
                            <p className="text-sm text-muted-foreground">{movie.genre}</p>
                        ) : null}
                    </div>
                ) : null}

                <Separator />

                {showtime ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Date</span>
                            <span>{formatDate(showtime.showDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Time</span>
                            <span>{formatTime(showtime.showTime)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Price per seat</span>
                            <span>${showtime.price}</span>
                        </div>
                    </div>
                ) : null}

                <Separator />

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Selected seats</span>
                        <span>{sortedSeats}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${totalPrice.toFixed(2)}</span>
                    </div>
                </div>

                {error ? (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : null}
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    size="lg"
                    disabled={selectedSeats.length === 0 || isPending}
                    onClick={onBook}
                >
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {buttonText}
                </Button>
            </CardFooter>
        </Card>
    );
});

export default function BookingPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const movieId = params.id as string;
    const showtimeId = params.showtimeId as string;

    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

    const { data: movie, isLoading: movieLoading } = useMovie(movieId);
    const { data: showtime, isLoading: showtimeLoading } = useShowtime(showtimeId);
    const { data: seatsData, isLoading: seatsLoading, error: seatsError } = useShowtimeSeats(showtimeId);
    const createBookingMutation = useCreateBooking();

    const isLoading = movieLoading || showtimeLoading || seatsLoading;
    const bookedSeats = useMemo(() => seatsData?.data.bookedSeats ?? [], [seatsData]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push(`/auth/login?redirect=/movies/${movieId}/book/${showtimeId}`);
        }
    }, [authLoading, isAuthenticated, router, movieId, showtimeId]);

    // Use functional setState to avoid stale closures
    const handleSeatSelect = useCallback((seatId: string) => {
        setSelectedSeats((prev) => {
            if (prev.includes(seatId)) {
                return prev.filter((s) => s !== seatId);
            }
            if (prev.length >= MAX_SEATS) {
                return prev;
            }
            return [...prev, seatId];
        });
    }, []);

    const handleBooking = useCallback(async () => {
        if (selectedSeats.length === 0) return;

        try {
            const response = await createBookingMutation.mutateAsync({
                showtimeId,
                seats: selectedSeats,
            });
            router.push(`/bookings/${response.data.id}`);
        } catch {
            // Error is handled by the mutation
        }
    }, [selectedSeats, createBookingMutation, showtimeId, router]);

    const totalPrice = useMemo(
        () => (showtime ? selectedSeats.length * showtime.price : 0),
        [showtime, selectedSeats.length]
    );

    const error = useMemo(() => {
        if (seatsError instanceof Error) return seatsError.message;
        if (createBookingMutation.error instanceof Error) return createBookingMutation.error.message;
        return '';
    }, [seatsError, createBookingMutation.error]);

    // Early returns for loading/auth states
    if (authLoading || (!isAuthenticated && !authLoading)) {
        return authLoadingState;
    }

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (error && !movie) {
        return (
            <div className="container py-8">
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <Button variant="ghost" asChild className="mb-6">
                <Link href={`/movies/${movieId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Movie
                </Link>
            </Button>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Seat Selection */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Your Seats</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                You can select up to {MAX_SEATS} seats
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {screenIndicator}

                            {/* Seat Grid */}
                            <div className="flex flex-col items-center gap-2">
                                {ROWS.map((row) => (
                                    <SeatRow
                                        key={row}
                                        row={row}
                                        bookedSeats={bookedSeats}
                                        selectedSeats={selectedSeats}
                                        onSeatSelect={handleSeatSelect}
                                    />
                                ))}
                            </div>

                            {seatLegend}
                        </CardContent>
                    </Card>
                </div>

                {/* Booking Summary */}
                <div>
                    <BookingSummary
                        movie={movie ? { title: movie.title, genre: movie.genre } : null}
                        showtime={showtime ? { showDate: showtime.showDate, showTime: showtime.showTime, price: showtime.price } : null}
                        selectedSeats={selectedSeats}
                        totalPrice={totalPrice}
                        error={error}
                        isPending={createBookingMutation.isPending}
                        onBook={handleBooking}
                    />
                </div>
            </div>
        </div>
    );
}
