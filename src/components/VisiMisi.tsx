"use client";

import { Users, HeartHandshake, Sprout, Network, Award, Lightbulb } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { renderBold } from "@/lib/rich";

interface VisiMisiProps {
  vision: string;
  mission: string[];
}

const icons = [Users, HeartHandshake, Sprout, Network, Award, Lightbulb];

export default function VisiMisi({ vision, mission }: VisiMisiProps) {
  return (
    <>
      {/* Visi */}
      <section id="visi-misi" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <SectionHeading title="Visi Kami" className="mb-12 lg:mb-16" />
          <p className="reveal text-2xl sm:text-[1.9rem] leading-[1.55] text-neutral-500 max-w-6xl">
            {renderBold(vision, "font-bold text-neutral-700")}
          </p>
        </div>
      </section>

      {/* Misi — solid royal blue band */}
      <section className="relative gradient-section py-24 lg:py-28 overflow-hidden">
        {/* big decorative circles bottom-right */}
        <div className="absolute -bottom-40 -right-24 w-[34rem] h-[34rem] rounded-full bg-white/[0.06] animate-float-alt" />
        <div className="absolute -bottom-32 right-24 w-[18rem] h-[18rem] rounded-full bg-sky-300/10 animate-float" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-10">
          <SectionHeading title="Misi Kami" dark className="mb-12 lg:mb-14" />

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-7">
            {mission.slice(0, 6).map((m, i) => {
              const Icon = icons[i % icons.length];
              return (
                <div
                  key={i}
                  className="reveal group bg-white rounded-xl shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] px-8 py-7 flex items-center gap-6 min-h-[128px] hover:-translate-y-1.5 hover:shadow-[0_22px_44px_-14px_rgba(0,0,0,0.45)] transition-all duration-300"
                >
                  <Icon size={52} strokeWidth={1.7} className="shrink-0 text-primary group-hover:scale-110 transition-transform" />
                  <p className="flex-1 text-center text-[17px] leading-relaxed text-neutral-600">{m}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
