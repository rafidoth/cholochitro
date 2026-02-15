'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AdminSidebar } from '@/components/admin-sidebar';
import { Loader2 } from 'lucide-react';

// Hoisted static loading spinner
const loadingSpinner = (
  <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  // Track client-side mount to prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && !isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
    }
  }, [hasMounted, isLoading, isAuthenticated, user, router]);

  // Show loading state during SSR and initial client render to match
  if (!hasMounted || isLoading) {
    return loadingSpinner;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
