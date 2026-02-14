'use client';

import Link from 'next/link';
import { memo } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Film, Calendar, Ticket, LayoutDashboard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Hoisted static navigation data to module level
const adminLinks = [
  { href: '/admin/movies', label: 'Movies', icon: Film },
  { href: '/admin/showtimes', label: 'Showtimes', icon: Calendar },
  { href: '/admin/bookings', label: 'Bookings', icon: Ticket },
] as const;

// Hoisted static header JSX
const sidebarHeader = (
  <div className="flex items-center gap-2 mb-6 px-2">
    <LayoutDashboard className="h-5 w-5" />
    <span className="font-semibold">Admin Panel</span>
  </div>
);

// Memoized navigation link component
const NavLink = memo(function NavLink({
  href,
  label,
  Icon,
  isActive,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
});

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r min-h-[calc(100vh-4rem)] p-4">
      {sidebarHeader}
      <nav className="space-y-1">
        {adminLinks.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            label={link.label}
            Icon={link.icon}
            isActive={pathname === link.href}
          />
        ))}
      </nav>
    </div>
  );
}
