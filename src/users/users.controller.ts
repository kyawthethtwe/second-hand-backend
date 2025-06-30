import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from './entities/user/user.entity';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Roles(UserRole.ADMIN)
  @Get()
  async getAllUsers() {
    return this.usersService.getAll();
  }
}
