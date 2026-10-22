/**
 * Ornamen garis bunga cempaka (kamboja) — dipakai sebagai latar halus di panel merek.
 * Murni SVG statis (tanpa animasi/blur) sehingga ringan di perangkat apa pun.
 */
export default function CempakaMark({ className = "", draw = false }: { className?: string; draw?: boolean }) {
  const petal = "M0 0 C 26 -34 30 -92 4 -132 C -24 -96 -26 -36 0 0 Z";
  const layers = [
    { s: 1, r: 0, o: 0.34 },
    { s: 0.82, r: 36, o: 0.26 },
    { s: 0.62, r: 12, o: 0.22 },
    { s: 0.4, r: 48, o: 0.2 },
  ];
  return (
    <svg viewBox="-150 -150 300 300" className={className} fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden>
      {layers.map((l, li) =>
        [0, 72, 144, 216, 288].map((a) => (
          <path
            key={`${li}-${a}`}
            d={petal}
            {...(draw ? { pathLength: 1, className: "draw-path", style: { "--k": li * 5 + a / 72 } as React.CSSProperties } : {})}
            strokeWidth={li === 0 ? 1.1 : 0.9}
            opacity={l.o}
            transform={`rotate(${a + l.r}) scale(${l.s})`}
          />
        )),
      )}
      {[7, 15, 26].map((r) => (
        <circle key={r} r={r} strokeWidth="0.8" opacity={0.3} {...(draw ? { pathLength: 1, className: "draw-path", style: { "--k": 22 } as React.CSSProperties } : {})} />
      ))}
    </svg>
  );
}
