"use client";

import { useCallback, useState } from "react";
import { ADMIN_ROOT_ID } from "@/lib/portal";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import AdminHeader from "./AdminHeader";
import AppSidebar from "./AppSidebar";
import type { AdminTheme } from "./ThemeToggle";

interface Props {
  email: string;
  unread: number;
  regOpen: boolean;
  defaultOpen: boolean;
  initialTheme: AdminTheme;
  children: React.ReactNode;
}

/** Kerangka panel admin: sidebar shadcn, header lengket, area konten, dan notifikasi. */
export default function AdminShell({ email, unread, regOpen, defaultOpen, initialTheme, children }: Props) {
  const [theme, setThemeState] = useState<AdminTheme>(initialTheme);

  // Kelas `dark` ada di pembungkus #admin-root (dirender server dari cookie, jadi tanpa kedip saat dimuat).
  const setTheme = useCallback((t: AdminTheme) => {
    setThemeState(t);
    document.getElementById(ADMIN_ROOT_ID)?.classList.toggle("dark", t === "dark");
    document.cookie = `admin-theme=${t}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <a
        href="#konten"
        className="sr-only z-[100] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Lompat ke konten
      </a>
      <AppSidebar email={email} unread={unread} regOpen={regOpen} />
      <SidebarInset className="min-w-0">
        <AdminHeader theme={theme} onThemeChange={setTheme} />
        <main id="konten" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </main>
      </SidebarInset>
      <Toaster theme={theme} closeButton position="bottom-right" />
    </SidebarProvider>
  );
}
