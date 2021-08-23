import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';

import { ExpressRequestInterface } from '@app/shared/types/express-request.interface';
import { JWT_SECRET } from '@app/config';
import { UserService } from '@app/user/services/user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(req: ExpressRequestInterface, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      req.user = null;
      next();
      return;
    }

    const token = req.headers.authorization.split(' ')[1];

    try {
      const decode = verify(token, JWT_SECRET) as any;
      req.user = await this.userService.findById(decode.id);
      next();
    } catch (err) {
      req.user = null;
      next();
    }
  }
}
