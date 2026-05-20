'use client';

import { LayoutDashboard, BookOpen, UploadCloud, Bug, Code, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    icon: <LayoutDashboard className="w-5 h-5 ml-1" />,
  },
  {
    href: '/journal',
    label: 'Journal Tech',
    icon: <BookOpen className="w-5 h-5 ml-1" />,
  },
  {
    href: '/files',
    label: 'Fichiers',
    icon: <UploadCloud className="w-5 h-5 ml-1" />,
  },
  {
    href: '/bugs',
    label: 'Suivi des Bugs',
    icon: <Bug className="w-5 h-5 ml-1" />,
  },
  {
    href: '/vault',
    label: 'Code Vault',
    icon: <Code className="w-5 h-5 ml-1" />,
  },
  {
    href: '/agenda',
    label: 'Agenda',
    icon: <Calendar className="w-5 h-5 ml-1" />,
  },
];

export default function GeneratorSidebarNav() {
  const pathname = usePathname();

  return (
    <div className="px-5 py-6">
      <h2 className="text-xs font-medium text-gray-400 dark:text-gray-400 capitalize tracking-wider">
        Products
      </h2>
      <nav className="mt-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.includes(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex gap-1.5 items-center h-11 px-2 py-3 text-sm font-medium rounded-full transition',
                isActive
                  ? 'bg-gray-100 dark:bg-white/5 dark:text-white/90 text-gray-800'
                  : 'dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white/90 text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
