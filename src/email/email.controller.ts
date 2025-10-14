import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { ContactEmailDto } from './dto/contact-email.dto';

@Controller('contact')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post()
  async sendContactEmail(@Body() contactEmailDto: ContactEmailDto) {
    await this.emailService.sendContactEmail(contactEmailDto);
    return { message: 'Contact email sent successfully' };
  }
}
