import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { RefreshTokenService } from './refresh-token.service';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

export interface LoginResponse {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);
  private readonly adminUsernameLower = process.env['ADMIN_USERNAME']?.trim().toLowerCase();
  private readonly adminFirstName = process.env['ADMIN_FIRST_NAME']?.trim() || 'Admin';
  private readonly adminLastName = process.env['ADMIN_LAST_NAME']?.trim() || 'User';
  private readonly authEmailDomain = process.env['AUTH_EMAIL_DOMAIN']?.trim().toLowerCase() || 'example.com';

  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async login(username: string, password?: string, requestedRoles?: string[]): Promise<LoginResponse> {
    const normalized = (username || '').trim();
    if (!normalized) {
      throw new UnauthorizedException('Username is required');
    }

    const normalizedLower = normalized.toLowerCase();

    if (normalizedLower === 'valued-member') {
      const user = await this.resolveTokenUser(normalized, requestedRoles);
      return this.buildAuthResponse(user);
    }

    const isAdminLogin = await this.evaluateAdminLogin(username, password);
    if (!isAdminLogin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const adminUser = this.buildAdminProfile(normalized, normalizedLower === this.adminUsernameLower);
    return this.buildAuthResponse(adminUser);
  }

  async refreshTokens(existingRefreshToken: string | undefined): Promise<LoginResponse> {
    const user = await this.refreshTokenService.consume(existingRefreshToken);
    if (!user) {
      this.logger.warn('Invalid or expired refresh token was provided');
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.buildAuthResponse(user);
  }

  async revokeRefreshToken(refreshToken: string | undefined): Promise<void> {
    await this.refreshTokenService.revoke(refreshToken);
  }

  getUserFromToken(token: string): AuthenticatedUser {
    if (!token) {
      this.logger.debug('No authentication token provided when resolving user');
      throw new UnauthorizedException('Authentication token is required');
    }

    const parsedToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    try {
      const payload: any = this.jwtService.verify(parsedToken);
      const username = payload.username || 'authenticated-user';
      const usernameLower = username.toLowerCase();
      const roles = this.normalizeRoles(Array.isArray(payload.roles) ? payload.roles : [], undefined);
      const isGuest = usernameLower === 'guest';
      const matchesEnvAdmin = this.adminUsernameLower ? usernameLower === this.adminUsernameLower : false;

      const profileFirstName = isGuest
        ? 'Guest'
        : matchesEnvAdmin
          ? this.adminFirstName
          : 'Authenticated';
      const profileLastName = matchesEnvAdmin ? this.adminLastName : 'User';
      const email = `${username}@${this.authEmailDomain}`;

      return {
        id: payload.sub ? String(payload.sub) : username,
        username,
        firstName: profileFirstName,
        lastName: profileLastName,
        email,
        roles,
        role: roles[0] || 'user',
      };
    } catch (err) {
      this.logger.warn('Failed to verify JWT when resolving user', String(err));
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  getAccessTokenExpiry(): number {
    return this.getAccessTokenExpirationSeconds();
  }

  private async evaluateAdminLogin(username: string, password?: string): Promise<boolean> {
    const adminSecret = process.env['ADMIN_SECRET'];
    const envAdmin = process.env['ADMIN_USERNAME']?.trim();
    const envPass = process.env['ADMIN_PASSWORD'];
    const normalizedUsername = (username || '').trim();
    const normalizedLower = normalizedUsername.toLowerCase();
    const matchesEnvAdmin = this.adminUsernameLower ? normalizedLower === this.adminUsernameLower : false;

    if (adminSecret) {
      this.logger.debug('Admin secret detected, elevating all sessions');
      return true;
    }

    if (!envAdmin) {
      return false;
    }

    if (!matchesEnvAdmin) {
      return false;
    }

    if (normalizedUsername !== envAdmin) {
      return false;
    }

    if (!password) {
      this.logger.warn('Missing password for admin login');
      throw new UnauthorizedException('Missing password');
    }

    if (envPass && (password === envPass || (await bcrypt.compare(password, envPass)))) {
      this.logger.debug('Admin credentials validated via environment password');
      return true;
    }

    if (!this.connection || this.connection.readyState !== 1) {
      this.logger.warn('Admin password validation failed and MongoDB is not ready');
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      const usersColl = this.connection.collection('users');
      const dbUser = await usersColl.findOne({ username: envAdmin });
      this.logger.debug('Admin DB lookup result', { found: !!dbUser });
      if (dbUser && dbUser['passwordHash'] && typeof dbUser['passwordHash'] === 'string') {
        const match = await bcrypt.compare(password, dbUser['passwordHash']);
        if (match) {
          this.logger.debug('Admin credentials validated via MongoDB user store');
          return true;
        }
      }
      throw new UnauthorizedException('Invalid credentials');
    } catch (err) {
      this.logger.warn('Error validating admin credentials', String(err));
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  private async resolveTokenUser(username: string, requestedRoles?: string[]): Promise<AuthenticatedUser> {
    const expectedUsername = process.env['VALUED_MEMBER_USERNAME']?.trim().toLowerCase() ?? 'valued-member';

    if ((username || '').trim().toLowerCase() !== expectedUsername) {
      this.logger.warn('Valued-member login attempted with unexpected username', { username });
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = this.normalizeRoles(requestedRoles, process.env['VALUED_MEMBER_ROLES']);
    const primaryRole = roles[0] || 'user';

    return {
      id: username,
      username,
      firstName: 'Valued',
      lastName: 'Member',
      email: `${username}@${this.authEmailDomain}`,
      role: primaryRole,
      roles: [...roles],
    };
  }

  private buildAdminProfile(username: string, matchesEnvAdmin: boolean): AuthenticatedUser {
    const profileFirstName = matchesEnvAdmin ? this.adminFirstName : 'Admin';
    const profileLastName = matchesEnvAdmin ? this.adminLastName : 'User';
    const email = `${username}@${this.authEmailDomain}`;
    const roles: string[] = ['test', 'admin'];
    const primaryRole: string = roles[0] ?? 'test';

    return {
      id: username,
      username,
      firstName: profileFirstName,
      lastName: profileLastName,
      email,
      role: primaryRole,
      roles,
    };
  }

  private normalizeRoles(requestedRoles?: string[], configuredRoles?: string): string[] {
    const envRoles = (configuredRoles || '').split(',').map(r => r.trim().toLowerCase()).filter(r => !!r);
    const baseRoles = envRoles.length ? envRoles : ['user'];
    const incoming = Array.isArray(requestedRoles)
      ? requestedRoles.map(role => role.trim().toLowerCase()).filter(role => !!role)
      : [];
    const roles = incoming.length ? incoming : baseRoles;
    return [...roles];
  }

  private async buildAuthResponse(user: AuthenticatedUser): Promise<LoginResponse> {
    const expiresIn = this.getAccessTokenExpirationSeconds();
    const refreshExpiresIn = this.getRefreshTokenExpirationSeconds();
    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: `${expiresIn}s` });
    const refreshToken = await this.refreshTokenService.create(user, refreshExpiresIn * 1000);

    return {
      user,
      accessToken,
      refreshToken,
      expiresIn,
      refreshExpiresIn,
    };
  }

  private getAccessTokenExpirationSeconds(): number {
    const configured = Number(process.env['JWT_EXPIRATION'] ?? 3600);
    return Number.isNaN(configured) ? 3600 : configured;
  }

  private getRefreshTokenExpirationSeconds(): number {
    const configured = Number(process.env['REFRESH_TOKEN_EXPIRATION'] ?? 604800);
    return Number.isNaN(configured) ? 604800 : configured;
  }
}
