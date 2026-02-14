'use client';

import { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { useMovies } from '@/hooks/use-movies';
import type { Movie } from '@/lib/types';
import { MOVIE_STATUS_COLORS, MOVIE_STATUS_LABELS } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Calendar, Film } from 'lucide-react';

// Memoized MovieCard component to prevent unnecessary re-renders
const MovieCard = memo(function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="aspect-[2/3] relative bg-muted overflow-hidden">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Film className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <Badge className={`absolute top-3 right-3 ${MOVIE_STATUS_COLORS[movie.status]}`}>
          {MOVIE_STATUS_LABELS[movie.status]}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-lg line-clamp-1">{movie.title}</h3>
        {movie.genre ? (
          <p className="text-sm text-muted-foreground">{movie.genre}</p>
        ) : null}
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{movie.durationMinutes} min</span>
          </div>
          {movie.releaseDate ? (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(movie.releaseDate).toLocaleDateString()}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/movies/${movie.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <EmptyState hasFilter={status !== 'all'} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
