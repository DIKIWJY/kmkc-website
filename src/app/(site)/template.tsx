/** Isi halaman memudar-naik setiap berpindah halaman (navbar & footer tetap). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
