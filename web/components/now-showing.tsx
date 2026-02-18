'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useMovies } from '@/hooks/use-movies';
import type { Movie } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Film, ArrowRight } from 'lucide-react';

const MovieCard = memo(function MovieCard({ movie, index }: { movie: Movie; index: number }) {
    return (
        <Link
            href={`/movies/${movie.id}`}
            className={`group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/50 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up ${index === 1 ? 'animation-delay-200' : index === 2 ? 'animation-delay-400' : index === 3 ? 'animation-delay-600' : ''}`}
        >
            <div className="aspect-[2/3] relative overflow-hidden">
                {movie.posterUrl ? (
                    <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-muted">
                        <Film className="h-16 w-16 text-muted-foreground" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    <span className="text-white text-sm font-medium flex items-center gap-1">
                        Book Now <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                </div>
                <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-xs">
                    Now Showing
                </Badge>
            </div>
            <div className="p-4 flex flex-col gap-1.5">
                <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                    {movie.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {movie.genre ? (
                        <span className="truncate">{movie.genre}</span>
                    ) : null}
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{movie.durationMinutes}m</span>
                    </div>
                </div>
            </div>
        </Link>
    );
});

const MovieCardSkeleton = memo(function MovieCardSkeleton() {
    return (
        <div className="flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/50">
            <Skeleton className="aspect-[2/3]" />
            <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3.5 w-1/2" />
            </div>
        </div>
    );
});

export function NowShowing() {
    const { data, isLoading } = useMovies({
        status: 'now_showing',
        page: 1,
        limit: 4,
    });

    const movies = data?.data.movies ?? [];

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <MovieCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (movies.length === 0) {
        return (
            <div className="text-center py-12">
                <Film className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No movies currently showing</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {movies.map((movie, i) => (
                    <MovieCard key={movie.id} movie={movie} index={i} />
                ))}
            </div>
            <div className="flex justify-center">
                <Button asChild variant="outline" size="lg" className="group">
                    <Link href="/movies">
                        View All Movies
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
