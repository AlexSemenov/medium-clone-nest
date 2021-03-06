import { Module } from '@nestjs/common';
import { ProfileController } from '@app/profile/controllers/profile.controller';
import { ProfileService } from '@app/profile/services/profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@app/user/entities/user.entity';
import { FollowEntity } from '@app/profile/entities/follow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, FollowEntity])],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
