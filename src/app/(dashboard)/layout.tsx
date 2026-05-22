"use client";

import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import HamsterLoader from "@/components/ui/HamsterLoader";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      if (!pathname.startsWith("/signin") && !pathname.startsWith("/signup")) {
        router.push("/signin");
      }
    }
  }, [user, loading, router, pathname]);

  useEffect(() => {
    // Close mobile sidebar on route change
    setMobileOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-800">
        <HamsterLoader />
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* ── Mobile Header Bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center">
            <Image
              src="/images/logo-white.png"
              alt="QbLog"
              width={28}
              height={28}
              className="dark:hidden"
            />
            <Image
              src="/images/logo-black.png"
              alt="QbLog"
              width={28}
              height={28}
              className="hidden dark:block"
            />
          </div>
          <span className="text-[15px] font-semibold text-slate-800 tracking-tight">QbLog</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all duration-150"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Left Sidebar ── */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 transform lg:relative lg:translate-x-0 transition-transform duration-200 ease-in-out lg:z-20",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>

      {/* ── Mobile Backdrop ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 h-full relative flex flex-col overflow-hidden pt-14 lg:pt-0 bg-slate-50 min-w-0">
        {children}
      </div>

      {/* ── Right Sidebar ── */}
      <div className="hidden xl:block h-full flex-shrink-0">
        <RightSidebar />
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  );
}
