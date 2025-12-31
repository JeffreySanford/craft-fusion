import { Company } from "../entities/company.interface";
import { Phone } from "../entities/record.interface";
import { IsString, IsOptional, ValidateNested, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
    @IsString()
    street: string = '';

    @IsString()
    city: string = '';

    @IsString()
    state: string = '';

    @IsString()
    zipcode: string = '';
}

export class CreateRecordDto {
    @IsString()
    UID: string = '';

    @IsOptional()
    @IsString()
    name?: string = '';

    @IsString()
    firstName: string = '';

    @IsString()
    lastName: string = '';

    @ValidateNested()
    @Type(() => AddressDto)
    address: AddressDto = new AddressDto();

    // Phone kept generic here; more validation can be added as needed
    phone: Phone = { number: '', hasExtension: false, extension: null, areaCode: '' };

    @IsArray()
    salary: Company[] = [];

    @IsNumber()
    totalHouseholdIncome: number = 0;
}
