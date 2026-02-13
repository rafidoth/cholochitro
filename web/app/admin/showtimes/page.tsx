'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Showtime, Movie } from '@/lib/types';
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeString: string) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

interface ShowtimeFormData {
  movieId: string;
  showDate: string;
  showTime: string;
  price: string;
}

const initialFormData: ShowtimeFormData = {
  movieId: '',
  showDate: '',
  showTime: '',
  price: '',
};

interface ShowtimeWithMovie extends Showtime {
  movieTitle?: string;
}

export default function AdminShowtimesPage() {
  const [showtimes, setShowtimes] = useState<ShowtimeWithMovie[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [formData, setFormData] = useState<ShowtimeFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchShowtimes = async () => {
    setIsLoading(true);
    try {
      const [showtimesRes, moviesRes] = await Promise.all([
        api.getShowtimes({ page, limit: 10 }),
        api.getMovies({ limit: 100 }),
      ]);
      
      // Create a map of movie IDs to titles
      const movieMap = new Map(moviesRes.data.movies.map((m) => [m.id, m.title]));
      
      // Add movie titles to showtimes
      const showtimesWithMovies = showtimesRes.data.showtimes.map((s) => ({
        ...s,
        movieTitle: movieMap.get(s.movieId) || 'Unknown Movie',
      }));
      
      setShowtimes(showtimesWithMovies);
      setMovies(moviesRes.data.movies);
      setTotalPages(showtimesRes.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch showtimes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShowtimes();
  }, [page]);

  const openCreateDialog = () => {
    setEditingShowtime(null);
    setFormData(initialFormData);
    setError('');
    setDialogOpen(true);
  };

  const openEditDialog = (showtime: Showtime) => {
    setEditingShowtime(showtime);
    setFormData({
      movieId: showtime.movieId,
      showDate: showtime.showDate.split('T')[0],
      showTime: showtime.showTime,
      price: showtime.price.toString(),
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        movieId: formData.movieId,
        showDate: formData.showDate,
        showTime: formData.showTime,
        price: parseFloat(formData.price),
      };

      if (editingShowtime) {
        await api.updateShowtime(editingShowtime.id, payload);
      } else {
        await api.createShowtime(payload);
      }

      setDialogOpen(false);
      fetchShowtimes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save showtime');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await api.deleteShowtime(id);
      setDeleteDialog(null);
      fetchShowtimes();
    } catch (err) {
      console.error('Failed to delete showtime:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Movie</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showtimes.map((showtime) => (
                  <TableRow key={showtime.id}>
                    <TableCell className="font-medium">{showtime.movieTitle}</TableCell>
                    <TableCell>{formatDate(showtime.showDate)}</TableCell>
                    <TableCell>{formatTime(showtime.showTime)}</TableCell>
                    <TableCell>${showtime.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(showtime)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog(showtime.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingShowtime ? 'Edit Showtime' : 'Add New Showtime'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="movieId">Movie *</Label>
                <Select
                  value={formData.movieId}
                  onValueChange={(value) => setFormData({ ...formData, movieId: value })}
                >
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
                    onChange={(e) => setFormData({ ...formData, showDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="showTime">Time *</Label>
                  <Input
                    id="showTime"
                    type="time"
                    value={formData.showTime}
                    onChange={(e) => setFormData({ ...formData, showTime: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.movieId}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingShowtime ? 'Save Changes' : 'Create Showtime'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Showtime</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this showtime? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
