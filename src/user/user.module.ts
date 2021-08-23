import { Module } from '@nestjs/common';
import { UserController } from '@app/user/controllers/user.controller';
import { UserService } from '@app/user/services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@app/user/entities/user.entity';
import { AuthGuard } from '@app/user/guards/auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserService, AuthGuard],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
