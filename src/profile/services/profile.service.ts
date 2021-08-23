import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@app/user/entities/user.entity';
import { Repository } from 'typeorm';
import { ProfileResponseInterface } from '@app/profile/types/profile-response.interface';
import { ProfileType } from '@app/profile/types/profile.type';
import { FollowEntity } from '@app/profile/entities/follow.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}
  async findUserByUsername(
    currentUserId: number,
    username: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOne({ username });
    if (!user) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    const follow = await this.followRepository.findOne({
      followId: currentUserId,
      followingId: user.id,
    });

    return { ...user, following: Boolean(follow) };
  }

  async followProfile(userId: number, username: string): Promise<ProfileType> {
    const user = await this.userRepository.findOne({ username });
    if (!user) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    if (userId === user.id) {
      throw new HttpException(
        "Follower and following can't be equal",
        HttpStatus.BAD_REQUEST,
      );
    }

    const follow = await this.followRepository.findOne({
      followId: userId,
      followingId: user.id,
    });
    if (!follow) {
      const followToCreate = new FollowEntity();
      followToCreate.followId = userId;
      followToCreate.followingId = user.id;
      await this.followRepository.save(followToCreate);
    }
    return { ...user, following: true };
  }

  async deleteFollowProfile(
    userId: number,
    username: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOne({ username });
    if (!user) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    if (userId === user.id) {
      throw new HttpException(
        "Follower and following can't be equal",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.followRepository.delete({
      followId: userId,
      followingId: user.id,
    });
    return { ...user, following: false };
  }

  buildProfileResponse(profile: ProfileType): ProfileResponseInterface {
    delete profile.email;
    return {
      profile,
    };
  }
}
