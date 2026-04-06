"use client";

import { use, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Check,
  ChevronDown,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Loading menu...</p>
        </div>
      </div>
    );
  }

  // Order confirmation screen
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Your order has been sent to the kitchen. We&apos;ll have it ready
              for Room {roomNumber} shortly.
            </p>
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 text-left">
              <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-3">
                <span>Order #{orderPlaced.id.slice(0, 8)}</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  {orderPlaced.status}
                </span>
              </div>
              {orderPlaced.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between py-1.5 text-sm"
                >
                  <span>
                    {item.quantity}x {item.menuItem.name}
                  </span>
                  <span className="font-medium">
                    {(item.price * item.quantity).toFixed(0)} Br
                  </span>
                </div>
              ))}
              <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>{orderPlaced.total.toFixed(0)} Br</span>
              </div>
            </div>
            <button
              onClick={() => setOrderPlaced(null)}
              className="w-full py-3.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark transition-colors"
            >
              Order More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-30 border-b border-gray-100">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">{hotelName}</h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Room {roomNumber} &middot; In-Room Dining
              </p>
            </div>
            <div className="flex items-center gap-3">
              {recentOrders.length > 0 && (
                <button
                  onClick={() => {
                    const latest = recentOrders[0];
                    setOrderPlaced(latest);
                  }}
                  className="p-2 rounded-xl bg-surface-warm"
                  title="Recent orders"
                >
                  <Clock className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto gap-1 px-5 pb-3 scrollbar-hide">
          {menu.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                document
                  .getElementById(`cat-${cat.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-brand text-white"
                  : "bg-surface-warm text-[var(--text-secondary)] hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Menu */}
      <main className="px-5 pt-4">
        {menu.map((category) => (
          <section key={category.id} id={`cat-${category.id}`} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-bold">{category.name}</h2>
              {category.nameAm && (
                <span className="text-xs text-[var(--text-secondary)]">
                  {category.nameAm}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {category.items.map((item) => {
                const inCart = cart.get(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 shadow-sm flex gap-4 items-start"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight">
                        {item.name}
                      </h3>
                      {item.nameAm && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {item.nameAm}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-sm font-bold text-brand mt-2">
                        {item.price.toFixed(0)} Br
                      </p>
                    </div>
                    <div className="shrink-0">
                      {inCart ? (
                        <div className="flex items-center gap-2 bg-brand/10 rounded-xl px-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1.5 text-brand"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold w-5 text-center">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1.5 text-brand"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="p-2.5 bg-brand/10 rounded-xl text-brand hover:bg-brand/20 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {/* Cart FAB */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-brand text-white rounded-2xl p-4 shadow-lg flex items-center justify-between hover:bg-brand-dark transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="font-semibold">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </span>
            </div>
            <span className="font-bold text-lg">
              {cartTotal.toFixed(0)} Br
            </span>
          </button>
        </div>
      )}

      {/* Cart Sheet */}
      {showCart && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] flex flex-col shadow-2xl animate-slide-up">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Your Order</h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Room {roomNumber}
                </p>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {Array.from(cart.values()).map(({ menuItem, quantity }) => (
                <div
                  key={menuItem.id}
                  className="flex items-center gap-3 bg-surface rounded-xl p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {menuItem.name}
                    </p>
                    <p className="text-xs text-brand font-bold">
                      {menuItem.price.toFixed(0)} Br each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(menuItem.id, -1)}
                      className="p-1 rounded-lg bg-white border"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(menuItem.id, 1)}
                      className="p-1 rounded-lg bg-white border"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-bold w-16 text-right">
                    {(menuItem.price * quantity).toFixed(0)} Br
                  </p>
                </div>
              ))}
              {/* Notes */}
              <div className="pt-2">
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                  Special requests
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, preferences, etc."
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
            </div>
            <div className="p-5 border-t bg-white">
              <div className="flex justify-between mb-4">
                <span className="text-[var(--text-secondary)]">Total</span>
                <span className="text-xl font-bold">
                  {cartTotal.toFixed(0)} Br
                </span>
              </div>
              <button
                onClick={placeOrder}
                disabled={submitting}
                className="w-full py-4 bg-brand text-white rounded-2xl font-bold text-base hover:bg-brand-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Utensils className="w-5 h-5" />
                )}
                {submitting ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
