'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Movie, Showtime, MovieStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Clock, Calendar, Film, ArrowLeft, Ticket } from 'lucide-react';

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

function groupShowtimesByDate(showtimes: Showtime[]) {
  const grouped: Record<string, Showtime[]> = {};
  showtimes.forEach((showtime) => {
    if (!grouped[showtime.showDate]) {
      grouped[showtime.showDate] = [];
    }
    grouped[showtime.showDate].push(showtime);
  });
  // Sort by time within each date
  Object.keys(grouped).forEach((date) => {
    grouped[date].sort((a, b) => a.showTime.localeCompare(b.showTime));
  });
  return grouped;
}

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = params.id as string;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [movieRes, showtimesRes] = await Promise.all([
          api.getMovie(movieId),
          api.getMovieShowtimes(movieId),
        ]);
        setMovie(movieRes.data);
        setShowtimes(showtimesRes.data.showtimes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load movie');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [movieId]);

  const statusColors: Record<MovieStatus, string> = {
    now_showing: 'bg-green-500',
    coming_soon: 'bg-blue-500',
    ended: 'bg-gray-500',
  };

  const statusLabels: Record<MovieStatus, string> = {
    now_showing: 'Now Showing',
    coming_soon: 'Coming Soon',
    ended: 'Ended',
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Movies
        </Button>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Movies
        </Button>
        <div className="text-center py-16">
          <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Movie not found</h2>
          <p className="text-muted-foreground">{error || 'The movie you are looking for does not exist'}</p>
        </div>
      </div>
    );
  }

  const groupedShowtimes = groupShowtimesByDate(showtimes);
  const sortedDates = Object.keys(groupedShowtimes).sort();

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/movies">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Movies
        </Link>
      </Button>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Movie Poster */}
        <div className="md:col-span-1">
          <div className="aspect-[2/3] relative bg-muted rounded-lg overflow-hidden">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Film className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Movie Details */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{movie.title}</h1>
              <Badge className={statusColors[movie.status]}>
                {statusLabels[movie.status]}
              </Badge>
            </div>
            {movie.genre && (
              <p className="text-lg text-muted-foreground">{movie.genre}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{movie.durationMinutes} minutes</span>
            </div>
            {movie.releaseDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{formatDate(movie.releaseDate)}</span>
              </div>
            )}
          </div>

          {movie.description && (
            <>
              <Separator />
              <div>
                <h2 className="text-xl font-semibold mb-2">Synopsis</h2>
                <p className="text-muted-foreground leading-relaxed">{movie.description}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Showtimes */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Available Showtimes
            </h2>

            {movie.status === 'coming_soon' ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Showtimes will be available once the movie is released
                  </p>
                </CardContent>
              </Card>
            ) : movie.status === 'ended' ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    This movie is no longer showing
                  </p>
                </CardContent>
              </Card>
            ) : sortedDates.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No showtimes available at the moment
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sortedDates.map((date) => (
                  <Card key={date}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{formatDate(date)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {groupedShowtimes[date].map((showtime) => (
                          <Button key={showtime.id} variant="outline" asChild>
                            <Link href={`/movies/${movie.id}/book/${showtime.id}`}>
                              <span className="font-medium">{formatTime(showtime.showTime)}</span>
                              <span className="ml-2 text-muted-foreground">${showtime.price}</span>
                            </Link>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
