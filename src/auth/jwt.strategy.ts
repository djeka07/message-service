import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type Payload = {
  email: string;
  roles: string[];
  id: string;
  applicationId: string;
  refresh?: boolean;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('AUTH_SECRET'),
    });
  }

  async validate(payload: Payload) {
    const { id, email, roles, applicationId } = payload;
    return { email, roles, id, applicationId };
  }
}
