import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async getRoom(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        hotel: {
          select: { id: true, name: true, logoUrl: true, phone: true },
        },
      },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }
}
