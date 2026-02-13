'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Film, Calendar, Ticket, LayoutDashboard } from 'lucide-react';

const adminLinks = [
  { href: '/admin/movies', label: 'Movies', icon: Film },
  { href: '/admin/showtimes', label: 'Showtimes', icon: Calendar },
  { href: '/admin/bookings', label: 'Bookings', icon: Ticket },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r min-h-[calc(100vh-4rem)] p-4">
      <div className="flex items-center gap-2 mb-6 px-2">
        <LayoutDashboard className="h-5 w-5" />
        <span className="font-semibold">Admin Panel</span>
      </div>
      <nav className="space-y-1">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
