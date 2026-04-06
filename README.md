# Hotel QR Concierge System

A QR-based digital room service ordering system for hotels. Guests scan a QR code in their room, browse the menu, and place orders -- no app install needed. Staff manage orders from a real-time dashboard.

## Live Demo

| Link | Description |
|------|-------------|
| [Home Page](https://frontend-one-lyart-38.vercel.app) | Landing page with sample room link |
| [Sample Room 101](https://frontend-one-lyart-38.vercel.app/room/00000000-0000-4000-8000-000000000065) | Guest ordering experience |
| [Staff Login](https://frontend-one-lyart-38.vercel.app/staff/login) | Staff dashboard (credentials below) |
| [Backend API](https://backend-tan-six-34.vercel.app/api) | NestJS REST API |

**Staff credentials:** `admin` / `admin123`

## Sample Room Links

| Room | URL |
|------|-----|
| 101 | https://frontend-one-lyart-38.vercel.app/room/00000000-0000-4000-8000-000000000065 |
| 102 | https://frontend-one-lyart-38.vercel.app/room/00000000-0000-4000-8000-000000000066 |
| 103 | https://frontend-one-lyart-38.vercel.app/room/00000000-0000-4000-8000-000000000067 |
| 201 | https://frontend-one-lyart-38.vercel.app/room/00000000-0000-4000-8000-0000000000c9 |
| 202 | https://frontend-one-lyart-38.vercel.app/room/00000000-0000-4000-8000-0000000000ca |
| 203 | https://frontend-one-lyart-38.vercel.app/room/00000000-0000-4000-8000-0000000000cb |
| 301 | https://frontend-one-lyart-38.vercel.app/room/00000000-0000-4000-8000-00000000012d |
| 302 | https://frontend-one-lyart-38.vercel.app/room/00000000-0000-4000-8000-00000000012e |

## Tech Stack

- **Frontend:** Next.js 16, TailwindCSS 4, TypeScript
- **Backend:** NestJS 11, Prisma ORM, PostgreSQL
- **Database:** Neon (serverless PostgreSQL)
- **Hosting:** Vercel (frontend + backend serverless)

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Staff login |
| GET | `/api/rooms/:id` | No | Get room info |
| GET | `/api/menu/room/:roomId` | No | Get menu for a room |
| POST | `/api/orders` | No | Place an order |
| GET | `/api/orders/room/:roomId` | No | Get orders for a room |
| GET | `/api/orders/hotel/:hotelId` | JWT | Get all hotel orders |
| PATCH | `/api/orders/:id/status` | JWT | Update order status |

## QR Codes

Printable QR codes for all rooms are in `qr-codes/`:
- Individual PNGs: `room-101.png`, `room-102.png`, etc.
- Printable page: `print-qr-codes.html` (open in browser to print)

To regenerate with a different base URL:
```bash
BASE_URL=https://your-domain.com node generate-qr.js
```

## Local Development

Prerequisites: Docker, Node.js 20+

```bash
./start.sh
```

This starts PostgreSQL (Docker), runs migrations, seeds the database, and launches both servers:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api

## Project Structure

```
hotelQr/
  backend/          NestJS API server
    src/
      auth/         JWT authentication
      menu/         Menu endpoints
      orders/       Order CRUD
      rooms/        Room endpoints
      prisma/       Database service
      seed/         Database seeding
    prisma/         Schema & migrations
  frontend/         Next.js app
    src/
      app/          Pages (home, room, staff)
      lib/          API client
  qr-codes/         Generated QR code images
  generate-qr.js    QR code generator
  start.sh          Local dev startup script
```
