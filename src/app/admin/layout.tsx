import type { Metadata } from "next";
import "@fontsource-variable/inter/opsz.css";
import "./admin.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="adm">{children}</div>;
}
