import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtService } from '@nestjs/jwt';
import { TransactionService } from '../common/transaction.service';
import { ActivityType } from '../common/enums';
import * as bcrypt from 'bcrypt';
import { MailerService } from './mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
    private readonly transactionService: TransactionService,
  ) {}

  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private async signTokens(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    // Check if email exists in users, pending users, or pending librarians
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const pendingUser = await this.prisma.pendingUser.findUnique({
      where: { email: dto.email },
    });
    const pendingLibrarian = await this.prisma.pendingLibrarian.findUnique({
      where: { email: dto.email },
    });
    
    if (exists || pendingUser || pendingLibrarian) {
      throw new BadRequestException('Email already in use');
    }

    const isLibrarian = dto.role === 'LIBRARIAN';
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const metadata = dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : {};
    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    if (isLibrarian) {
      // For librarians, create pending registration (needs admin approval)
      await this.prisma.pendingLibrarian.create({
        data: {
          email: dto.email,
          name: dto.name,
          password: hashedPassword,
          metadata,
          otp,
          otpExpiry,
          expiresAt,
          status: 'PENDING',
        },
      });

      // Send OTP for email verification
      try {
        await this.mailer.sendOtpEmail(dto.email, 'Verify your email', otp);
        console.log(`OTP email sent successfully to ${dto.email}`);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        console.log(`OTP for ${dto.email}: ${otp}`);
      }
      
      return { 
        message: 'Registration initiated. Please verify your email first, then await admin approval.',
        isLibrarian: true,
        isVerified: false,
        requiresApproval: true
      };
    } else {
      // For patrons, create pending user (auto-approved after email verification)
      await this.prisma.pendingUser.create({
        data: {
          email: dto.email,
          name: dto.name,
          password: hashedPassword,
          role: dto.role,
          metadata,
          otp,
          otpExpiry,
          expiresAt,
        },
      });

      // Send OTP email
      try {
        await this.mailer.sendOtpEmail(dto.email, 'Verify your email', otp);
        console.log(`OTP email sent successfully to ${dto.email}`);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        console.log(`OTP for ${dto.email}: ${otp}`);
      }
      
      return { 
        message: 'Registration successful. Please verify your email to complete registration.',
        isLibrarian: false,
        isVerified: false,
        requiresApproval: false
      };
    }
  }

  async verifyEmail(dto: VerifyEmailDto) {
    // Check pending users, regular users, and pending librarians
    const pendingUser = await this.prisma.pendingUser.findUnique({
      where: { email: dto.email },
    });
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const pendingLibrarian = await this.prisma.pendingLibrarian.findUnique({
      where: { email: dto.email },
    });

    if (!pendingUser && !user && !pendingLibrarian) {
      throw new BadRequestException('Invalid email');
    }

    // Handle pending user verification (patrons)
    if (pendingUser) {
      if (!pendingUser.otp || !pendingUser.otpExpiry) {
        throw new BadRequestException('No OTP generated');
      }
      if (pendingUser.otp !== dto.otp) {
        throw new BadRequestException('Invalid OTP');
      }
      if (new Date() > pendingUser.otpExpiry) {
        throw new BadRequestException('OTP expired');
      }
      if (new Date() > pendingUser.expiresAt) {
        throw new BadRequestException('Registration expired. Please register again.');
      }

      // Move from PendingUser to User table
      const newUser = await this.prisma.user.create({
        data: {
          email: pendingUser.email,
          name: pendingUser.name,
          password: pendingUser.password,
          role: pendingUser.role,
          isVerified: true,
          metadata: pendingUser.metadata || {},
        },
      });

      // Delete from pending table
      await this.prisma.pendingUser.delete({
        where: { id: pendingUser.id },
      });

      // Generate tokens for auto-login
      const { accessToken, refreshToken } = await this.signTokens({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role as any,
      });

      // Update refresh token in database
      await this.prisma.user.update({
        where: { id: newUser.id },
        data: { refreshToken },
      });

      // Log activity (commenting out for now - can be added later)
      // await this.transactionService.logActivity(...);

      // Remove sensitive data
      const { password, refreshToken: ___, ...userInfo } = newUser;

      return {
        message: 'Email verified successfully. You are now logged in.',
        user: userInfo,
        accessToken,
        refreshToken,
        isLibrarian: false,
      };
    }

    if (user) {
      // Handle regular user verification (legacy - shouldn't happen with new flow)
      if (!user.otp || !user.otpExpiry)
        throw new BadRequestException('No OTP generated');
      if (user.isVerified) 
        return { message: 'Email already verified' };
      if (user.otp !== dto.otp) 
        throw new BadRequestException('Invalid OTP');
      if (new Date() > user.otpExpiry)
        throw new BadRequestException('OTP expired');

      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, otp: null, otpExpiry: null },
      });
      
      // Generate tokens for auto-login after verification
      const { accessToken, refreshToken } = await this.signTokens({
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role as any,
      });
      
      // Update refresh token in database
      await this.prisma.user.update({
        where: { id: updatedUser.id },
        data: { refreshToken },
      });
      
      // Remove sensitive data
      const { password, otp: _, otpExpiry: __, refreshToken: ___, ...userInfo } = updatedUser;
      
      return { 
        message: 'Email verified successfully. You are now logged in.',
        user: userInfo,
        accessToken,
        refreshToken,
        isLibrarian: false
      };
    }

    if (pendingLibrarian) {
      // Handle pending librarian verification
      if (!pendingLibrarian.otp || !pendingLibrarian.otpExpiry)
        throw new BadRequestException('No OTP generated');
      if (pendingLibrarian.isVerified)
        return { message: 'Email already verified. Waiting for admin approval.' };
      if (pendingLibrarian.otp !== dto.otp)
        throw new BadRequestException('Invalid OTP');
      if (pendingLibrarian.otpExpiry && new Date() > pendingLibrarian.otpExpiry)
        throw new BadRequestException('OTP expired');

      // Update pending librarian status
      const updatedLibrarian = await this.prisma.pendingLibrarian.update({
        where: { id: pendingLibrarian.id },
        data: { 
          isVerified: true,
          otp: null,
          otpExpiry: null
        },
      });

      // Notify admins about the new librarian request
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN', isVerified: true },
      });

      // Send notification to all admins
      for (const admin of admins) {
        try {
          await this.mailer.sendLibrarianRequestNotification(
            admin.email,
            updatedLibrarian.name,
            updatedLibrarian.email
          );
        } catch (error) {
          console.error(`Failed to send notification to admin ${admin.email}:`, error);
        }
      }

      return { 
        message: 'Email verified successfully. Your registration is pending admin approval. You will receive an email once approved.',
        isLibrarian: true
      };
    }

    throw new BadRequestException('Invalid email');
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isVerified) throw new UnauthorizedException('Email not verified');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const { accessToken, refreshToken } = await this.signTokens({
      id: user.id,
      email: user.email,
      role: user.role as any,
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Log successful login
    await this.transactionService.logActivity(
      user.id,
      ActivityType.USER_ACTIVATED,
      `User logged in successfully`
    );

    // Remove sensitive information from user object
    const { password, otp, otpExpiry, refreshToken: _, ...userInfo } = user;
    return {
      user: userInfo,
      accessToken,
      refreshToken,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) return { message: 'If the email exists, OTP has been sent' };

    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry },
    });
    await this.mailer.sendOtpEmail(dto.email, 'Reset your password', otp);
    return { message: 'OTP sent if the email exists' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.otp || !user.otpExpiry)
      throw new BadRequestException('Invalid request');
    if (user.otp !== dto.otp) throw new BadRequestException('Invalid OTP');
    if (new Date() > user.otpExpiry)
      throw new BadRequestException('OTP expired');
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash, otp: null, otpExpiry: null },
    });
    return { message: 'Password reset successful' };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      if (!dto.refreshToken) {
        throw new UnauthorizedException('Refresh token is required');
      }

      const payload = await this.jwt.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== dto.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.signTokens({
        id: user.id,
        email: user.email,
        role: user.role as any,
      });

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(dto: RefreshTokenDto) {
    try {
      // Skip token verification if no token or empty string
      if (!dto.refreshToken) {
        return { message: 'Logged out' };
      }

      const payload = await this.jwt.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      if (payload?.sub) {
        // Clear refresh token from database only if we have a valid user ID
        await this.prisma.user.update({
          where: { id: payload.sub },
          data: { refreshToken: null },
        });
      }
    } catch (error) {
      // Ignore verification errors during logout
    }

    return { message: 'Logged out' };
  }
}
