import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          if (!req) return null;
          // Prefer cookie named 'accessToken'
          const tokenFromCookie = req.cookies?.accessToken;
          if (typeof tokenFromCookie === 'string' && tokenFromCookie.length > 0) {
            return tokenFromCookie;
          }
          // Fallback to Authorization: Bearer <token>
          return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: any) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Verify the user still exists and is verified
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('User email not verified');
    }

    return {
      id: user.id,
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}

