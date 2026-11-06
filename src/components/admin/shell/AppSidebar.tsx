"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV, isActive } from "../nav";
import UserMenu from "./UserMenu";

interface Props {
  email: string;
  unread: number;
  regOpen: boolean;
}

export default function AppSidebar({ email, unread, regOpen }: Props) {
  const path = usePathname();
  const { setOpenMobile } = useSidebar();
  const counts = { unread };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="KMKC · Dashboard">
              <Link
                href="/admin"
                onClick={() => setOpenMobile(false)}
                aria-label="KMKC Admin, ke Dashboard"
              >
                <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/15">
                  <Logo size={32} alt="" className="size-8 rounded-full" />
                </span>
                <span className="flex-1 truncate text-start text-base font-semibold leading-tight text-sidebar-accent-foreground">
                  KMKC
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV.map((g, i) => (
          <SidebarGroup key={g.title ?? i}>
            {g.title && <SidebarGroupLabel>{g.title}</SidebarGroupLabel>}
            <SidebarMenu>
              {g.items.map((it) => {
                const n = it.badge ? counts[it.badge] : 0;
                const active = isActive(path, it.href);
                return (
                  <SidebarMenuItem key={it.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={it.label}
                      className="data-[active=true]:[&>svg]:text-sidebar-primary"
                    >
                      <Link
                        href={it.href}
                        onClick={() => setOpenMobile(false)}
                        aria-current={active ? "page" : undefined}
                      >
                        <it.icon />
                        <span>{it.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {n > 0 && (
                      <SidebarMenuBadge className="rounded-full bg-sidebar-primary px-1.5 text-[11px] font-semibold text-sidebar-primary-foreground tabular-nums">
                        {n > 99 ? "99+" : n}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <Link
          href="/admin/pendaftar"
          onClick={() => setOpenMobile(false)}
          aria-label={`Pendaftaran anggota ${regOpen ? "dibuka" : "ditutup"}, buka halaman pendaftar`}
          className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent px-3 py-2.5 text-xs transition-colors hover:bg-white/12 group-data-[collapsible=icon]:hidden"
        >
          <span className="relative flex size-2 shrink-0" aria-hidden>
            {regOpen && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60" />
            )}
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                regOpen ? "bg-emerald-400" : "bg-slate-400",
              )}
            />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block">Pendaftaran anggota</span>
            <span className="block text-[13px] font-medium text-sidebar-accent-foreground">
              {regOpen ? "Sedang dibuka" : "Ditutup"}
            </span>
          </span>
          <ChevronRight className="size-4 opacity-60" />
        </Link>
        <UserMenu email={email} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
