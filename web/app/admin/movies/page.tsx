'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Movie, MovieStatus } from '@/lib/types';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

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

interface MovieFormData {
    title: string;
    description: string;
    durationMinutes: string;
    genre: string;
    posterUrl: string;
    status: string;
    releaseDate: string;
}

const initialFormData: MovieFormData = {
    title: '',
    description: '',
    durationMinutes: '',
    genre: '',
    posterUrl: '',
    status: 'coming_soon',
    releaseDate: '',
};

export default function AdminMoviesPage() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
    const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
    const [formData, setFormData] = useState<MovieFormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchMovies = async () => {
        setIsLoading(true);
        try {
            const response = await api.getMovies({ page, limit: 10 });
            setMovies(response.data.movies);
            setTotalPages(response.data.totalPages);
        } catch (err) {
            console.error('Failed to fetch movies:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, [page]);

    const openCreateDialog = () => {
        setEditingMovie(null);
        setFormData(initialFormData);
        setError('');
        setDialogOpen(true);
    };

    const openEditDialog = (movie: Movie) => {
        setEditingMovie(movie);
        setFormData({
            title: movie.title,
            description: movie.description || '',
            durationMinutes: movie.durationMinutes.toString(),
            genre: movie.genre || '',
            posterUrl: movie.posterUrl || '',
            status: movie.status,
            releaseDate: movie.releaseDate ? movie.releaseDate.split('T')[0] : '',
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
                title: formData.title,
                description: formData.description || undefined,
                durationMinutes: parseInt(formData.durationMinutes, 10),
                genre: formData.genre || undefined,
                posterUrl: formData.posterUrl || undefined,
                status: formData.status,
                releaseDate: new Date(formData.releaseDate).toISOString() || undefined,
            };

            if (editingMovie) {
                await api.updateMovie(editingMovie.id, payload);
            } else {
                await api.createMovie(payload);
            }

            setDialogOpen(false);
            fetchMovies();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save movie');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        setIsSubmitting(true);
        try {
            await api.deleteMovie(id);
            setDeleteDialog(null);
            fetchMovies();
        } catch (err) {
            console.error('Failed to delete movie:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Movies</h1>
                    <p className="text-muted-foreground">Manage your movie catalog</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Movie
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
                                    <TableHead>Title</TableHead>
                                    <TableHead>Genre</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movies.map((movie) => (
                                    <TableRow key={movie.id}>
                                        <TableCell className="font-medium">{movie.title}</TableCell>
                                        <TableCell>{movie.genre || '-'}</TableCell>
                                        <TableCell>{movie.durationMinutes} min</TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[movie.status]}>
                                                {statusLabels[movie.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(movie)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteDialog(movie.id)}
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
                            {editingMovie ? 'Edit Movie' : 'Add New Movie'}
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
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="durationMinutes">Duration (min) *</Label>
                                    <Input
                                        id="durationMinutes"
                                        type="number"
                                        min="1"
                                        value={formData.durationMinutes}
                                        onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="genre">Genre</Label>
                                    <Input
                                        id="genre"
                                        value={formData.genre}
                                        onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="posterUrl">Poster URL</Label>
                                <Input
                                    id="posterUrl"
                                    type="url"
                                    value={formData.posterUrl}
                                    onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="coming_soon">Coming Soon</SelectItem>
                                            <SelectItem value="now_showing">Now Showing</SelectItem>
                                            <SelectItem value="ended">Ended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="releaseDate">Release Date</Label>
                                    <Input
                                        id="releaseDate"
                                        type="date"
                                        value={formData.releaseDate}
                                        onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingMovie ? 'Save Changes' : 'Create Movie'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Movie</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground">
                        Are you sure you want to delete this movie? This action cannot be undone.
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
