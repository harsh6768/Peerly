import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Resend } from 'resend';

type SendWorkEmailOtpParams = {
  otp: string;
  to: string;
  recipientName: string;
  companyName: string;
  expiresInMinutes: number;
};

@Injectable()
export class ResendEmailService {
  private readonly logger = new Logger(ResendEmailService.name);

  async sendWorkEmailOtp(params: SendWorkEmailOtpParams) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL ?? 'Trusted Network <onboarding@resend.dev>';

    if (!apiKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException(
          'RESEND_API_KEY must be configured before sending OTP emails in production.',
        );
      }

      this.logger.warn('RESEND_API_KEY is not configured. Falling back to OTP preview mode.');
      return {
        provider: 'preview' as const,
        delivered: false,
      };
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [params.to],
      subject: `Your ${params.companyName || 'organization'} verification code`,
      html: this.renderOtpHtml(params),
      text: this.renderOtpText(params),
    });

    if (error) {
      this.logger.error(`Resend failed to send OTP email: ${error.message}`);
      throw new InternalServerErrorException('Unable to send verification email right now.');
    }

    return {
      provider: 'resend' as const,
      delivered: true,
    };
  }

  private renderOtpHtml(params: SendWorkEmailOtpParams) {
    return `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <p>Hi ${escapeHtml(params.recipientName || 'there')},</p>
        <p>Use the verification code below to confirm your professional email on Trusted Network.</p>
        <div style="margin: 24px 0; padding: 18px 20px; border-radius: 16px; background: #f5f3ff; border: 1px solid #ddd6fe; display: inline-block;">
          <div style="font-size: 28px; font-weight: 700; letter-spacing: 0.3em;">${params.otp}</div>
        </div>
        <p>This code expires in ${params.expiresInMinutes} minutes.</p>
        <p>If you did not request this verification, you can ignore this email.</p>
        <p>Trusted Network</p>
      </div>
    `.trim();
  }

  private renderOtpText(params: SendWorkEmailOtpParams) {
    return [
      `Hi ${params.recipientName || 'there'},`,
      '',
      'Use the verification code below to confirm your professional email on Trusted Network.',
      '',
      `OTP: ${params.otp}`,
      '',
      `This code expires in ${params.expiresInMinutes} minutes.`,
      '',
      'If you did not request this verification, you can ignore this email.',
      '',
      'Trusted Network',
    ].join('\n');
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
