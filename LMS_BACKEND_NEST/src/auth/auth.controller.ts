import { Body, Controller, Post, Get, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Response } from 'express';
import { parseDurationMs } from './utils/parse-duration';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.login(dto);

    const isProd = process.env.NODE_ENV === 'production';
    
    // Check if request is from localhost or network address
    const isLocalhost = dto.email && (
      res.req.get('host')?.includes('localhost') || 
      res.req.get('host')?.includes('127.0.0.1')
    );
    
    const cookieBase = {
      httpOnly: true,
      sameSite: isProd ? 'none' as const : (isLocalhost ? 'lax' as const : 'none' as const),
      secure: isProd || !isLocalhost, // Use secure for network access
      path: '/',
      domain: undefined, // Let browser handle domain automatically
    };

    // Helper function to parse duration strings to milliseconds
    const parseDurationMs = (duration: string | undefined): number => {
      if (!duration) return 0;
      const match = duration.match(/^(\d+)([smhd])$/);
      if (!match) return 0;
      
      const value = parseInt(match[1]);
      const unit = match[2];
      
      switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 0;
      }
    };

    // Access token cookie (short lived) - 15 minutes
    const accessMaxAgeMs = parseDurationMs(process.env.JWT_ACCESS_EXPIRES_IN) || 15 * 60 * 1000;
    res.cookie('accessToken', accessToken, { ...cookieBase, maxAge: accessMaxAgeMs });
    
    console.log('Setting accessToken cookie with maxAge:', accessMaxAgeMs);

    // Refresh token cookie (longer lived) - 7 days  
    const refreshMaxAgeMs = parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN) || 7 * 24 * 60 * 60 * 1000;
    res.cookie('refreshToken', refreshToken, { ...cookieBase, maxAge: refreshMaxAgeMs });
    
    console.log('Setting refreshToken cookie with maxAge:', refreshMaxAgeMs);

    // Also return tokens in response for localStorage fallback
    return { 
      user, 
      accessToken,  // Include token in response for localStorage fallback
      refreshToken  // Include refresh token as well
    };
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('refresh-token')
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto, @Res({ passthrough: true }) res: Response) {
    // Clear cookies regardless of token state
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    return this.authService.logout(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() user: any) {
    return { user };
  }
}

