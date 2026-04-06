"use client";

import { useState, useEffect, useCallback } from "react";
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
  { label: string; color: string; bg: string; icon: typeof Clock }
> = {
  PENDING: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  PREPARING: { label: "Preparing", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: ChefHat },
  DELIVERED: { label: "Delivered", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PREPARING",
  PREPARING: "DELIVERED",
};

export default function StaffDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; hotel: { id: string; name: string } } | null>(null);

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      router.push("/staff/login");
      return;
    }

    const parsed = JSON.parse(userData);
    setUser(parsed);

    try {
      const data = await api.getOrdersByHotel(parsed.hotel.id, token);
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);


  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const updated = await api.updateOrderStatus(orderId, status, token);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      toast.success(`Order marked as ${STATUS_CONFIG[status].label}`);
    } catch {
      toast.error("Failed to update order");
    }
  };

  const filteredOrders =
    filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const preparingCount = orders.filter((o) => o.status === "PREPARING").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{user?.hotel.name}</h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Order Dashboard &middot; {user?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="p-2 rounded-xl hover:bg-gray-100 transition"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.push("/staff/login");
              }}
              className="p-2 rounded-xl hover:bg-gray-100 transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-800">{pendingCount}</p>
              <p className="text-xs text-amber-600">Pending</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-800">{preparingCount}</p>
              <p className="text-xs text-blue-600">Preparing</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3">
          {(["ALL", "PENDING", "PREPARING", "DELIVERED", "CANCELLED"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === s
                    ? "bg-brand text-white"
                    : "bg-white border text-[var(--text-secondary)] hover:bg-gray-50"
                }`}
              >
                {s === "ALL" ? "All Orders" : STATUS_CONFIG[s].label}
                {s === "ALL" && ` (${orders.length})`}
              </button>
            )
          )}
        </div>

        {/* Orders list */}
        <div className="space-y-3">
          {filteredOrders.length === 0 && (
            <div className="text-center py-16 text-[var(--text-secondary)]">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No orders yet</p>
            </div>
          )}
          {filteredOrders.map((order) => {
            const config = STATUS_CONFIG[order.status];
            const StatusIcon = config.icon;
            const nextStatus = NEXT_STATUS[order.status];
            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  order.status === "PENDING" ? "ring-2 ring-amber-300" : ""
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">
                          Room {order.room?.number}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        &middot; #{order.id.slice(0, 8)}
                      </p>
                    </div>
                    <span className="text-lg font-bold">
                      {order.total.toFixed(0)} Br
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          <span className="font-medium">{item.quantity}x</span>{" "}
                          {item.menuItem.name}
                        </span>
                        <span className="text-[var(--text-secondary)]">
                          {(item.price * item.quantity).toFixed(0)} Br
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-xs bg-amber-50 text-amber-800 px-3 py-2 rounded-lg mb-3">
                      Note: {order.notes}
                    </p>
                  )}

                  {nextStatus && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(order.id, nextStatus)}
                        className="flex-1 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors"
                      >
                        Mark as {STATUS_CONFIG[nextStatus].label}
                      </button>
                      {order.status === "PENDING" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order.id, "CANCELLED")
                          }
                          className="py-2.5 px-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
