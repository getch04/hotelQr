import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    // Look up prices for all items
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: dto.items.map((i) => i.menuItemId) },
        available: true,
      },
    });

    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));

    // Validate all items exist
    for (const item of dto.items) {
      if (!priceMap.has(item.menuItemId)) {
        throw new NotFoundException(
          `Menu item ${item.menuItemId} not found or unavailable`,
        );
      }
    }

    const total = dto.items.reduce(
      (sum, item) => sum + priceMap.get(item.menuItemId)! * item.quantity,
      0,
    );

    return this.prisma.order.create({
      data: {
        roomId: dto.roomId,
        notes: dto.notes,
        total,
        items: {
          create: dto.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: priceMap.get(item.menuItemId)!,
          })),
        },
      },
      include: {
        items: { include: { menuItem: true } },
        room: { include: { hotel: { select: { name: true } } } },
      },
    });
  }

  async findByRoom(roomId: string) {
    return this.prisma.order.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { menuItem: true } },
      },
    });
  }

  async findByHotel(hotelId: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: {
        room: { hotelId },
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { menuItem: true } },
        room: true,
      },
    });
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: { include: { menuItem: true } },
        room: true,
      },
    });
  }
}
