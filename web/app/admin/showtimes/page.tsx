'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useShowtimes, useMovies, useCreateShowtime, useUpdateShowtime, useDeleteShowtime } from '@/hooks';
import type { Showtime } from '@/lib/types';
import { formatShortDate, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

// Form data interface
interface ShowtimeFormData {
  movieId: string;
  showDate: string;
  showTime: string;
  price: string;
}

// Extended showtime with movie title
interface ShowtimeWithTitle extends Showtime {
  movieTitle: string;
}

// Hoisted initial form data constant
const INITIAL_FORM_DATA: ShowtimeFormData = {
  movieId: '',
  showDate: '',
  showTime: '',
  price: '',
} as const;

const SKELETON_COUNT = 5;

// Memoized table header
const tableHeader = (
  <TableHeader>
    <TableRow>
      <TableHead>Movie</TableHead>
      <TableHead>Date</TableHead>
      <TableHead>Time</TableHead>
      <TableHead>Price</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
);

// Memoized ShowtimeRow component
interface ShowtimeRowProps {
  showtime: ShowtimeWithTitle;
  onEdit: (showtime: Showtime) => void;
  onDelete: (id: string) => void;
}

const ShowtimeRow = memo(function ShowtimeRow({ showtime, onEdit, onDelete }: ShowtimeRowProps) {
  const handleEdit = useCallback(() => onEdit(showtime), [showtime, onEdit]);
  const handleDelete = useCallback(() => onDelete(showtime.id), [showtime.id, onDelete]);

  return (
    <TableRow>
      <TableCell className="font-medium">{showtime.movieTitle}</TableCell>
      <TableCell>{formatShortDate(showtime.showDate)}</TableCell>
      <TableCell>{formatTime(showtime.showTime)}</TableCell>
      <TableCell>${showtime.price.toFixed(2)}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={handleEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
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
    <div className="flex justify-center gap-2 mt-4">
      <Button variant="outline" onClick={onPrevious} disabled={page === 1}>
        Previous
      </Button>
      <span className="flex items-center px-4 text-sm">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" onClick={onNext} disabled={page === totalPages}>
        Next
      </Button>
    </div>
  );
});

// Memoized Loading Skeleton
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
});

export default function AdminShowtimesPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [formData, setFormData] = useState<ShowtimeFormData>(INITIAL_FORM_DATA);
  const [error, setError] = useState('');

  // TanStack Query hooks
  const { data: showtimesData, isLoading: showtimesLoading } = useShowtimes({ page, limit: 10 });
  const { data: moviesData, isLoading: moviesLoading } = useMovies({ limit: 100 });
  const createMutation = useCreateShowtime();
  const updateMutation = useUpdateShowtime();
  const deleteMutation = useDeleteShowtime();

  const movies = moviesData?.data.movies ?? [];
  const showtimesRaw = showtimesData?.data.showtimes ?? [];
  const totalPages = showtimesData?.data.totalPages ?? 1;

  // Create a map of movie IDs to titles and add to showtimes
  // Using Map for O(1) lookups
  const showtimes = useMemo(() => {
    const movieMap = new Map(movies.map((m) => [m.id, m.title]));
    return showtimesRaw.map((s) => ({
      ...s,
      movieTitle: movieMap.get(s.movieId) || 'Unknown Movie',
    }));
  }, [showtimesRaw, movies]);

  const isLoading = showtimesLoading || moviesLoading;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Memoized callbacks
  const openCreateDialog = useCallback(() => {
    setEditingShowtime(null);
    setFormData(INITIAL_FORM_DATA);
    setError('');
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((showtime: Showtime) => {
    setEditingShowtime(showtime);
    setFormData({
      movieId: showtime.movieId,
      showDate: showtime.showDate.split('T')[0],
      showTime: showtime.showTime,
      price: showtime.price.toString(),
    });
    setError('');
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const openDeleteDialog = useCallback((id: string) => {
    setDeleteDialog(id);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        movieId: formData.movieId,
        showDate: formData.showDate,
        showTime: formData.showTime,
        price: parseFloat(formData.price),
      };

      if (editingShowtime) {
        await updateMutation.mutateAsync({ id: editingShowtime.id, showtime: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save showtime');
    }
  }, [formData, editingShowtime, updateMutation, createMutation]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteDialog(null);
    } catch (err) {
      console.error('Failed to delete showtime:', err);
    }
  }, [deleteMutation]);

  // Functional setState for pagination
  const handlePrevious = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const handleNext = useCallback(() => {
    setPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  // Form field handlers using functional updates
  const handleFieldChange = useCallback((field: keyof ShowtimeFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleMovieChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, movieId: value }));
  }, []);

  // Memoize error alert
  const errorAlert = useMemo(() => (
    error ? (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    ) : null
  ), [error]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Showtimes</h1>
          <p className="text-muted-foreground">Manage movie showtimes</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Showtime
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              {tableHeader}
              <TableBody>
                {showtimes.map((showtime) => (
                  <ShowtimeRow
                    key={showtime.id}
                    showtime={showtime}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                  />
                ))}
              </TableBody>
            </Table>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingShowtime ? 'Edit Showtime' : 'Add New Showtime'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {errorAlert}
              <div className="space-y-2">
                <Label htmlFor="movieId">Movie *</Label>
                <Select value={formData.movieId} onValueChange={handleMovieChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a movie" />
                  </SelectTrigger>
                  <SelectContent>
                    {movies.map((movie) => (
                      <SelectItem key={movie.id} value={movie.id}>
                        {movie.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="showDate">Date *</Label>
                  <Input
                    id="showDate"
                    type="date"
                    value={formData.showDate}
                    onChange={handleFieldChange('showDate')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="showTime">Time *</Label>
                  <Input
                    id="showTime"
                    type="time"
                    value={formData.showTime}
                    onChange={handleFieldChange('showTime')}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleFieldChange('price')}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.movieId}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingShowtime ? 'Save Changes' : 'Create Showtime'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={closeDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Showtime</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this showtime? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
