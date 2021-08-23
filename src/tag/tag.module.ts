import { Module } from '@nestjs/common';

import { TagController } from '@app/tag/controllers/tag.controller';
import { TagService } from '@app/tag/services/tag.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagEntity } from '@app/tag/entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TagEntity])],
  controllers: [TagController],
  providers: [TagService],
})
export class TagModule {}
