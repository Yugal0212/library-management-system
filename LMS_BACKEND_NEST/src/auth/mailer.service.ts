import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;
  private emailConfigured: boolean;

  constructor() {
    // Check if email is properly configured
    this.emailConfigured = !!(
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    );

    if (this.emailConfigured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      console.warn('Email service not configured. OTPs will be logged to console.');
    }
  }

  async sendOtpEmail(to: string, subject: string, otp: string) {
    if (!this.emailConfigured) {
      console.log(`[EMAIL NOT CONFIGURED] OTP for ${to}: ${otp}`);
      return;
    }

    const html = `<p>Your verification code is <b>${otp}</b>. It expires in 10 minutes.</p>`;
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  }

  async sendLibrarianRequestNotification(adminEmail: string, librarianName: string, librarianEmail: string) {
    const html = `
      <h2>New Librarian Registration Request</h2>
      <p>A new librarian has registered and requires approval:</p>
      <ul>
        <li><strong>Name:</strong> ${librarianName}</li>
        <li><strong>Email:</strong> ${librarianEmail}</li>
      </ul>
      <p>Please review this request in the admin dashboard.</p>
    `;
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: 'New Librarian Registration Request',
      html,
    });
  }

  async sendLibrarianApprovalNotification(to: string, approved: boolean) {
    const subject = approved ? 'Librarian Registration Approved' : 'Librarian Registration Rejected';
    const html = approved
      ? '<p>Your librarian registration request has been approved. You can now log in to the library management system.</p>'
      : '<p>Your librarian registration request has been rejected. Please contact the administrator for more information.</p>';
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  }

  async sendLoanEmail(to: string, userName: string, bookTitle: string, dueDate: Date) {
    const html = `
      <h2>Book Borrowed Successfully</h2>
      <p>Dear ${userName},</p>
      <p>You have successfully borrowed the book: <strong>${bookTitle}</strong></p>
      <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
      <p>Please return the book on time to avoid any fines.</p>
      <p>Thank you for using our library!</p>
    `;
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Book Borrowed - Library Management System',
      html,
    });
  }

  async sendReturnEmail(to: string, userName: string, bookTitle: string) {
    const html = `
      <h2>Book Returned Successfully</h2>
      <p>Dear ${userName},</p>
      <p>You have successfully returned the book: <strong>${bookTitle}</strong></p>
      <p>Thank you for returning the book on time!</p>
      <p>We hope you enjoyed reading it.</p>
    `;
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Book Returned - Library Management System',
      html,
    });
  }

  async sendReservationEmail(to: string, userName: string, bookTitle: string, expiresAt: Date) {
    const html = `
      <h2>Book Reserved Successfully</h2>
      <p>Dear ${userName},</p>
      <p>You have successfully reserved the book: <strong>${bookTitle}</strong></p>
      <p><strong>Reservation expires:</strong> ${expiresAt.toLocaleDateString()}</p>
      <p>You will be notified when the book becomes available.</p>
      <p>Thank you for using our library!</p>
    `;
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Book Reserved - Library Management System',
      html,
    });
  }

  async sendReservationCancellationEmail(to: string, userName: string, bookTitle: string) {
    const html = `
      <h2>Reservation Cancelled</h2>
      <p>Dear ${userName},</p>
      <p>Your reservation for the book: <strong>${bookTitle}</strong> has been cancelled.</p>
      <p>If you still need this book, you can place a new reservation.</p>
      <p>Thank you for using our library!</p>
    `;
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Reservation Cancelled - Library Management System',
      html,
    });
  }

  async sendReservationAvailableEmail(to: string, userName: string, bookTitle: string) {
    const html = `
      <h2>Book Available for Pickup</h2>
      <p>Dear ${userName},</p>
      <p>The book you reserved is now available: <strong>${bookTitle}</strong></p>
      <p>Please visit the library to borrow this book within the next 24 hours.</p>
      <p>If you don't pick it up within this time, your reservation will expire.</p>
      <p>Thank you for using our library!</p>
    `;
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Book Available - Library Management System',
      html,
    });
  }

  async sendDueDateReminderEmail(to: string, userName: string, bookTitle: string, dueDate: Date) {
    const html = `
      <h2>Book Due Date Reminder</h2>
      <p>Dear ${userName},</p>
      <p>This is a friendly reminder that your book is due soon:</p>
      <p><strong>Book:</strong> ${bookTitle}</p>
      <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
      <p>Please return the book on time to avoid any fines.</p>
      <p>If you need more time, you can renew the book if it's not reserved by another user.</p>
      <p>Thank you for using our library!</p>
    `;
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Book Due Date Reminder - Library Management System',
      html,
    });
  }

  async sendOverdueEmail(to: string, userName: string, bookTitle: string, dueDate: Date, fineAmount: number) {
    const html = `
      <h2>Book Overdue Notice</h2>
      <p>Dear ${userName},</p>
      <p>Your book is overdue:</p>
      <p><strong>Book:</strong> ${bookTitle}</p>
      <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
      <p><strong>Current Fine:</strong> $${fineAmount.toFixed(2)}</p>
      <p>Please return the book as soon as possible to avoid additional fines.</p>
      <p>Fines accumulate daily until the book is returned.</p>
      <p>Thank you for your prompt attention to this matter.</p>
    `;
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Book Overdue - Library Management System',
      html,
    });
  }
}

