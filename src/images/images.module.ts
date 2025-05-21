import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ProductImage } from './entities/image.entity';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductImage]), CloudinaryModule],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService], // Export service for use in other modules (like Products)
})
export class ImagesModule {}
