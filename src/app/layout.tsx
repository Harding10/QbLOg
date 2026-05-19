import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SpotlightSearch } from "@/components/SpotlightSearch";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { UserProfileAvatar } from "@/components/UserProfileAvatar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileProfileTrigger } from "@/components/MobileProfileTrigger";
import { MobileTabBar } from "@/components/MobileTabBar";
import { NotificationCenter } from "@/components/NotificationCenter";
import Link from "next/link";
import { Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: 'QbLog | Second Cerveau pour Développeurs',
  description: 'Organisez vos extraits de code, vos bugs et vos connaissances dans un espace de travail futuriste.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <FirebaseClientProvider>
            <FirebaseErrorListener />
            <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col min-h-screen bg-transparent overflow-x-hidden">
              <header className="sticky top-0 z-40 flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-white/5 bg-background/70 backdrop-blur-2xl px-3 md:px-6">
                <div className="hidden md:flex items-center gap-1 md:gap-2">
                  <SidebarTrigger className="text-white hover:bg-white/10 h-10 w-10 rounded-xl" />
                  <div className="h-6 w-px bg-white/10 mx-1 hidden md:block" />
                </div>
                {/* Clickable Mobile profile avatar opens the left menu sidebar drawer */}
                <MobileProfileTrigger />

                <div className="flex flex-1 items-center gap-2 overflow-hidden px-1">
                  <SpotlightSearch />
                </div>
                <div className="flex items-center gap-3 md:gap-4 shrink-0 pr-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] hidden lg:inline-block">v1.0.0</span>
                  <Link href="/agenda" className="md:hidden text-zinc-500 hover:text-white h-9 w-9 rounded-xl flex items-center justify-center border border-white/5 bg-white/5 hover:bg-white/10 transition-all" title="Agenda & Rappels">
                    <Calendar className="h-4.5 w-4.5" />
                  </Link>
                  <NotificationCenter />
                  <ThemeToggle />
                  <UserProfileAvatar className="h-9 w-9 border-white/10 shadow-lg hidden md:block" iconClassName="h-4 w-4" />
                </div>
              </header>
              <main className="flex-1 p-3 pb-24 md:p-6 lg:p-10 overflow-x-hidden">
                {children}
              </main>
              <MobileTabBar />
            </SidebarInset>
            </SidebarProvider>
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
