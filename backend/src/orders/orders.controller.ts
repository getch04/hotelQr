import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersGateway } from '../gateway/orders.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private ordersGateway: OrdersGateway,
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.ordersService.create(dto);
    this.ordersGateway.notifyNewOrder(order);
    return order;
  }

  @Get('room/:roomId')
  findByRoom(@Param('roomId') roomId: string) {
    return this.ordersService.findByRoom(roomId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('hotel/:hotelId')
  findByHotel(
    @Param('hotelId') hotelId: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findByHotel(hotelId, status);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateStatus(id, dto.status);
    this.ordersGateway.notifyOrderUpdate(order);
    return order;
  }
}
