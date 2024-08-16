import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  public verify(token: string): Promise<any> {
    return this.jwtService.verify(token.split('Bearer ')?.[1], {
      secret: this.configService.get('AUTH_SECRET'),
    });
  }
}
