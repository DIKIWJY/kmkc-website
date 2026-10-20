import Logo from "@/components/ui/Logo";

export default function Footer({ name, fullName }: { name: string; fullName: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-primary-dark text-white/65 py-8">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-3">
            <Logo size={40} mono />
            <span>&copy; {year} {name} — {fullName}</span>
          </span>
          <a href="/admin" className="text-white/50 hover:text-white/80 transition-colors text-xs">Admin</a>
        </div>
      </div>
    </footer>
  );
}
