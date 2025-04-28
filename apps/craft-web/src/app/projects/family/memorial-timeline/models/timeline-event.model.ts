export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: Date | string;
  type: 'birth' | 'death' | 'marriage' | 'achievement' | 'other';
  media?: {
    url: string;
    type: 'image' | 'video' | 'audio';
    caption?: string;
  }[];
  location?: {
    name: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  tags?: string[];
  createdBy?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}
