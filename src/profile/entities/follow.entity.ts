import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('follows')
export class FollowEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  followId: number;

  @Column()
  followingId: number;
}
