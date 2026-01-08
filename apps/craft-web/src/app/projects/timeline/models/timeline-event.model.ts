export type TimelineEventType =
  | 'personal'
  | 'family'
  | 'timeline'
  | 'historical'
  | 'anniversary'
  | 'project'
  | 'professional'
  | 'education';

export interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  description: string;
  imageUrl?: string;
  actionLink?: string;
  person?: string;
  type?: TimelineEventType;
}
