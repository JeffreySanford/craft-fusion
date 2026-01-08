import { User } from '../../../timeline/user/entities/user.entity';

export class TimelineEvent {
  id: string = '';
  title: string = '';
  date: Date = new Date();
  description: string = '';
  imageUrl: string = '';
  actionLink?: string;
  person: string = '';
  createdBy: User = new User();
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}
