import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async getMenuByHotel(hotelId: string) {
    return this.prisma.menuCategory.findMany({
      where: { hotelId },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { available: true },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async getMenuByRoom(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { hotelId: true },
    });
    if (!room) return [];
    return this.getMenuByHotel(room.hotelId);
  }
}
