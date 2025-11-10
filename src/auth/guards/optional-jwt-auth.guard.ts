import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to not throw errors
  handleRequest(err: any, user: any): any {
    // If there's a user, return it
    return user || undefined;
  }
}
