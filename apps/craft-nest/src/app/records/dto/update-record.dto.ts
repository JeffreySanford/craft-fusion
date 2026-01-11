import { PartialType } from '@nestjs/mapped-types';
import { CreateRecordDto } from './create-record.dto';

// Make sure UpdateRecordDto extends CreateRecordDto using PartialType
export class UpdateRecordDto extends PartialType(CreateRecordDto) {
  // Remove all 'override' modifiers as they're not needed when using PartialType
  // PartialType already makes all properties optional
  id?: string;
  title?: string;
  description?: string;
  date?: Date;
  category?: string;
  
  // These should also not have 'override' modifiers
  tags?: string[];
  status?: string;
  priority?: number;
}
