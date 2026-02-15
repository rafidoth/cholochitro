'use client';

import { useState, useCallback, memo, useMemo } from 'react';
import { useMovies, useCreateMovie, useUpdateMovie, useDeleteMovie } from '@/hooks';
import type { Movie } from '@/lib/types';
import { MOVIE_STATUS_COLORS, MOVIE_STATUS_LABELS } from '@/lib/types';
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

// Form data interface
interface MovieFormData {
    title: string;
    description: string;
    durationMinutes: string;
    genre: string;
    posterUrl: string;
    status: string;
    releaseDate: string;
}

// Hoisted initial form data constant
const INITIAL_FORM_DATA: MovieFormData = {
    title: '',
    description: '',
    durationMinutes: '',
    genre: '',
    posterUrl: '',
    status: 'coming_soon',
    releaseDate: '',
} as const;

const SKELETON_COUNT = 5;

// Memoized table header
const tableHeader = (
    <TableHeader>
        <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
        </TableRow>
    </TableHeader>
);

// Memoized MovieRow component
interface MovieRowProps {
    movie: Movie;
    onEdit: (movie: Movie) => void;
    onDelete: (id: string) => void;
}

const MovieRow = memo(function MovieRow({ movie, onEdit, onDelete }: MovieRowProps) {
    const handleEdit = useCallback(() => onEdit(movie), [movie, onEdit]);
    const handleDelete = useCallback(() => onDelete(movie.id), [movie.id, onDelete]);

    return (
        <TableRow>
            <TableCell className="font-medium">{movie.title}</TableCell>
            <TableCell>{movie.genre || '-'}</TableCell>
            <TableCell>{movie.durationMinutes} min</TableCell>
            <TableCell>
                <Badge className={MOVIE_STATUS_COLORS[movie.status]}>
                    {MOVIE_STATUS_LABELS[movie.status]}
                </Badge>
            </TableCell>
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

export default function AdminMoviesPage() {
    const [page, setPage] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
    const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
    const [formData, setFormData] = useState<MovieFormData>(INITIAL_FORM_DATA);
    const [error, setError] = useState('');

    // TanStack Query hooks
    const { data: moviesData, isLoading } = useMovies({ page, limit: 10 });
    const createMutation = useCreateMovie();
    const updateMutation = useUpdateMovie();
    const deleteMutation = useDeleteMovie();

    const movies = moviesData?.data.movies ?? [];
    const totalPages = moviesData?.data.totalPages ?? 1;

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    // Memoized callbacks
    const openCreateDialog = useCallback(() => {
        setEditingMovie(null);
        setFormData(INITIAL_FORM_DATA);
        setError('');
        setDialogOpen(true);
    }, []);

    const openEditDialog = useCallback((movie: Movie) => {
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
                title: formData.title,
                description: formData.description || undefined,
                durationMinutes: parseInt(formData.durationMinutes, 10),
                genre: formData.genre || undefined,
                posterUrl: formData.posterUrl || undefined,
                status: formData.status,
                releaseDate: formData.releaseDate ? new Date(formData.releaseDate).toISOString() : undefined,
            };

            if (editingMovie) {
                await updateMutation.mutateAsync({ id: editingMovie.id, movie: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }

            setDialogOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save movie');
        }
    }, [formData, editingMovie, updateMutation, createMutation]);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id);
            setDeleteDialog(null);
        } catch (err) {
            console.error('Failed to delete movie:', err);
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
    const handleFieldChange = useCallback((field: keyof MovieFormData) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    }, []);

    const handleStatusChange = useCallback((value: string) => {
        setFormData((prev) => ({ ...prev, status: value }));
    }, []);

    // Memoize error alert to avoid recreating on every render
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
                    <h1 className="text-2xl font-bold">Movies</h1>
                    <p className="text-muted-foreground">Manage your movie catalog</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Movie
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
                                {movies.map((movie) => (
                                    <MovieRow
                                        key={movie.id}
                                        movie={movie}
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
                            {editingMovie ? 'Edit Movie' : 'Add New Movie'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            {errorAlert}
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={handleFieldChange('title')}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={handleFieldChange('description')}
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
                                        onChange={handleFieldChange('durationMinutes')}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="genre">Genre</Label>
                                    <Input
                                        id="genre"
                                        value={formData.genre}
                                        onChange={handleFieldChange('genre')}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="posterUrl">Poster URL</Label>
                                <Input
                                    id="posterUrl"
                                    type="url"
                                    value={formData.posterUrl}
                                    onChange={handleFieldChange('posterUrl')}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={formData.status} onValueChange={handleStatusChange}>
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
                                        onChange={handleFieldChange('releaseDate')}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDialog}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {editingMovie ? 'Save Changes' : 'Create Movie'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteDialog} onOpenChange={closeDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Movie</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground">
                        Are you sure you want to delete this movie? This action cannot be undone.
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
