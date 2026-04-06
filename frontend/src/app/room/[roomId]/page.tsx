"use client";

import { use, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Check,
  Clock,
  Utensils,
  Loader2,
} from "lucide-react";
import { api, MenuCategory, MenuItem, Order } from "@/lib/api";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [showCart, setShowCart] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(null);
  const [hotelName, setHotelName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [room, menuData, orders] = await Promise.all([
          api.getRoom(roomId),
          api.getMenu(roomId),
          api.getOrdersByRoom(roomId),
        ]);
        setHotelName(room.hotel.name);
        setRoomNumber(room.number);
        setMenu(menuData);
        setRecentOrders(orders.slice(0, 3));
        if (menuData.length > 0) setActiveCategory(menuData[0].id);
      } catch {
        toast.error("Could not load menu. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [roomId]);

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      if (existing) {
        next.set(item.id, { ...existing, quantity: existing.quantity + 1 });
      } else {
        next.set(item.id, { menuItem: item, quantity: 1 });
      }
      return next;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        next.delete(itemId);
      } else {
        next.set(itemId, { ...existing, quantity: newQty });
      }
      return next;
    });
  }, []);

  const cartTotal = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  const cartCount = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const placeOrder = async () => {
    if (cart.size === 0) return;
    setSubmitting(true);
    try {
      const order = await api.createOrder({
        roomId,
        items: Array.from(cart.values()).map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
        })),
        notes: notes || undefined,
      });
      setOrderPlaced(order);
      setCart(new Map());
      setNotes("");
      setShowCart(false);
      toast.success("Order placed successfully!");
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: "var(--brand-light)" }}>
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand)" }} />
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Loading menu…</p>
        </div>
      </div>
    );
  }

  /* ── Order Confirmed ─────────────────────────────────────── */
  if (orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5"
           style={{ background: "var(--surface)" }}>
        <div className="w-full max-w-sm animate-scale-in">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
               style={{ background: "linear-gradient(135deg, #bbf7d0, #86efac)" }}>
            <Check className="w-10 h-10 text-green-700" strokeWidth={2.5} />
          </div>

          <h1 className="text-2xl font-bold text-center mb-1">Order Confirmed!</h1>
          <p className="text-sm text-center mb-7 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Your order is heading to the kitchen.<br />
            Room {roomNumber} will be served shortly.
          </p>

          {/* Order card */}
          <div className="rounded-2xl border p-5 mb-5"
               style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                #{orderPlaced.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "#fef3c7", color: "#92400e" }}>
                {orderPlaced.status}
              </span>
            </div>
            <div className="space-y-2 mb-4">
              {orderPlaced.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-secondary)" }}>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.quantity}×</span>{" "}
                    {item.menuItem.name}
                  </span>
                  <span className="font-medium">{(item.price * item.quantity).toFixed(0)} Br</span>
                </div>
              ))}
            </div>
            <div className="pt-3 flex justify-between font-bold text-base"
                 style={{ borderTop: "1px solid var(--border)" }}>
              <span>Total</span>
              <span style={{ color: "var(--brand)" }}>{orderPlaced.total.toFixed(0)} Br</span>
            </div>
          </div>

          <button
            onClick={() => setOrderPlaced(null)}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)",
              boxShadow: "0 4px 16px rgba(201,147,90,0.35)"
            }}
          >
            Order More
          </button>
        </div>
      </div>
    );
  }

  /* ── Main Menu ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--surface)" }}>

      {/* Header */}
      <header className="sticky top-0 z-30" style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="px-5 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight">{hotelName}</h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Room {roomNumber} · In-Room Dining
              </p>
            </div>
            <div className="flex items-center gap-2">
              {recentOrders.length > 0 && (
                <button
                  onClick={() => setOrderPlaced(recentOrders[0])}
                  className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                  style={{ background: "var(--surface-warm)" }}
                  title="Recent orders"
                >
                  <Clock className="w-4.5 h-4.5" style={{ color: "var(--text-secondary)" }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto gap-1.5 px-5 pb-3 scrollbar-hide">
          {menu.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                document
                  .getElementById(`cat-${cat.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={
                activeCategory === cat.id
                  ? {
                      background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)",
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(201,147,90,0.35)"
                    }
                  : {
                      background: "var(--surface-warm)",
                      color: "var(--text-secondary)"
                    }
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Menu content */}
      <main className="px-4 pt-5 space-y-8">
        {menu.map((category) => (
          <section key={category.id} id={`cat-${category.id}`}>
            {/* Section heading */}
            <div className="flex items-baseline gap-2 mb-3 px-1">
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--brand)" }}>
                {category.name}
              </h2>
              {category.nameAm && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {category.nameAm}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {category.items.map((item) => {
                const inCart = cart.get(item.id);
                return (
                  <MenuCard
                    key={item.id}
                    item={item}
                    inCart={inCart}
                    onAdd={() => addToCart(item)}
                    onUpdate={(delta) => updateQuantity(item.id, delta)}
                  />
                );
              })}
            </div>
          </section>
        ))}

        {/* Bottom padding so FAB doesn't overlap last item */}
        <div className="h-4" />
      </main>

      {/* Cart FAB */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-5 left-4 right-4 z-40 animate-slide-up">
          <button
            onClick={() => setShowCart(true)}
            className="w-full rounded-2xl p-4 flex items-center justify-between text-white transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)",
              boxShadow: "0 8px 24px rgba(201,147,90,0.45)"
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingCart className="w-4.5 h-4.5" />
              </div>
              <span className="font-semibold text-sm">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </span>
            </div>
            <span className="font-bold">{cartTotal.toFixed(0)} Br</span>
          </button>
        </div>
      )}

      {/* Cart Sheet */}
      {showCart && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setShowCart(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col animate-slide-up"
            style={{
              background: "var(--card)",
              maxHeight: "88vh",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.15)"
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
            </div>

            {/* Sheet header */}
            <div className="px-5 pb-4 pt-2 flex items-center justify-between"
                 style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 className="text-base font-bold">Your Order</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Room {roomNumber}</p>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl"
                style={{ background: "var(--surface-warm)" }}
              >
                <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
              {Array.from(cart.values()).map(({ menuItem, quantity }) => (
                <div
                  key={menuItem.id}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: "var(--surface-warm)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{menuItem.name}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--brand)" }}>
                      {menuItem.price.toFixed(0)} Br each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(menuItem.id, -1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(menuItem.id, 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-bold w-14 text-right">
                    {(menuItem.price * quantity).toFixed(0)} Br
                  </p>
                </div>
              ))}

              {/* Notes */}
              <div className="pt-1">
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Special requests
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, preferences…"
                  rows={2}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none outline-none transition-all"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-warm)"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--brand)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(201,147,90,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Total</span>
                <span className="text-xl font-bold">{cartTotal.toFixed(0)} Br</span>
              </div>
              <button
                onClick={placeOrder}
                disabled={submitting}
                className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)",
                  boxShadow: submitting ? "none" : "0 4px 16px rgba(201,147,90,0.4)"
                }}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Utensils className="w-5 h-5" />
                )}
                {submitting ? "Placing Order…" : "Place Order"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Menu Card Component ────────────────────────────────────── */
function MenuCard({
  item,
  inCart,
  onAdd,
  onUpdate,
}: {
  item: MenuItem;
  inCart?: CartItem;
  onAdd: () => void;
  onUpdate: (delta: number) => void;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex gap-4 items-start transition-all"
      style={{
        background: "var(--card)",
        boxShadow: "var(--shadow-sm)",
        borderLeft: inCart ? "3px solid var(--brand)" : "3px solid transparent",
      }}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm leading-snug">{item.name}</h3>
        {item.nameAm && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.nameAm}</p>
        )}
        {item.description && (
          <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            {item.description}
          </p>
        )}
        <p className="text-sm font-bold mt-2.5" style={{ color: "var(--brand)" }}>
          {item.price.toFixed(0)} Br
        </p>
      </div>

      <div className="shrink-0 mt-0.5">
        {inCart ? (
          <div
            className="flex items-center gap-1 rounded-xl px-1"
            style={{ background: "var(--brand-light)" }}
          >
            <button
              onClick={() => onUpdate(-1)}
              className="p-1.5 transition-opacity"
              style={{ color: "var(--brand-dark)" }}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-bold w-5 text-center" style={{ color: "var(--brand-dark)" }}>
              {inCart.quantity}
            </span>
            <button
              onClick={() => onUpdate(1)}
              className="p-1.5 transition-opacity"
              style={{ color: "var(--brand-dark)" }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onAdd}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90"
            style={{ background: "var(--brand-light)", color: "var(--brand-dark)" }}
          >
            <Plus className="w-4.5 h-4.5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
