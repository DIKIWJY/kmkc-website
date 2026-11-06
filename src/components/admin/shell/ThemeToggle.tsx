"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AdminTheme = "light" | "dark";

export default function ThemeToggle({ theme, onChange }: { theme: AdminTheme; onChange: (t: AdminTheme) => void }) {
  const dark = theme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onChange(dark ? "light" : "dark")}
      aria-label={dark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      title={dark ? "Tema terang" : "Tema gelap"}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}
