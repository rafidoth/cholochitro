'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import type { Movie, Showtime } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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

interface SeatProps {
  seatId: string;
  isBooked: boolean;
  isSelected: boolean;
  onSelect: (seatId: string) => void;
}

function Seat({ seatId, isBooked, isSelected, onSelect }: SeatProps) {
  return (
    <button
      className={cn(
        'w-8 h-8 rounded-t-lg text-xs font-medium transition-colors',
        isBooked && 'bg-muted text-muted-foreground cursor-not-allowed',
        !isBooked && !isSelected && 'bg-secondary hover:bg-primary/20 cursor-pointer',
        isSelected && 'bg-primary text-primary-foreground'
      )}
      disabled={isBooked}
      onClick={() => onSelect(seatId)}
      title={isBooked ? 'Already booked' : seatId}
    >
      {seatId}
    </button>
  );
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const movieId = params.id as string;
  const showtimeId = params.showtimeId as string;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/movies/${movieId}/book/${showtimeId}`);
    }
  }, [authLoading, isAuthenticated, router, movieId, showtimeId]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [movieRes, showtimeRes, seatsRes] = await Promise.all([
          api.getMovie(movieId),
          api.getShowtime(showtimeId),
          api.getShowtimeSeats(showtimeId),
        ]);
        setMovie(movieRes.data);
        setShowtime(showtimeRes.data);
        setBookedSeats(seatsRes.data.bookedSeats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [movieId, showtimeId, isAuthenticated]);

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((s) => s !== seatId);
      }
      if (prev.length >= 10) {
        return prev;
      }
      return [...prev, seatId];
    });
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) return;

    setIsBooking(true);
    setError('');

    try {
      const response = await api.createBooking(showtimeId, selectedSeats);
      router.push(`/bookings/${response.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setIsBooking(false);
    }
  };

  const totalPrice = showtime ? selectedSeats.length * showtime.price : 0;

  if (authLoading || (!isAuthenticated && !authLoading)) {
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
                You can select up to 10 seats
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Screen */}
              <div className="flex flex-col items-center gap-2 mb-8">
                <div className="w-3/4 h-2 bg-primary rounded-full" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm">Screen</span>
                </div>
              </div>

              {/* Seat Grid */}
              <div className="flex flex-col items-center gap-2">
                {ROWS.map((row) => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="w-6 text-sm font-medium text-muted-foreground">{row}</span>
                    <div className="flex gap-1">
                      {COLUMNS.slice(0, 5).map((col) => {
                        const seatId = `${row}${col}`;
                        return (
                          <Seat
                            key={seatId}
                            seatId={seatId}
                            isBooked={bookedSeats.includes(seatId)}
                            isSelected={selectedSeats.includes(seatId)}
                            onSelect={handleSeatSelect}
                          />
                        );
                      })}
                    </div>
                    <div className="w-8" /> {/* Aisle */}
                    <div className="flex gap-1">
                      {COLUMNS.slice(5).map((col) => {
                        const seatId = `${row}${col}`;
                        return (
                          <Seat
                            key={seatId}
                            seatId={seatId}
                            isBooked={bookedSeats.includes(seatId)}
                            isSelected={selectedSeats.includes(seatId)}
                            onSelect={handleSeatSelect}
                          />
                        );
                      })}
                    </div>
                    <span className="w-6 text-sm font-medium text-muted-foreground">{row}</span>
                  </div>
                ))}
              </div>

              {/* Legend */}
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
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {movie && (
                <div>
                  <h3 className="font-semibold">{movie.title}</h3>
                  {movie.genre && (
                    <p className="text-sm text-muted-foreground">{movie.genre}</p>
                  )}
                </div>
              )}

              <Separator />

              {showtime && (
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
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Selected seats</span>
                  <span>{selectedSeats.length > 0 ? selectedSeats.sort().join(', ') : '-'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                disabled={selectedSeats.length === 0 || isBooking}
                onClick={handleBooking}
              >
                {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedSeats.length === 0
                  ? 'Select seats to continue'
                  : `Book ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''}`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
