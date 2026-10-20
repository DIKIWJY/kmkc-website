"use client";

import Photo from "@/components/ui/Photo";
import { Megaphone, Sprout, Award, ImageIcon } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { renderBold } from "@/lib/rich";

interface AboutProps {
  about: string;
  photo?: string;
  name: string;
}

const values = [
  { icon: Megaphone, title: "Kekeluargaan", desc: "Rumah bersama bagi mahasiswa Cempaka di perantauan — saling menjaga dan menguatkan." },
  { icon: Sprout, title: "Kontribusi untuk Daerah", desc: "Kegiatan sosial dan pengabdian yang memberi manfaat nyata bagi masyarakat Cempaka." },
  { icon: Award, title: "Prestasi & Tumbuh", desc: "Mendorong anggota berprestasi, terus belajar, dan berkembang bersama." },
];

export default function About({ about, photo, name }: AboutProps) {
  const paragraphs = about.split("\n\n");
  return (
    <section id="about" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <SectionHeading title="Siapa Kami" className="mb-14 lg:mb-20" />

        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-20 items-center mb-20 lg:mb-28">
          {/* photo */}
          <div className="reveal relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-brand-gradient opacity-15 blur-2xl" />
            <div className="relative aspect-[3/2] rounded-[1.6rem] overflow-hidden shadow-[0_30px_70px_-24px_rgba(30,79,163,0.45)]">
              {photo ? (
                <Photo src={photo} alt={`Keluarga ${name}`} sizes="(max-width: 1024px) 100vw, 600px" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background:
                      "radial-gradient(circle at 25% 20%, rgba(255,255,255,0.3), transparent 45%), linear-gradient(145deg,#1b4799,#2f7fd8)",
                  }}
                >
                  <div className="text-center text-white/90">
                    <ImageIcon size={34} className="mx-auto mb-2 opacity-70" />
                    <p className="text-sm font-medium">Foto kebersamaan pengurus</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* text */}
          <div className="reveal">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight mb-6">
              Keluarga Mahasiswa{" "}
              <span className="text-gradient">Kecamatan Cempaka</span>
            </h3>
            <div className="space-y-5 text-[17px] leading-[1.8] text-neutral-500">
              {paragraphs.map((p, i) => (
                <p key={i}>{renderBold(p)}</p>
              ))}
            </div>
          </div>
        </div>

        {/* 3 value cards */}
        <div className="grid md:grid-cols-3 md:divide-x divide-border">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <div key={i} className="reveal px-0 md:px-10 first:md:pl-0 last:md:pr-0 py-8 md:py-2">
                <Icon size={34} strokeWidth={1.5} className="text-accent mb-5" />
                <h4 className="text-xl font-bold text-neutral-900 mb-3">{v.title}</h4>
                <p className="text-neutral-500 leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
