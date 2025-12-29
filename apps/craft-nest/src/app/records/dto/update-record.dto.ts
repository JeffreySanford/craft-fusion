import { PartialType } from '@nestjs/mapped-types';
import { CreateRecordDto } from './create-record.dto';
import { Company } from '../entities/company.interface';
import { Phone, Address } from '../entities/record.interface';

export class UpdateRecordDto extends PartialType(CreateRecordDto) {
    override UID?: string;
    override name?: string;
    override firstName?: string;
    override lastName?: string;
    override address?: Address;
    city?: string;
    state?: string;
    zip?: string;
    override phone?: Phone;
    override salary?: Company[];
    override totalHouseholdIncome?: number;
}
