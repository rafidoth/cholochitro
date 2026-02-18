'use client';

import { useMemo, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMovie, useMovieShowtimes } from '@/hooks/use-movies';
import type { Showtime } from '@/lib/types';
import { MOVIE_STATUS_COLORS, MOVIE_STATUS_LABELS } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Clock, Calendar, Film, ArrowLeft, Ticket } from 'lucide-react';

// Group showtimes by date - memoized calculation
function groupShowtimesByDate(showtimes: Showtime[]) {
    const grouped: Record<string, Showtime[]> = {};

    for (const showtime of showtimes) {
        if (!grouped[showtime.showDate]) {
            grouped[showtime.showDate] = [];
        }
        grouped[showtime.showDate].push(showtime);
    }

    // Sort by time within each date
    for (const date of Object.keys(grouped)) {
        grouped[date].sort((a, b) => a.showTime.localeCompare(b.showTime));
    }

    return grouped;
}

// Loading skeleton component
const LoadingSkeleton = memo(function LoadingSkeleton() {
    return (
        <div className="container py-8">
            <Button variant="ghost" className="mb-6" disabled>
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
});

// Error/Not found state
function NotFoundState({ error }: { error?: Error | null }) {
    const router = useRouter();

    return (
        <div className="container py-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Movies
            </Button>
            <div className="text-center py-16">
                <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Movie not found</h2>
                <p className="text-muted-foreground">
                    {error?.message || 'The movie you are looking for does not exist'}
                </p>
            </div>
        </div>
    );
}

// Showtime button component
const ShowtimeButton = memo(function ShowtimeButton({
    showtime,
    movieId,
}: {
    showtime: Showtime;
    movieId: string;
}) {
    return (
        <Button variant="ghost" asChild>
            <Link href={`/movies/${movieId}/book/${showtime.id}`}>
                <span className="font-medium">{formatTime(showtime.showTime)}</span>
                <span className="ml-2 text-muted-foreground">${showtime.price}</span>
            </Link>
        </Button>
    );
});

// Showtimes section component
function ShowtimesSection({
    movieId,
    movieStatus,
    groupedShowtimes,
    sortedDates,
}: {
    movieId: string;
    movieStatus: string;
    groupedShowtimes: Record<string, Showtime[]>;
    sortedDates: string[];
}) {
    if (movieStatus === 'coming_soon') {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        Showtimes will be available once the movie is released
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (movieStatus === 'ended') {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        This movie is no longer showing
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (sortedDates.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        No showtimes available at the moment
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {sortedDates.map((date) => (
                <Card key={date}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{formatDate(date)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {groupedShowtimes[date].map((showtime) => (
                                <ShowtimeButton
                                    key={showtime.id}
                                    showtime={showtime}
                                    movieId={movieId}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function MovieDetailPage() {
    const params = useParams();
    const movieId = params.id as string;

    const { data: movie, isLoading: movieLoading, error: movieError } = useMovie(movieId);
    const { data: showtimesData, isLoading: showtimesLoading } = useMovieShowtimes(movieId);

    const isLoading = movieLoading || showtimesLoading;
    const showtimes: Showtime[] = showtimesData?.data ?? [];

    // Memoize grouped showtimes calculation
    const { groupedShowtimes, sortedDates } = useMemo(() => {
        const grouped = groupShowtimesByDate(showtimes);
        const sorted = Object.keys(grouped).sort();
        return { groupedShowtimes: grouped, sortedDates: sorted };
    }, [showtimes]);

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (movieError || !movie) {
        return <NotFoundState error={movieError instanceof Error ? movieError : null} />;
    }

    return (
        <div className="container py-8">
            <Button variant="ghost" asChild className="mb-6">
                <Link href="/movies">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Movies
                </Link>
            </Button>

            <div className="grid md:grid-cols-6 gap-8">
                {/* Movie Poster */}
                <div className="md:col-span-1">
                    <div className="aspect-[4/6] relative bg-muted rounded-sm overflow-hidden">
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
                <div className="md:col-span-5 space-y-6">
                    {/* Title and Status */}
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold">{movie.title}</h1>
                            <Badge className={MOVIE_STATUS_COLORS[movie.status]}>
                                {MOVIE_STATUS_LABELS[movie.status]}
                            </Badge>
                        </div>
                        {movie.genre ? (
                            <p className="text-lg text-muted-foreground">{movie.genre}</p>
                        ) : null}
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            <span>{movie.durationMinutes} minutes</span>
                        </div>
                        {movie.releaseDate ? (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                <span>{formatDate(movie.releaseDate)}</span>
                            </div>
                        ) : null}
                    </div>

                    {/* Synopsis */}
                    {movie.description ? (
                        <>
                            <Separator />
                            <div>
                                <h2 className="text-xl font-semibold mb-2">Synopsis</h2>
                                <p className="text-muted-foreground leading-relaxed">{movie.description}</p>
                            </div>
                        </>
                    ) : null}

                    <Separator />

                    {/* Showtimes */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Ticket className="h-5 w-5" />
                            Available Showtimes
                        </h2>
                        <ShowtimesSection
                            movieId={movie.id}
                            movieStatus={movie.status}
                            groupedShowtimes={groupedShowtimes}
                            sortedDates={sortedDates}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
