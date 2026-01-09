import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Schema({ collection: 'refresh_tokens' })
export class RefreshToken {
  @Prop({ required: true, unique: true })
  token!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true, type: Object })
  user!: AuthenticatedUser;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: () => new Date() })
  createdAt!: Date;
}

export type RefreshTokenDocument = RefreshToken & Document;

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
