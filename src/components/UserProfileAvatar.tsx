
'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
import { User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface UserProfileAvatarProps {
  className?: string;
  iconClassName?: string;
}

export function UserProfileAvatar({ className, iconClassName }: UserProfileAvatarProps) {
  const { user, loading } = useUser();
  
  if (loading) {
    return <div className={cn("rounded-full bg-white/5 animate-pulse", className)} />;
  }

  return (
    <div className={cn("rounded-full bg-white/10 border border-white/5 overflow-hidden relative flex items-center justify-center shrink-0", className)}>
      {user?.photoURL ? (
        <Image 
          src={user.photoURL} 
          alt="Avatar" 
          fill 
          className="object-cover" 
          unoptimized 
        />
      ) : (
        <UserIcon className={cn("text-white/50", iconClassName)} />
      )}
    </div>
  );
}
