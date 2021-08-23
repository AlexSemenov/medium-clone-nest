import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from '@app/user/dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@app/user/entities/user.entity';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { JWT_SECRET } from '@app/config';
import { UserResponseInterface } from '@app/user/types/user-response.interface';
import { LoginUserDto } from '@app/user/dto/login-user.dto';
import { compare } from 'bcrypt';
import { UpdateUserDto } from '@app/user/dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const errorResponse = {
      errors: {},
    };
    const userByEmail = await this.userByEmail(createUserDto.email);
    const userByUsername = await this.userByUsername(createUserDto.username);

    if (userByEmail) {
      errorResponse.errors['email'] = 'has already been taken';
    }

    if (userByUsername) {
      errorResponse.errors['username'] = 'has already been taken';
    }

    if (userByEmail || userByUsername) {
      throw new HttpException(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const user = new UserEntity();
    Object.assign(user, createUserDto);
    return await this.userRepository.save(user);
  }

  async loginUser(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const user = await this.userByUsername(loginUserDto.username);
    if (!user || !compare(loginUserDto.password, user.password)) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    delete user.password;
    return user;
  }

  buildUserResponse(userEntity?: UserEntity): UserResponseInterface {
    return {
      user: {
        ...userEntity,
        token: this.generateJwt(userEntity),
      },
    };
  }

  generateJwt(userEntity: UserEntity): string {
    return sign(
      {
        id: userEntity.id,
        username: userEntity.username,
        email: userEntity.email,
      },
      JWT_SECRET,
    );
  }

  async findById(id: number): Promise<UserEntity> {
    return this.userRepository.findOne(id);
  }

  async userByEmail(email: string): Promise<UserEntity> {
    return this.userRepository.findOne({ email });
  }

  async userByUsername(username: string): Promise<UserEntity> {
    return this.userRepository.findOne(
      { username },
      { select: ['username', 'bio', 'password', 'id', 'email', 'image'] },
    );
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const user = await this.findById(userId);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }
}
