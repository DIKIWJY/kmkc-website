"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { crumbsOf } from "../nav";
import CommandMenu from "./CommandMenu";
import ThemeToggle, { type AdminTheme } from "./ThemeToggle";

export default function AdminHeader({ theme, onThemeChange }: { theme: AdminTheme; onThemeChange: (t: AdminTheme) => void }) {
  const crumbs = crumbsOf(usePathname());
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-5">
      <SidebarTrigger className="-ms-1" aria-label="Buka/tutup menu" />
      <Separator orientation="vertical" className="me-1 data-[orientation=vertical]:h-4" />
      <nav aria-label="Lokasi" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={c} className={cn("flex min-w-0 items-center gap-1.5", !last && "hidden sm:flex")}>
                {i > 0 && <ChevronRight className="hidden size-3.5 opacity-60 sm:block" aria-hidden />}
                <span className={cn(last && "truncate font-medium text-foreground")} aria-current={last ? "page" : undefined}>{c}</span>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="flex items-center gap-1">
        <CommandMenu />
        <ThemeToggle theme={theme} onChange={onThemeChange} />
        <Button asChild variant="outline" size="sm" className="ms-1 hidden md:inline-flex">
          <Link href="/" target="_blank">Lihat website <ArrowUpRight /></Link>
        </Button>
      </div>
    </header>
  );
}
