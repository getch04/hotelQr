import Link from "next/link";
import { Utensils, ShieldCheck, QrCode, Star } from "lucide-react";

// Must match backend seed: deterministicRoomId(101)
const SAMPLE_ROOM_ID = "00000000-0000-4000-8000-000000000065";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
         style={{ background: "radial-gradient(ellipse 120% 80% at 50% -10%, #f0dcc8 0%, #faf8f5 55%)" }}>

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--brand)] to-transparent opacity-40" />
      <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-[var(--brand)]/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full bg-[var(--brand)]/6 blur-3xl pointer-events-none" />

      <div className="relative text-center max-w-xs w-full">
        {/* Logo */}
        <div className="relative w-20 h-20 mx-auto mb-7">
          <div className="absolute inset-0 rounded-3xl bg-[var(--brand)]/20 blur-md scale-110" />
          <div className="relative w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-[var(--shadow-md)]">
            <Utensils className="w-9 h-9 text-[var(--brand)]" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-[1.75rem] font-bold tracking-tight leading-tight mb-2" style={{ color: "var(--text-primary)" }}>
          Hotel Concierge
        </h1>
        <div className="flex items-center justify-center gap-1 mb-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-[var(--brand)] text-[var(--brand)]" />
          ))}
        </div>
        <p className="text-sm mt-3 mb-8 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          In-room dining &amp; services, delivered<br />directly to your door.
        </p>

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            href={`/room/${SAMPLE_ROOM_ID}`}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)",
              boxShadow: "0 4px 16px rgba(201,147,90,0.4)"
            }}
          >
            <QrCode className="w-4.5 h-4.5" />
            Try Sample Room (101)
          </Link>
          <Link
            href="/staff/login"
            className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-white border rounded-2xl font-semibold text-sm transition-all hover:bg-[var(--surface-warm)] active:scale-[0.98]"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-primary)",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <ShieldCheck className="w-4.5 h-4.5 text-[var(--brand)]" />
            Staff Dashboard
          </Link>
        </div>

        <p className="text-xs mt-8" style={{ color: "var(--text-muted)" }}>
          Scan the QR code in your room to get started
        </p>
      </div>
    </div>
  );
}
