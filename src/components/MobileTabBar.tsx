"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Files, Sparkles, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Accueil", href: "/", icon: LayoutDashboard },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Nouveau", href: "/notes?new=true", icon: Plus, isPrimary: true },
  { name: "Fichiers", href: "/files", icon: Files },
  { name: "IA", href: "/ai", icon: Sparkles },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/" && !item.isPrimary);
          
          if (item.isPrimary) {
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className="flex flex-col items-center justify-center w-14 h-full relative -top-3"
              >
                <div className="h-12 w-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 border-[3px] border-background">
                  <item.icon className="h-6 w-6" />
                </div>
              </Link>
            )
          }

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors",
                isActive ? "text-blue-500" : "text-zinc-500 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "fill-blue-500/20")} />
              <span className="text-[10px] font-medium tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
