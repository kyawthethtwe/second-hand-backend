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
    console.log('File details in uploadImage:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferLength: file.buffer?.length,
    });

    return new Promise((resolve, reject) => {
      // Check if file buffer exists
      if (!file.buffer) {
        return reject(new BadRequestException('File buffer is missing'));
      }

      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto', // Automatically detect file type
          ...options, // Merge with any additional options passed
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(
              new BadRequestException(
                `Error uploading image: ${error.message}`,
              ),
            );
          }
          if (result) {
            console.log('Cloudinary upload success:', {
              public_id: result.public_id,
              secure_url: result.secure_url,
            });
            resolve(result);
          } else {
            reject(
              new BadRequestException('Upload failed - no result returned'),
            );
          }
        },
      );

      // Write the file buffer to the upload stream
      uploadStream.end(file.buffer);
    });
  }

  // Alternative method using base64 encoding
  async uploadImageBase64(
    file: Express.Multer.File,
    options?: UploadApiOptions,
  ): Promise<UploadApiResponse> {
    try {
      if (!file.buffer) {
        throw new BadRequestException('File buffer is missing');
      }

      // Convert buffer to base64 data URI
      const base64String = file.buffer.toString('base64');
      const dataUri = `data:${file.mimetype};base64,${base64String}`;

      const result = await this.cloudinary.uploader.upload(dataUri, {
        resource_type: 'auto',
        ...options,
      });

      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Error uploading image: ${errorMessage}`);
    }
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
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file) => this.uploadImage(file, options));

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw new BadRequestException('Failed to upload one or more images');
    }
  }

  getImageUrl(publicId: string, options?: UrlOptions): string {
    return this.cloudinary.url(publicId, options);
  }

  // Helper method to get optimized image URL
  getOptimizedImageUrl(
    publicId: string,
    width?: number,
    height?: number,
    quality?: string | number,
  ): string {
    return this.cloudinary.url(publicId, {
      width,
      height,
      quality: quality || 'auto',
      fetch_format: 'auto',
      crop: 'fill',
    });
  }
}
