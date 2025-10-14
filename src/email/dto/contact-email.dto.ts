import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ContactEmailDto {
  @ApiProperty({
    description: 'Name of the person contacting',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email of the person contacting',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Subject of the contact email',
    example: 'Inquiry about product',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Message of the contact email',
    example: 'I would like to know more about your product.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
