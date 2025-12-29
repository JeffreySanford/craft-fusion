export interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  description: string;
  imageUrl: string;
  actionLink?: string;
  // Add any other existing properties
}
