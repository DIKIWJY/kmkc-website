import type { CSSProperties, ElementType } from "react";

type Mode = "words" | "fill";

/**
 * Teks yang dipecah per kata (server component, tanpa JS sendiri):
 *  - "words": tiap kata naik dari balik topeng saat elemen masuk layar (dikendalikan <Motion/>)
 *  - "fill":  kata terisi warna satu per satu mengikuti scroll; **tebal** didukung
 * Teks aslinya tetap utuh untuk pembaca layar (aria-label) dan saat JS/animasi mati.
 */
export default function Split({
  as: Tag = "span",
  text,
  mode = "words",
  className = "",
  delay,
}: {
  as?: ElementType;
  text: string;
  mode?: Mode;
  className?: string;
  delay?: number;
}) {
  if (mode === "fill") {
    const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    const words: { w: string; b: boolean }[] = [];
    for (const p of parts) {
      const b = p.startsWith("**") && p.endsWith("**") && p.length > 4;
      const t = b ? p.slice(2, -2) : p;
      t.split(/\s+/).filter(Boolean).forEach((w) => words.push({ w, b }));
    }
    const plain = words.map((x) => x.w).join(" ");
    return (
      <Tag data-scrub-words className={`fill-words ${className}`} aria-label={plain}>
        {words.map((x, i) => (
          <span key={i} aria-hidden>
            <span className={`fw${x.b ? " b" : ""}`} style={{ "--k": (i + 1) / words.length } as CSSProperties}>
              {x.w}
            </span>{" "}
          </span>
        ))}
      </Tag>
    );
  }

  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag data-a="split" data-d={delay} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden>
          <span className="sw">
            <i style={{ "--i": i } as CSSProperties}>{w}</i>
          </span>{" "}
        </span>
      ))}
    </Tag>
  );
}
