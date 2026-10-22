import CempakaMark from "@/components/ui/CempakaMark";

/**
 * Pita teks raksasa yang berjalan tanpa henti (dua baris, arah berlawanan) dan miring tipis
 * mengikuti kecepatan scroll. Murni CSS + satu variabel dari <Motion/>; ringan di HP.
 */
export default function Marquee({ fullName }: { fullName: string }) {
  const words = [fullName, "Kekeluargaan", "Kontribusi untuk daerah", "Tumbuh bersama", "Cempaka"];
  const row = (rev: boolean) => (
    <div className={`mq-row ${rev ? "rev" : ""}`} data-skew>
      <div className="mq-track">
        {[0, 1].map((g) => (
          <ul key={g} aria-hidden={g === 1 ? true : undefined} className="mq-group">
            {words.map((w, i) => (
              <li key={`${g}-${i}`} className="mq-item">
                <span className={(i + (rev ? 1 : 0)) % 2 === 0 ? "mq-solid" : "mq-line"}>{w}</span>
                <CempakaMark className="mq-flower" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
  return (
    <div className="relative overflow-hidden bg-[#050f26] pb-20 pt-6 sm:pb-28" data-cursor="">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#050f26] to-transparent" />
      <p className="sr-only">{words.join(", ")}</p>
      <div aria-hidden className="select-none">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
