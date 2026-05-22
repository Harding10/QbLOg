"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, ChevronRight } from "lucide-react";
import Image from "next/image";

const NAV_ITEMS = [
  { name: "Dashboard",  href: "/dashboard",  icon: "/images/menu_droit_icon/tableau.webp" },
  { name: "Journal",    href: "/journal",    icon: "/images/menu_droit_icon/journal.webp" },
  { name: "Bugs",       href: "/bugs",       icon: "/images/menu_droit_icon/bugs.webp" },
  { name: "Fichiers",   href: "/files",      icon: "/images/menu_droit_icon/fichers.png" },
  { name: "Agenda",     href: "/agenda",     icon: "/images/menu_droit_icon/aganda.webp" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut: logout, user } = useAuth();

  const userInitial =
    user?.displayName?.charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    "?";

  return (
    <aside className="w-64 flex flex-col h-full relative z-20 bg-white border-r border-slate-200">

      {/* ── Logo / Brand ── */}
      <div className="h-[57px] flex items-center px-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0">
            <Image src="/images/logo-white.png" alt="QbLog" width={28} height={28} className="dark:hidden" />
            <Image src="/images/logo-black.png" alt="QbLog" width={28} height={28} className="hidden dark:block" />
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto gh-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium
                transition-all duration-150 ease-in-out
                ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent"
                }
              `}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <img
                  src={item.icon}
                  alt={item.name}
                  className={`w-4 h-4 flex-shrink-0 object-contain transition-opacity duration-150
                    ${isActive ? "opacity-100" : "opacity-50 group-hover:opacity-80"}`}
                />
                <span className="truncate">{item.name}</span>
              </span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Section ── */}
      <div className="mt-auto">

        {/* Important links */}
        <div className="px-3 pt-3 pb-1 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 px-1">
            Important links
          </p>
          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150"
          >
            <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
          <Link
            href="/help"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150"
          >
            <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help &amp; FAQ
          </Link>
        </div>

        {/* User card + Upgrade + Copyright */}
        <div className="px-3 pb-3 pt-2">
          <div className="border-t border-slate-100 mb-3" />

          {/* Card avec effet dégradé flou */}
          <div className="relative rounded-xl overflow-hidden border border-violet-100/80">

            {/* ── SVG Glow Background ── */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <svg
                className="absolute -bottom-6 -right-6 w-44 h-44 opacity-50"
                viewBox="0 0 300 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g filter="url(#sb_f0)">
                  <circle cx="200" cy="180" r="100" fill="#818CF8" />
                </g>
                <defs>
                  <filter id="sb_f0" x="0" y="0" width="400" height="400" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feGaussianBlur stdDeviation="60" />
                  </filter>
                </defs>
              </svg>
              <svg
                className="absolute -top-4 -left-4 w-36 h-36 opacity-40"
                viewBox="0 0 300 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g filter="url(#sb_f1)">
                  <circle cx="100" cy="100" r="90" fill="#C084FC" />
                </g>
                <defs>
                  <filter id="sb_f1" x="-100" y="-100" width="500" height="500" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feGaussianBlur stdDeviation="60" />
                  </filter>
                </defs>
              </svg>
              {/* Base white tint */}
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-3">
              {/* User row */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-[12px] font-bold text-white">{userInitial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 truncate leading-none mb-0.5">
                    {user?.displayName || "Utilisateur"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate leading-none">
                    {user?.email}
                  </p>
                </div>
                <span className="flex-shrink-0 text-[10px] font-semibold text-slate-500 border border-slate-300 rounded px-1.5 py-0.5 bg-white/80">
                  Free
                </span>
              </div>

              {/* Upgrade Plan */}
              <button
                className="
                  w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg
                  text-[13px] font-semibold text-white
                  bg-gradient-to-r from-violet-500 to-indigo-500
                  hover:from-violet-600 hover:to-indigo-600
                  shadow-md hover:shadow-lg
                  transition-all duration-200 ease-in-out active:scale-[0.98]
                "
              >
                Upgrade Plan
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>

              {/* Copyright */}
              <p className="text-center text-[10px] text-slate-400 mt-2.5">
                © {new Date().getFullYear()} All Right Reserved
              </p>
            </div>
          </div>
        </div>


        {/* Logout (lien discret) */}
        <button
          onClick={logout}
          className="
            flex items-center gap-2 mx-3 mb-2 px-2 py-1.5 rounded-md text-[11px] font-medium
            text-slate-300 hover:text-rose-500 hover:bg-rose-50
            transition-all duration-150 ease-in-out group
          "
        >
          <LogOut className="w-3 h-3 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
