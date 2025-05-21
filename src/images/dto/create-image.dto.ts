import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateImageDto {
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;
}
