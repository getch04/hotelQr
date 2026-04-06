import { Controller, Get, Param } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  @Get('room/:roomId')
  getMenuForRoom(@Param('roomId') roomId: string) {
    return this.menuService.getMenuByRoom(roomId);
  }

  @Get('hotel/:hotelId')
  getMenuForHotel(@Param('hotelId') hotelId: string) {
    return this.menuService.getMenuByHotel(hotelId);
  }
}
