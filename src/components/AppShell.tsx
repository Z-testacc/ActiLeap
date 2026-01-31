'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Dumbbell,
  BarChart3,
  Users,
  Settings,
} from 'lucide-react';
import type { NavItem } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getImageData } from '@/lib/placeholder-images';
import { LogWorkoutDialog } from '@/components/LogWorkoutDialog';
import { BottomNav } from './BottomNav';
import { FloatingActionButton } from './FloatingActionButton';

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);

  // Determine the page title based on the current path
  const allNavItems = [
    ...navItems,
    { href: '/nutrition', label: 'Nutrition' },
    { href: '/mentorship', label: 'Mentorship' },
    { href: '/recommendations', label: 'AI Coach' },
    { href: '/challenges/create', label: 'New Challenge' },
    { href: '/group-workouts', label: 'Group Workouts' },
    { href: '/profile', label: 'Profile' },
  ];
  
  let pageTitle = 'Dashboard';
  const currentPath = allNavItems.find(item => {
      if (item.href === '/') return pathname === '/';
      return pathname.startsWith(item.href);
  });
  
  if (pathname.startsWith('/workouts/')) {
    pageTitle = 'Workout';
  } else if (currentPath?.label) {
    pageTitle = currentPath.label;
  } else if (pathname === '/') {
    pageTitle = 'Dashboard';
  }

  return (
    <div className="flex flex-col h-full">
      <LogWorkoutDialog
        open={isLogDialogOpen}
        onOpenChange={setIsLogDialogOpen}
      />
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
        <div className="flex-1">
          <h1 className="text-xl font-semibold md:text-2xl">{pageTitle}</h1>
        </div>
        <Link href="/profile" aria-label="View Profile">
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage
              src={getImageData('user-avatar').imageUrl}
              data-ai-hint={getImageData('user-avatar').imageHint}
              alt="User Avatar"
            />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Link>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        {children}
      </main>
      <FloatingActionButton onClick={() => setIsLogDialogOpen(true)} />
      <BottomNav items={navItems} />
    </div>
  );
}
