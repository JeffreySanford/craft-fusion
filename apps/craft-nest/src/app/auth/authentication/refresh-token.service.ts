import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async create(user: AuthenticatedUser, expiresInMs: number): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInMs);

    await this.refreshTokenModel.create({
      token,
      userId: user.id,
      user,
      expiresAt,
      createdAt: new Date(),
    });

    return token;
  }

  async consume(token: string | undefined): Promise<AuthenticatedUser | null> {
    if (!token) {
      return null;
    }

    const entry = await this.refreshTokenModel.findOne({ token }).exec();
    if (!entry) {
      return null;
    }

    if (entry.expiresAt.getTime() <= Date.now()) {
      await this.refreshTokenModel.deleteOne({ token }).exec();
      return null;
    }

    await this.refreshTokenModel.deleteOne({ token }).exec();
    return entry.user;
  }

  async revoke(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }

    await this.refreshTokenModel.deleteOne({ token }).exec();
  }
}
