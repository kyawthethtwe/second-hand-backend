import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../../users/entities/user/user.entity';
interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in the configuration');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }
  //attach user to the request object
  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(
    payload: JwtPayload,
  ): Promise<{ userId: string; email: string; role: UserRole; name: string }> {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
  }
}
