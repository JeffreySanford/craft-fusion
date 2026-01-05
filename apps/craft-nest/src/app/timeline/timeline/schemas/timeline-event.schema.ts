import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum TimelineEventType {
  PERSONAL = 'personal',
  TIMELINE = 'timeline',
  HISTORICAL = 'historical',
  ANNIVERSARY = 'anniversary',
  PROJECT = 'project'
}

@Schema({ timestamps: true })
export class TimelineEvent extends Document {
  @Prop({ required: true })
  title: string = '';

  @Prop({ required: true })
  description: string = '';

  @Prop({ required: true })
  date: Date = new Date();

  @Prop()
  imageUrl?: string;

  @Prop()
  actionLink?: string;

  @Prop({
    type: String,
    enum: Object.values(TimelineEventType),
    default: TimelineEventType.PERSONAL
  })
  type: TimelineEventType = TimelineEventType.PERSONAL;

  @Prop()
  createdAt: Date = new Date();

  @Prop()
  updatedAt: Date = new Date();
}

export const TimelineEventSchema = SchemaFactory.createForClass(TimelineEvent);
