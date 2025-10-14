import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { SendEmailDto } from './dto/send-email.dto';
import { ContactEmailDto } from './dto/contact-email.dto';
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

  async sendContactEmail(contactEmailDto: ContactEmailDto): Promise<void> {
    const from = this.configService.get<string>('SENDGRID_SENDER_EMAIL');
    const adminEmail = this.configService.get<string>('ADMIN_CONTACT_EMAIL');
    const contactMsg = {
      to: adminEmail,
      from: from || '<default_sender@example.com>',
      replyTo: contactEmailDto.email,
      subject: `Contact: ${contactEmailDto.subject}`,
      html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${contactEmailDto.name}</p>
      <p><strong>Email:</strong> ${contactEmailDto.email}</p>
      <p><strong>Subject:</strong> ${contactEmailDto.subject}</p>
      <p><strong>Message:</strong></p>
      <p>${contactEmailDto.message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><em>Click reply to respond directly to ${contactEmailDto.name}</em></p>
    `,
    };

    const userMsg = {
      to: contactEmailDto.email,
      from: from || '<default_sender@example.com>',
      subject: 'We Received Your Message',
      html: `
      <h2>Thank you for contacting us!</h2>
      <p>Hi ${contactEmailDto.name},</p>
      <p>We have received your message and will get back to you soon.</p>
      <p><strong>Your message:</strong></p>
      <p>${contactEmailDto.message.replace(/\n/g, '<br>')}</p>
      <br>
      <p>Best regards,<br>SHE Team</p>
    `,
    };

    try {
      await sgMail.send(contactMsg);
      await sgMail.send(userMsg);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}
