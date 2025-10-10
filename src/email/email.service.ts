import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { SendEmailDto } from './dto/send-email.dto';
@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    sgMail.setApiKey(apiKey || '');
  }
  async sendEmail(sendEmailDto: SendEmailDto): Promise<void> {
    const from = this.configService.get<string>('SENDGRID_SENDER_EMAIL');
    const msg = {
      to: sendEmailDto.to,
      from: from || '<default_sender@example.com>',
      subject: sendEmailDto.subject,
      ...(sendEmailDto.html
        ? { html: sendEmailDto.html }
        : { text: sendEmailDto.text || 'No content provided' }),
    };
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}
