"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { api, Order, OrderStatus } from "@/lib/api";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; dot: string; icon: typeof Clock }
> = {
  PENDING:   { label: "Pending",   color: "#92400e", bg: "#fef9ec", dot: "#f59e0b", icon: Clock        },
  PREPARING: { label: "Preparing", color: "#1e40af", bg: "#eff6ff", dot: "#3b82f6", icon: ChefHat      },
  DELIVERED: { label: "Delivered", color: "#166534", bg: "#f0fdf4", dot: "#22c55e", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "#991b1b", bg: "#fef2f2", dot: "#ef4444", icon: XCircle      },
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PREPARING",
  PREPARING: "DELIVERED",
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function StaffDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<{ name: string; hotel: { id: string; name: string } } | null>(null);
  const tokenRef = useRef<string | null>(null);
  const userRef = useRef<{ name: string; hotel: { id: string; name: string } } | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    const token = tokenRef.current || localStorage.getItem("token");
    const userData = userRef.current || (() => {
      try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
    })();

    if (!token || !userData) {
      router.push("/staff/login");
      return;
    }

    tokenRef.current = token;
    userRef.current = userData;
    setUser(userData);

    if (isRefresh) setRefreshing(true);

    try {
      const data = await api.getOrdersByHotel(userData.hotel.id, token);
      setOrders(data);
      if (isRefresh) toast.success(`${data.length} orders loaded`);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    const token = tokenRef.current;
    if (!token) return;
    try {
      const updated = await api.updateOrderStatus(orderId, status, token);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      toast.success(`Marked as ${STATUS_CONFIG[status].label}`);
    } catch {
      toast.error("Failed to update order");
    }
  };

  const filteredOrders = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);
  const pendingCount   = orders.filter((o) => o.status === "PENDING").length;
  const preparingCount = orders.filter((o) => o.status === "PREPARING").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>

      {/* Header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: "rgba(255,255,255,0.85)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold leading-tight">{user?.hotel.name}</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {user?.name} · Order Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "var(--surface-warm)" }}
              title="Refresh orders"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                style={{ color: "var(--text-secondary)" }}
              />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.push("/staff/login");
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95"
              style={{ background: "var(--surface-warm)" }}
              title="Logout"
            >
              <LogOut className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            count={pendingCount}
            label="Pending"
            iconBg="#fef3c7"
            iconColor="#d97706"
            countColor="#92400e"
          />
          <StatCard
            icon={<ChefHat className="w-5 h-5" />}
            count={preparingCount}
            label="Preparing"
            iconBg="#dbeafe"
            iconColor="#3b82f6"
            countColor="#1e40af"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {(["ALL", "PENDING", "PREPARING", "DELIVERED", "CANCELLED"] as const).map((s) => {
            const active = filter === s;
            const count  = s === "ALL" ? orders.length : orders.filter((o) => o.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)",
                        color: "#fff",
                        boxShadow: "0 2px 8px rgba(201,147,90,0.35)"
                      }
                    : {
                        background: "var(--card)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)"
                      }
                }
              >
                {s !== "ALL" && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: active ? "rgba(255,255,255,0.7)" : STATUS_CONFIG[s].dot }}
                  />
                )}
                {s === "ALL" ? "All" : STATUS_CONFIG[s].label}
                <span className="ml-0.5 text-[10px]" style={{ opacity: 0.7 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Orders */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--surface-warm)" }}
            >
              <Clock className="w-6 h-6" style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No orders yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Orders will appear here when guests place them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} onUpdate={handleStatusUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────────── */
function StatCard({
  icon, count, label, iconBg, iconColor, countColor
}: {
  icon: React.ReactNode; count: number; label: string;
  iconBg: string; iconColor: string; countColor: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{ background: "var(--card)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
           style={{ background: iconBg, color: iconColor }}>{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-none" style={{ color: countColor }}>{count}</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
      </div>
    </div>
  );
}

/* ── Order Card ───────────────────────────────────────────── */
function OrderCard({ order, onUpdate }: { order: Order; onUpdate: (id: string, status: OrderStatus) => void }) {
  const config     = STATUS_CONFIG[order.status];
  const StatusIcon = config.icon;
  const nextStatus = NEXT_STATUS[order.status];
  const isPending  = order.status === "PENDING";

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "var(--card)",
        boxShadow: isPending ? "0 0 0 2px #fbbf24, var(--shadow-sm)" : "var(--shadow-sm)",
        border: "1px solid var(--border)"
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold">Room {order.room?.number}</span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: config.bg, color: config.color }}
              >
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {timeAgo(order.createdAt)} · #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <span className="text-base font-bold" style={{ color: "var(--brand)" }}>
            {order.total.toFixed(0)} Br
          </span>
        </div>

        <div className="rounded-xl p-3 mb-3 space-y-1.5" style={{ background: "var(--surface-warm)" }}>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                <span className="font-semibold">{item.quantity}×</span>{" "}
                <span style={{ color: "var(--text-secondary)" }}>{item.menuItem.name}</span>
              </span>
              <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
                {(item.price * item.quantity).toFixed(0)} Br
              </span>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="flex gap-2 items-start rounded-xl px-3 py-2 mb-3 text-xs"
               style={{ background: "#fffbeb", color: "#92400e" }}>
            <span className="font-semibold shrink-0">Note:</span>
            <span>{order.notes}</span>
          </div>
        )}

        {nextStatus && (
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate(order.id, nextStatus)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)",
                boxShadow: "0 2px 8px rgba(201,147,90,0.3)"
              }}
            >
              Mark as {STATUS_CONFIG[nextStatus].label}
            </button>
            {isPending && (
              <button
                onClick={() => onUpdate(order.id, "CANCELLED")}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{ background: "#fee2e2", color: "#991b1b" }}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
