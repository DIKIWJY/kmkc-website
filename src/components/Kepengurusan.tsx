"use client";

import Photo from "@/components/ui/Photo";
import { useState } from "react";
import { User } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Member } from "@/lib/types";

interface KepengurusanProps {
  members: Member[];
}

export default function Kepengurusan({ members }: KepengurusanProps) {
  const divisions = Array.from(new Set(members.map((m) => m.division)));
  const [active, setActive] = useState("Semua");
  const filtered = active === "Semua" ? members : members.filter((m) => m.division === active);

  if (members.length === 0) return null;

  return (
    <section id="kepengurusan" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <SectionHeading
          title="Kepengurusan"
          subtitle={`Periode ${members[0]?.period || "2025/2026"}`}
          className="mb-10"
        />

        <div className="flex flex-wrap gap-2 mb-10 reveal">
          {["Semua", ...divisions].map((div) => (
            <button
              key={div}
              onClick={() => setActive(div)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                active === div
                  ? "bg-brand-gradient text-white shadow-md shadow-blue-500/25"
                  : "bg-white text-neutral-600 ring-1 ring-border hover:ring-accent/40 hover:text-accent"
              }`}
            >
              {div}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((m) => (
            <div key={m.id} className="reveal soft-card p-6 text-center">
              <div className="relative w-24 h-24 rounded-full mx-auto mb-5 overflow-hidden bg-primary/10 flex items-center justify-center ring-4 ring-white shadow-md">
                {m.photo_url ? (
                  <Photo src={m.photo_url} alt={m.name} sizes="96px" />
                ) : (
                  <User size={36} className="text-primary/60" />
                )}
              </div>
              <h3 className="font-bold text-neutral-900 leading-snug">{m.name}</h3>
              <p className="text-sm font-semibold text-accent mt-1">{m.position}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{m.division}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
