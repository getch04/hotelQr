"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

export default function StaffLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.login(username, password);
      localStorage.setItem("token", result.accessToken);
      localStorage.setItem("user", JSON.stringify(result.user));
      router.push("/staff");
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "radial-gradient(ellipse 120% 80% at 50% -10%, #f0dcc8 0%, #faf8f5 55%)"
      }}
    >
      <div className="w-full max-w-sm animate-fade-in">
        {/* Card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "var(--card)",
            boxShadow: "var(--shadow-lg)"
          }}
        >
          {/* Top accent strip */}
          <div
            className="h-1.5"
            style={{
              background: "linear-gradient(90deg, var(--brand-light), var(--brand), var(--brand-dark))"
            }}
          />

          <div className="p-7">
            {/* Icon + heading */}
            <div className="text-center mb-7">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--brand-light)" }}
              >
                <ShieldCheck className="w-7 h-7" style={{ color: "var(--brand)" }} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Staff Login</h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Sign in to manage orders
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  className="text-xs font-semibold block mb-1.5 uppercase tracking-wide"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--brand)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(201,147,90,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label
                  className="text-xs font-semibold block mb-1.5 uppercase tracking-wide"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--brand)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(201,147,90,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="Enter password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
                style={{
                  background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)",
                  boxShadow: loading ? "none" : "0 4px 16px rgba(201,147,90,0.4)"
                }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-xs text-center mt-5" style={{ color: "var(--text-muted)" }}>
          Hotel Concierge · Staff Portal
        </p>
      </div>
    </div>
  );
}
