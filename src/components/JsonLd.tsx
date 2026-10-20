/** Data terstruktur (schema.org) untuk mesin pencari. `<` di-escape agar aman dari injeksi </script>. */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
