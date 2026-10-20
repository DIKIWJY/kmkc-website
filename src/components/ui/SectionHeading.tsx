interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  dark?: boolean;
  className?: string;
}

/* Thick vertical bar + big bold heading, the signature header of the reference site. */
export default function SectionHeading({ title, subtitle, dark = false, className = "" }: SectionHeadingProps) {
  return (
    <div className={`reveal ${className}`}>
      <div className={`section-accent-bar ${dark ? "on-dark" : ""}`}>
        <h2 className="text-4xl sm:text-5xl font-extrabold leading-[1.15] tracking-tight py-1">
          {dark ? <span className="text-white">{title}</span> : <span className="text-gradient">{title}</span>}
        </h2>
      </div>
      {subtitle && (
        <p className={`mt-4 max-w-2xl ${dark ? "text-white/70" : "text-muted"}`}>{subtitle}</p>
      )}
    </div>
  );
}
