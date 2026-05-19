'use client';

import * as React from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { UserProfileAvatar } from './UserProfileAvatar';

export function MobileProfileTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="md:hidden flex items-center justify-center h-9 w-9 rounded-full border border-border bg-accent/40 active:scale-95 transition-all shrink-0 focus-visible:outline-none"
      title="Ouvrir le menu"
    >
      <UserProfileAvatar className="h-full w-full border-none shadow-none" iconClassName="h-4 w-4" />
    </button>
  );
}
