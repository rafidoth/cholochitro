'use client';

import Link from 'next/link';
import { memo, useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Film, LogOut, Ticket, Settings } from 'lucide-react';

// Hoisted static JSX elements
const logo = (
    <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Film className="h-5 w-5 text-primary" />
        </div>
        <span className="tracking-tight">Cholochitro</span>
    </Link>
);

const loadingAvatar = (
    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
);

const authButtons = (
    <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
            <Link href="/auth/login">Log in</Link>
        </Button>
        <Button asChild>
            <Link href="/auth/register">Sign up</Link>
        </Button>
    </div>
);

// Helper function hoisted to module level
function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Memoized nav link component
const NavLink = memo(function NavLink({
    href,
    children
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
            {children}
        </Link>
    );
});

// Memoized user menu component
const UserMenu = memo(function UserMenu({
    displayName,
    email,
    initials,
    isAdmin,
    onLogout,
}: {
    displayName: string;
    email: string;
    initials: string;
    isAdmin: boolean;
    onLogout: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/bookings" className="cursor-pointer">
                        <Ticket className="mr-2 h-4 w-4" />
                        My Bookings
                    </Link>
                </DropdownMenuItem>
                {isAdmin ? (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/admin/movies" className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                Admin Panel
                            </Link>
                        </DropdownMenuItem>
                    </>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

export function Header() {
    const { user, isAuthenticated, logout, isLoading } = useAuth();
    // Track client-side mount to prevent hydration mismatch
    // Auth state is inherently client-only, so we show loading during SSR
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const handleLogout = useCallback(async () => {
        await logout();
    }, [logout]);

    const initials = user?.displayName ? getInitials(user.displayName) : 'U';
    const isAdmin = user?.role === 'admin';

    // Show loading state during SSR and initial client render to match
    const showLoading = !hasMounted || isLoading;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 flex justify-center">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                    {logo}
                    <nav className="hidden md:flex items-center gap-4">
                        <NavLink href="/movies">Movies</NavLink>
                        {hasMounted && isAuthenticated ? (
                            <NavLink href="/bookings">My Bookings</NavLink>
                        ) : null}
                        {hasMounted && isAdmin ? (
                            <NavLink href="/admin/movies">Admin</NavLink>
                        ) : null}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {showLoading ? (
                        loadingAvatar
                    ) : isAuthenticated ? (
                        <UserMenu
                            displayName={user?.displayName || 'User'}
                            email={user?.email || ''}
                            initials={initials}
                            isAdmin={isAdmin}
                            onLogout={handleLogout}
                        />
                    ) : (
                        authButtons
                    )}
                </div>
            </div>
        </header>
    );
}
