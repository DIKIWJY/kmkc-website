export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Memuat">
      <div className="ad-skel mb-8 h-9 w-56" />
      <div className="ad-skel mb-6 h-32 w-full" style={{ borderRadius: 14 }} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="ad-skel h-72 lg:col-span-2" style={{ borderRadius: 14 }} />
        <div className="ad-skel h-72" style={{ borderRadius: 14 }} />
      </div>
    </div>
  );
}
