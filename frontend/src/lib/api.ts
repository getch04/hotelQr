const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "Request failed");
  }
  return res.json();
}

// Types
export interface Hotel {
  id: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
}

export interface Room {
  id: string;
  number: string;
  floor: number;
  hotelId: string;
  hotel: Hotel;
}

export interface MenuItem {
  id: string;
  name: string;
  nameAm: string | null;
  description: string | null;
  descriptionAm: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  categoryId: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  nameAm: string | null;
  sortOrder: number;
  items: MenuItem[];
}

export type OrderStatus = "PENDING" | "PREPARING" | "DELIVERED" | "CANCELLED";

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: MenuItem;
}

export interface Order {
  id: string;
  roomId: string;
  status: OrderStatus;
  notes: string | null;
  total: number;
  createdAt: string;
  items: OrderItem[];
  room?: Room;
}

// API calls
export const api = {
  getRoom: (roomId: string) => request<Room>(`/rooms/${roomId}`),

  getMenu: (roomId: string) =>
    request<MenuCategory[]>(`/menu/room/${roomId}`),

  createOrder: (data: {
    roomId: string;
    items: { menuItemId: string; quantity: number }[];
    notes?: string;
  }) =>
    request<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getOrdersByRoom: (roomId: string) =>
    request<Order[]>(`/orders/room/${roomId}`),

  getOrdersByHotel: (hotelId: string, token: string) =>
    request<Order[]>(`/orders/hotel/${hotelId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    token: string
  ) =>
    request<Order>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  login: (username: string, password: string) =>
    request<{
      accessToken: string;
      user: { id: string; name: string; hotel: Hotel };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
};
