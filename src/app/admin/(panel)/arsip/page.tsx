import Link from "next/link";
import { Download, Users } from "lucide-react";
import { getAdmin } from "@/lib/admin/guard";
import { PageHeader, Section, Card, Badge } from "@/components/admin/ui";
import ArchiveBuilder from "@/components/admin/ArchiveBuilder";
import PurgeProofs from "@/components/admin/PurgeProofs";
import { fmtBytes } from "@/lib/admin/archive-shared";

export const metadata = { title: "Arsip & Cadangan" };

// Batas paket gratis Supabase (cek angka terbaru di dashboard Supabase → Usage).
const DB_LIMIT = 500 * 1024 ** 2;
const STORAGE_LIMIT = 1024 ** 3;

interface Usage { db_bytes: number; buckets: { bucket: string; files: number; bytes: number }[] }

function Meter({ label, used, limit, note }: { label: string; used: number; limit: number; note?: string }) {
  const pct = Math.min(100, (used / limit) * 100);
  const warn = pct >= 70;
  return (
    <div className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[15px] font-medium">{label}</p>
        <p className="text-[14px] text-[var(--ad-mute)] tnum"><b className="font-semibold text-[var(--ad-ink)]">{fmtBytes(used)}</b> dari {fmtBytes(limit)}</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.07)]" role="img" aria-label={`${label}: ${pct.toFixed(0)}% terpakai`}>
        <div className={`h-full rounded-full ${warn ? "bg-[var(--ad-red)]" : "bg-[var(--ad-blue)]"}`} style={{ width: `${Math.max(1.5, pct)}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-[12.5px] text-[var(--ad-faint)]">
        <span>{note}</span>
        {warn && <Badge tone="red">Hampir penuh</Badge>}
      </div>
    </div>
  );
}

export default async function ArsipPage() {
  const { supabase } = await getAdmin();
  const { data } = await supabase.rpc("admin_usage");
  const usage = (data ?? null) as Usage | null;
  const bucket = (n: string) => usage?.buckets.find((b) => b.bucket === n) ?? { bucket: n, files: 0, bytes: 0 };
  const media = bucket("media");
  const bukti = bucket("bukti");
  const storageUsed = (usage?.buckets ?? []).reduce((a, b) => a + b.bytes, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-9 pb-16">
      <PageHeader title="Arsip & cadangan" subtitle="Simpan data ke PDF sebelum penyimpanan penuh, dan pantau pemakaian paket gratis Supabase." />

      <Section title="Pemakaian penyimpanan" hint="Angka dibaca langsung dari database.">
        {usage ? (
          <Card className="ad-divide">
            <Meter label="Database" used={usage.db_bytes} limit={DB_LIMIT} note="Teks: berita, pendaftar, pesan, statistik" />
            <Meter label="Storage (foto & bukti)" used={storageUsed} limit={STORAGE_LIMIT} note={`Foto website ${fmtBytes(media.bytes)} · ${media.files} berkas  |  Bukti follow ${fmtBytes(bukti.bytes)} · ${bukti.files} berkas`} />
          </Card>
        ) : (
          <Card className="p-5 text-[14px] text-[var(--ad-mute)]">
            Pemakaian belum bisa dibaca. Jalankan ulang <code className="rounded bg-[var(--ad-fill)] px-1">supabase/schema.sql</code> di SQL Editor (aman diulang) untuk mengaktifkan bagian ini.
          </Card>
        )}
      </Section>

      <Section title="Laporan PDF" hint="Laporan bersampul, rapi untuk dicetak, siap diarsipkan atau diserahkan ke senat.">
        <ArchiveBuilder />
      </Section>

      <Section title="Laporan khusus pendaftar" hint="Dengan penyaringan status, desa, kampus, angkatan, dan periode.">
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <p className="flex-1 text-[14px] text-[var(--ad-mute)]">Rekap atau rinci per orang, dikelompokkan, dengan statistik, alasan bergabung, bukti follow, dan kolom pengesahan.</p>
          <Link href="/admin/pendaftar/laporan" className="ad-btn ad-btn-primary"><Users size={16} /> Buat laporan pendaftar</Link>
        </Card>
      </Section>

      <Section title="Bersihkan penyimpanan">
        <Card>
          <PurgeProofs files={bukti.files} />
        </Card>
      </Section>

      <Section title="Cadangan data mentah" hint="Berkas JSON seluruh tabel. Untuk dipulihkan oleh teknisi, bukan untuk dibaca.">
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <p className="flex-1 text-[14px] text-[var(--ad-mute)]">Foto tidak ikut diunduh, hanya tautannya. Gunakan laporan PDF bila ingin arsip yang terbaca manusia.</p>
          <a href="/admin/backup" download className="ad-btn"><Download size={16} /> Unduh JSON</a>
        </Card>
      </Section>
    </div>
  );
}
