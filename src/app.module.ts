import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { CategoryModule } from './category/category.module';
import dataSource from './config/typeorm.config';
import { ProductsModule } from './products/products.module';
import { TransactionModule } from './transaction/transaction.module';
import { User } from './users/entities/user/user.entity';
import { UsersModule } from './users/users.module';
import { ImagesModule } from './images/images.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { StripeModule } from './stripe/stripe.module';
import { EmailModule } from './email/email.module';
import { OptionalJwtAuthGuard } from './auth/guards/optional-jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(dataSource.options),
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoryModule,
    TransactionModule,
    ImagesModule,
    CloudinaryModule,
    StripeModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    { provide: APP_GUARD, useClass: OptionalJwtAuthGuard },
  ],
})
export class AppModule {}
