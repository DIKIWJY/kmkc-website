import CempakaMark from "@/components/ui/CempakaMark";

/** Tirai pembuka (hanya kunjungan pertama ke beranda dalam satu sesi; diatur oleh skrip di <head>). */
export default function Intro() {
  return (
    <div className="m-curtain" aria-hidden>
      <CempakaMark draw className="m-curtain-flower" />
      <span className="m-curtain-word">KMKC</span>
    </div>
  );
}
