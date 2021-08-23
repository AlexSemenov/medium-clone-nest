import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  UsePipes,
} from '@nestjs/common';

import { UserService } from '@app/user/services/user.service';
import { CreateUserDto } from '@app/user/dto/create-user.dto';
import { UserResponseInterface } from '@app/user/types/user-response.interface';
import { LoginUserDto } from '@app/user/dto/login-user.dto';
import { User } from '@app/user/decorators/user.decorator';
import { UserEntity } from '@app/user/entities/user.entity';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { UpdateUserDto } from '@app/user/dto/update-user.dto';
import { BackendValidationPipe } from '@app/shared/pipes/backend-validation.pipe';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/users')
  @UsePipes(new BackendValidationPipe())
  async createUser(
    @Body('user') createUserDto: CreateUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.createUser(createUserDto);
    return this.userService.buildUserResponse(user);
  }

  @Post('/users/login')
  @UsePipes(new BackendValidationPipe())
  async loginUser(
    @Body('user') loginUserDto: LoginUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.loginUser(loginUserDto);
    return this.userService.buildUserResponse(user);
  }

  @Get('/user')
  @UseGuards(AuthGuard)
  async currentUser(@User() user: UserEntity): Promise<UserResponseInterface> {
    return this.userService.buildUserResponse(user);
  }

  @Put('/user')
  @UseGuards(AuthGuard)
  async updateUser(
    @User('id') userId: number,
    @Body('user') updateUserDto: UpdateUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.updateUser(userId, updateUserDto);
    return this.userService.buildUserResponse(user);
  }
}
