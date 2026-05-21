"use client";

import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import GeneratorWrapper from "@/components/generator/generator-wrapper";
import HamsterLoader from "@/components/ui/HamsterLoader";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      if (!pathname.startsWith("/signin") && !pathname.startsWith("/signup")) {
        router.push("/signin");
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-primary text-gray-800 dark:text-white">
        <HamsterLoader />
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <GeneratorWrapper>
      <div className="w-full h-full relative flex flex-col overflow-hidden">
        {children}
      </div>
    </GeneratorWrapper>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  );
}
