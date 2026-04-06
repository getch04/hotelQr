import Link from "next/link";
import { Utensils, ShieldCheck, QrCode } from "lucide-react";

const SAMPLE_ROOM_ID = "room-101-0000-0000-0000-000000000000";

export default function Home() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-brand/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Utensils className="w-10 h-10 text-brand" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Hotel QR Concierge
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Scan the QR code in your room to order food and services directly from
          your phone.
        </p>
        <div className="space-y-3">
          <Link
            href={`/room/${SAMPLE_ROOM_ID}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark transition-colors"
          >
            <QrCode className="w-5 h-5" />
            Try Sample Room (101)
          </Link>
          <Link
            href="/staff/login"
            className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-brand text-brand rounded-xl font-semibold hover:bg-brand/5 transition-colors"
          >
            <ShieldCheck className="w-5 h-5" />
            Staff Dashboard
          </Link>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-8">
          Guests: scan the QR code in your room to get started
        </p>
      </div>
    </div>
  );
}
