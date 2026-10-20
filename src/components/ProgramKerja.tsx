"use client";

import { BookOpen, Share2, Trophy, Briefcase, Users, ArrowUpRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Program } from "@/lib/types";

const iconMap: Record<string, React.ElementType> = {
  "book-open": BookOpen,
  "share-2": Share2,
  trophy: Trophy,
  briefcase: Briefcase,
  users: Users,
};

const statusLabel: Record<string, string> = {
  upcoming: "Akan Datang",
  ongoing: "Berjalan",
  completed: "Selesai",
};

const statusStyle: Record<string, string> = {
  upcoming: "bg-sky-50 text-sky-700",
  ongoing: "bg-blue-50 text-blue-700",
  completed: "bg-slate-100 text-slate-600",
};

export default function ProgramKerja({ programs }: { programs: Program[] }) {
  if (programs.length === 0) return null;
  return (
    <section id="program" className="py-24 lg:py-32 bg-surface/70">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <SectionHeading
          title="Program Kerja"
          subtitle="Program-program yang kami jalankan untuk mengembangkan potensi anggota dan memberi dampak bagi masyarakat."
          className="mb-14"
        />

        <div className="grid md:grid-cols-2 gap-6">
          {programs.map((p) => {
            const Icon = iconMap[p.icon] || Briefcase;
            return (
              <div key={p.id} className="reveal soft-card group p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Icon size={26} className="text-primary" />
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusStyle[p.status]}`}>
                    {statusLabel[p.status]}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">{p.name}</h3>
                <p className="text-neutral-500 leading-relaxed mb-6">{p.description}</p>
                <div className="flex items-center justify-between pt-5 border-t border-border">
                  <span className="text-sm text-neutral-500">{p.division}</span>
                  <ArrowUpRight size={18} className="text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
