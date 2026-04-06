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
  MapPin,
  Phone,
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
  const [hotelPhone, setHotelPhone] = useState("");
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
        setHotelPhone(room.hotel.phone || "");
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
    (sum, item) => sum + item.menuItem.price * item.quantity, 0
  );
  const cartCount = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.quantity, 0
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
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
               style={{ background: "linear-gradient(135deg, var(--brand-light), var(--brand))" }}>
            <Loader2 className="w-7 h-7 animate-spin text-white" />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Loading your menu...</p>
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
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full animate-pulse-soft"
                 style={{ background: "linear-gradient(135deg, #bbf7d0, #86efac)", opacity: 0.4, transform: "scale(1.3)" }} />
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #bbf7d0, #86efac)" }}>
              <Check className="w-12 h-12 text-green-700" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-1">Order Confirmed!</h1>
          <p className="text-sm text-center mb-7 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Your order is heading to the kitchen.<br />
            Room {roomNumber} will be served shortly.
          </p>

          <div className="rounded-2xl overflow-hidden mb-5"
               style={{ background: "var(--card)", boxShadow: "var(--shadow-md)" }}>
            <div className="h-1" style={{ background: "linear-gradient(90deg, var(--brand-light), var(--brand), var(--brand-dark))" }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background: "var(--surface-warm)", color: "var(--text-secondary)" }}>
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
                   style={{ borderTop: "1px dashed var(--border)" }}>
                <span>Total</span>
                <span style={{ color: "var(--brand)" }}>{orderPlaced.total.toFixed(0)} Br</span>
              </div>
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

      {/* Hero Header */}
      <div className="relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)" }}>
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative px-5 pt-10 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
                 style={{ color: "rgba(201,147,90,0.9)" }}>
                Welcome to
              </p>
              <h1 className="text-2xl font-bold text-white leading-tight tracking-tight">{hotelName}</h1>
              <div className="flex items-center gap-3 mt-2.5">
                <span className="inline-flex items-center gap-1 text-xs text-white/60">
                  <MapPin className="w-3 h-3" /> Room {roomNumber}
                </span>
                {hotelPhone && (
                  <span className="inline-flex items-center gap-1 text-xs text-white/60">
                    <Phone className="w-3 h-3" /> {hotelPhone}
                  </span>
                )}
              </div>
            </div>
            {recentOrders.length > 0 && (
              <button
                onClick={() => setOrderPlaced(recentOrders[0])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)" }}
              >
                <Clock className="w-3.5 h-3.5" />
                Orders
              </button>
            )}
          </div>
        </div>
        {/* Curved bottom */}
        <div className="h-5 -mb-px" style={{ background: "var(--surface)", borderRadius: "20px 20px 0 0" }} />
      </div>

      {/* Category tabs - sticky */}
      <div className="sticky top-0 z-30 backdrop-blur-xl"
           style={{ background: "rgba(250,248,245,0.9)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex overflow-x-auto gap-2 px-5 py-3 scrollbar-hide">
          {menu.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={
                activeCategory === cat.id
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
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu content */}
      <main className="px-4 pt-4 space-y-7">
        {menu.map((category) => (
          <section key={category.id} id={`cat-${category.id}`}>
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="h-px flex-1" style={{ background: "var(--border)" }} />
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] shrink-0" style={{ color: "var(--brand)" }}>
                {category.name}
              </h2>
              {category.nameAm && (
                <span className="text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>{category.nameAm}</span>
              )}
              <div className="h-px flex-1" style={{ background: "var(--border)" }} />
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
        <div className="h-4" />
      </main>

      {/* Cart FAB */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-5 left-4 right-4 z-40 animate-slide-up">
          <button
            onClick={() => setShowCart(true)}
            className="w-full rounded-2xl p-4 flex items-center justify-between text-white transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #1c1917 0%, #292524 100%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{ background: "var(--brand)" }}>
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-[10px] font-bold flex items-center justify-center"
                      style={{ color: "var(--brand-dark)" }}>
                  {cartCount}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">View Cart</p>
                <p className="text-[11px] text-white/60">{cartCount} {cartCount === 1 ? "item" : "items"}</p>
              </div>
            </div>
            <span className="text-lg font-bold">{cartTotal.toFixed(0)} Br</span>
          </button>
        </div>
      )}

      {/* Cart Sheet */}
      {showCart && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
               onClick={() => setShowCart(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col animate-slide-up"
               style={{ background: "var(--card)", maxHeight: "88vh", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
            </div>

            <div className="px-5 pb-4 pt-2 flex items-center justify-between"
                 style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 className="text-base font-bold">Your Order</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Room {roomNumber}</p>
              </div>
              <button onClick={() => setShowCart(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl"
                      style={{ background: "var(--surface-warm)" }}>
                <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
              {Array.from(cart.values()).map(({ menuItem, quantity }) => (
                <div key={menuItem.id} className="flex items-center gap-3 rounded-xl overflow-hidden"
                     style={{ background: "var(--surface-warm)" }}>
                  {menuItem.imageUrl && (
                    <img src={menuItem.imageUrl} alt="" className="w-16 h-16 object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 py-2">
                    <p className="font-medium text-sm truncate">{menuItem.name}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--brand)" }}>
                      {menuItem.price.toFixed(0)} Br
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pr-3">
                    <button onClick={() => updateQuantity(menuItem.id, -1)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{quantity}</span>
                    <button onClick={() => updateQuantity(menuItem.id, 1)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Special requests
                </label>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, preferences..."
                  rows={2}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none outline-none transition-all"
                  style={{ borderColor: "var(--border)", background: "var(--surface-warm)" }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--brand)"; e.target.style.boxShadow = "0 0 0 3px rgba(201,147,90,0.15)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Total</span>
                <span className="text-xl font-bold">{cartTotal.toFixed(0)} Br</span>
              </div>
              <button
                onClick={placeOrder} disabled={submitting}
                className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)",
                  boxShadow: submitting ? "none" : "0 4px 16px rgba(201,147,90,0.4)"
                }}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Utensils className="w-5 h-5" />}
                {submitting ? "Placing Order..." : "Place Order"}
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
  item, inCart, onAdd, onUpdate,
}: {
  item: MenuItem; inCart?: CartItem; onAdd: () => void; onUpdate: (delta: number) => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "var(--card)",
        boxShadow: inCart ? "0 0 0 2px var(--brand), var(--shadow-md)" : "var(--shadow-sm)",
      }}
    >
      {/* Image */}
      {item.imageUrl && (
        <div className="relative h-36 overflow-hidden">
          <img src={item.imageUrl} alt={item.name}
               className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0"
               style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)" }} />
          {inCart && (
            <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1"
                 style={{ background: "var(--brand)", backdropFilter: "blur(8px)" }}>
              <ShoppingCart className="w-3 h-3" /> {inCart.quantity}
            </div>
          )}
          <div className="absolute bottom-2.5 left-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
              {item.price.toFixed(0)} Br
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm leading-snug">{item.name}</h3>
            {item.nameAm && (
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{item.nameAm}</p>
            )}
            {item.description && (
              <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                {item.description}
              </p>
            )}
            {!item.imageUrl && (
              <p className="text-sm font-bold mt-2" style={{ color: "var(--brand)" }}>{item.price.toFixed(0)} Br</p>
            )}
          </div>

          <div className="shrink-0">
            {inCart ? (
              <div className="flex items-center gap-1 rounded-xl px-1" style={{ background: "var(--brand-light)" }}>
                <button onClick={() => onUpdate(-1)} className="p-1.5" style={{ color: "var(--brand-dark)" }}>
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold w-5 text-center" style={{ color: "var(--brand-dark)" }}>
                  {inCart.quantity}
                </span>
                <button onClick={() => onUpdate(1)} className="p-1.5" style={{ color: "var(--brand-dark)" }}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={onAdd}
                      className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90"
                      style={{
                        background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)",
                        color: "white",
                        boxShadow: "0 2px 8px rgba(201,147,90,0.3)"
                      }}>
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
