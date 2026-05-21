"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { name: "Tableau de bord", href: "/dashboard", icon: "/images/menu_droit_icon/tableau.webp" },
  { name: "Journal Tech", href: "/journal", icon: "/images/menu_droit_icon/journal.webp" },
  { name: "Fichiers", href: "/files", icon: "/images/menu_droit_icon/fichers.png" },
  { name: "Suivi des Bugs", href: "/bugs", icon: "/images/menu_droit_icon/bugs.webp" },
  { name: "Code Vault", href: "/vault", icon: "/images/menu_droit_icon/code.webp" },
  { name: "Agenda", href: "/agenda", icon: "/images/menu_droit_icon/aganda.webp" },
  { name: "Suivi des Addictions", href: "/addictions", icon: "/images/menu_droit_icon/adition.webp" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut: logout, user } = useAuth();

  return (
    <aside className="w-64 bg-[#1A2231]/80 backdrop-blur-xl border-r border-white/10 flex flex-col h-full relative z-20">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-btn rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(114,92,255,0.4)]">
            <span className="text-white font-bold">Qb</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">QbLog</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
                isActive
                  ? "gradient-btn shadow-lg text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <img
                src={item.icon}
                alt={item.name}
                className={`flex-shrink-0 w-5 h-5 mr-3 transition-colors ${
                  isActive ? "" : "opacity-60 group-hover:opacity-100"
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center px-3 py-3 mb-2 rounded-xl bg-white/5 border border-white/5">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold mr-3 border border-blue-500/30">
            {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.displayName || "Utilisateur"}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-slate-400 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-colors group"
        >
          <LogOut className="flex-shrink-0 w-5 h-5 mr-3 text-slate-500 group-hover:text-rose-400 transition-colors" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
