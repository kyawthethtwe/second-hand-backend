import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  v2 as Cloudinary,
  UploadApiOptions,
  UploadApiResponse,
  UrlOptions,
} from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private cloudinary: typeof Cloudinary) {}

  async uploadImage(
    file: Express.Multer.File,
    options?: UploadApiOptions,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader
        .upload_stream(options || {}, (error, result) => {
          if (error) return reject(new BadRequestException(error.message));
          if (result) resolve(result);
        })
        .end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<{ result: string }> {
    try {
      const result = (await this.cloudinary.uploader.destroy(publicId)) as {
        result: string;
      };
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete image';
      throw new BadRequestException(errorMessage);
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    options?: UploadApiOptions,
  ): Promise<UploadApiResponse[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file, options));
    return Promise.all(uploadPromises);
  }

  getImageUrl(publicId: string, options?: UrlOptions): string {
    return this.cloudinary.url(publicId, options);
  }
}
