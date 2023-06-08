import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @Patch()
  @UseGuards(AuthGuard('jwt'))
  update(@Req() request, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update({ userId: request.user.id, updateUserDto });
  }
}
