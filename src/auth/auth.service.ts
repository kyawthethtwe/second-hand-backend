import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Cache } from 'cache-manager';
import { randomBytes } from 'crypto';
import { User } from 'src/users/entities/user/user.entity';
import { UsersService } from 'src/users/users.service';
import { RefreshTokenPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOGIN_ATTEMPT_WINDOW = 15 * 60; // 15 minutes in seconds
  private readonly PASSWORD_RESET_EXPIRY = 3600; // 1 hour in seconds

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const loginAttempts = await this.getLoginAttempts(email);
    if (loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      throw new UnauthorizedException(
        'Too many login attempts. Please try again later.',
      );
    }

    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      await this.resetLoginAttempts(email);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }

    await this.incrementLoginAttempts(email);
    return null;
  }

  async login(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    // Store refresh token in cache with user ID
    await this.cacheManager.set(
      `refresh_token:${user.id}`,
      refreshToken,
      this.configService.get('REFRESH_TOKEN_EXPIRES_IN'),
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        },
      );

      const storedToken = await this.cacheManager.get(
        `refresh_token:${payload.sub}`,
      );
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newAccessToken = await this.generateAccessToken(user);
      return { access_token: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException(`Invalid refresh token, ${error}`);
    }
  }

  async register(email: string, password: string, name: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Password strength validation
    if (!this.isPasswordStrong(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters',
      );
    }

    const user = await this.usersService.create(email, password, name);
    return this.login(user);
  }

  async logout(userId: string) {
    await this.cacheManager.del(`refresh_token:${userId}`);
    return { message: 'Successfully logged out' };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    await this.cacheManager.set(
      `password_reset:${email}`,
      hashedToken,
      this.PASSWORD_RESET_EXPIRY,
    );

    // TODO: Send email with reset token
    // This would typically integrate with an email service
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const storedToken = await this.cacheManager.get(`password_reset:${email}`);
    if (!storedToken) {
      throw new BadRequestException('Password reset token has expired');
    }

    const isValidToken = await bcrypt.compare(token, storedToken as string);
    if (!isValidToken) {
      throw new BadRequestException('Invalid password reset token');
    }

    if (!this.isPasswordStrong(newPassword)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);
    await this.cacheManager.del(`password_reset:${email}`);
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      return true;
    } catch {
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async generateAccessToken(user: User): Promise<string> {
    //attach user to the jwt payload
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async generateRefreshToken(user: User): Promise<string> {
    const payload = {
      email: user.email,
      sub: user.id,
      tokenType: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN'),
    });
  }

  private async getLoginAttempts(email: string): Promise<number> {
    const attempts = await this.cacheManager.get(`login_attempts:${email}`);
    return attempts ? Number(attempts) : 0;
  }

  private async incrementLoginAttempts(email: string): Promise<void> {
    const attempts = await this.getLoginAttempts(email);
    await this.cacheManager.set(
      `login_attempts:${email}`,
      attempts + 1,
      this.LOGIN_ATTEMPT_WINDOW,
    );
  }

  private async resetLoginAttempts(email: string): Promise<void> {
    await this.cacheManager.del(`login_attempts:${email}`);
  }

  private isPasswordStrong(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }
}
