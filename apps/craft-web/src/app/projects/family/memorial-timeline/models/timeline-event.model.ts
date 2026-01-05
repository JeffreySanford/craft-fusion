export type TimelineEventType = 'personal' | 'timeline' | 'historical' | 'anniversary' | 'project';

export interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  description: string;
  imageUrl?: string;
  actionLink?: string;
  type?: TimelineEventType;
}
