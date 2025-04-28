import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum TimelineEventType {
  ANNIVERSARY = 'ANNIVERSARY',
  MILESTONE = 'MILESTONE',
  MEMORIAL = 'MEMORIAL',
  OTHER = 'OTHER'
}

@Schema({ timestamps: true })
export class TimelineEvent extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop()
  imageUrl?: string;

  @Prop()
  actionLink?: string;

  @Prop({ 
    type: String, 
    enum: Object.values(TimelineEventType),
    default: TimelineEventType.OTHER
  })
  type: TimelineEventType;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const TimelineEventSchema = SchemaFactory.createForClass(TimelineEvent);
