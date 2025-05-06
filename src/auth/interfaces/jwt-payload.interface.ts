import { UserRole } from '../../users/entities/user/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
}

export interface AccessTokenPayload extends JwtPayload {
  role: UserRole;
}

export interface RefreshTokenPayload extends JwtPayload {
  tokenType: 'refresh';
}
