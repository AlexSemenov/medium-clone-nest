import { Module } from '@nestjs/common';
import { ArticleController } from '@app/article/controllers/article.controller';
import { ArticleService } from '@app/article/services/article.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from '@app/article/entities/article.entity';
import { UserEntity } from '@app/user/entities/user.entity';
import { FollowEntity } from '@app/profile/entities/follow.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArticleEntity, UserEntity, FollowEntity]),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
