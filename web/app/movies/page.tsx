'use client';

import { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { useMovies } from '@/hooks/use-movies';
import type { Movie } from '@/lib/types';
import { MOVIE_STATUS_LABELS } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Clock, Calendar, Film, ArrowRight } from 'lucide-react';




const STATUS_STYLES = {
    now_showing: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    coming_soon: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    ended: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40",
};

const MovieCard = memo(function MovieCard({ movie }: { movie: Movie }) {
    return (
        <div
            className="group relative flex overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
            style={{
                boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
                maxWidth: 640,
            }}
        >
            <div
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse at 0% 50%, rgba(139,92,246,0.15) 0%, transparent 60%)",
                }}
            />

            {/* Poster */}
            <div className="relative shrink-0" style={{ width: 160 }}>
                {movie.posterUrl ? (
                    <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ minHeight: 240 }}
                    />
                ) : (
                    <div
                        className="flex h-full w-full flex-col items-center justify-center gap-2"
                        style={{
                            minHeight: 240,
                            background:
                                "linear-gradient(160deg, #1e1b2e 0%, #111118 100%)",
                        }}
                    >
                        <Film className="h-10 w-10 text-violet-500/50" />
                        <span className="text-xs text-zinc-600 tracking-widest uppercase">
                            No Poster
                        </span>
                    </div>
                )}

                <div
                    className="pointer-events-none absolute inset-y-0 right-0 w-8"
                    style={{
                        background:
                            "linear-gradient(to right, transparent, rgb(24,24,27))",
                    }}
                />
            </div>

            {/* Details */}
            <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                    <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest ${STATUS_STYLES[movie.status]}`}
                    >
                        {MOVIE_STATUS_LABELS[movie.status]}
                    </span>

                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Clock className="h-3 w-3" />
                        {movie.durationMinutes} min
                    </span>
                </div>

                {/* Title & Genre */}
                <div>
                    <h3 className="text-lg font-bold leading-tight text-white tracking-tight">
                        {movie.title}
                    </h3>
                    {movie.genre ? (
                        <span className="mt-1.5 inline-block rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                            {movie.genre}
                        </span>
                    ) : null}
                </div>

                {/* Description */}
                {movie.description ? (
                    <p className="text-sm leading-relaxed text-zinc-400 line-clamp-2">
                        {movie.description}
                    </p>
                ) : null}

                {/* Meta */}
                {movie.releaseDate ? (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(movie.releaseDate).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })}
                    </div>
                ) : null}

                {/* CTA */}
                <Link
                    href={`/movies/${movie.id}`}
                    className="group/btn mt-auto inline-flex items-center gap-2 self-start rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-600/30"
                >
                    View Details
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                </Link>
            </div>
        </div>
    );
});


// Hoisted skeleton for better performance
const MovieCardSkeleton = memo(function MovieCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="aspect-[2/3]" />
            <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="pb-2">
                <Skeleton className="h-4 w-full" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    );
});

// Empty state component
function EmptyState({ hasFilter }: { hasFilter: boolean }) {
    return (
        <div className="text-center py-16">
            <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No movies found</h2>
            <p className="text-muted-foreground">
                {hasFilter
                    ? 'Try changing the filter to see more movies'
                    : 'Check back later for new releases'}
            </p>
        </div>
    );
}

// Pagination component - extracted for cleaner code
function Pagination({
    page,
    totalPages,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center gap-2 mt-8">
            <Button
                variant="outline"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
            >
                Previous
            </Button>
            <span className="px-4 text-sm text-muted-foreground">
                Page {page} of {totalPages}
            </span>
            <Button
                variant="outline"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
            >
                Next
            </Button>
        </div>
    );
}

export default function MoviesPage() {
    const [status, setStatus] = useState<string>('all');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useMovies({
        status: status === 'all' ? undefined : status,
        page,
        limit: 12,
    });

    const movies = data?.data.movies ?? [];
    const totalPages = data?.data.totalPages ?? 1;

    // Use functional setState for stable callback
    const handleStatusChange = useCallback((value: string) => {
        setStatus(value);
        setPage(1);
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    return (
        <div className="container py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Movies</h1>
                    <p className="text-muted-foreground">Browse and book tickets for the latest movies</p>
                </div>
                <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Movies</SelectItem>
                        <SelectItem value="now_showing">Now Showing</SelectItem>
                        <SelectItem value="coming_soon">Coming Soon</SelectItem>
                        <SelectItem value="ended">Ended</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-wrap gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <MovieCardSkeleton key={i} />
                    ))}
                </div>
            ) : movies.length === 0 ? (
                <EmptyState hasFilter={status !== 'all'} />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-6">
                        {movies.map((movie) => (
                            <MovieCard key={movie.id} movie={movie} />
                        ))}
                    </div>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    );
}
