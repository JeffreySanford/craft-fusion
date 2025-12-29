import { Controller, Get, Query, Param } from '@nestjs/common';
import { RecordsService } from './records.service';
import { Record } from './entities/record.interface';

@Controller('records')
export class RecordsController {
  private recordGenerationTime = 0;

  constructor(private readonly recordService: RecordsService) {}

  @Get()
  getAllRecords(): Record[] {
    console.log('Received request to get all records');
    return this.recordService.getAllRecords();
  }

  @Get('generate')
  generateMultipleRecords(@Query('count') count: number): Record[] {
    console.log('Received request to generate records with count:', count);
    const recordCount = Number(count) || 10;
    return this.recordService.generateMultipleRecords(recordCount);
  }

  @Get('total-income/:UID')
  getTotalIncome(@Param('UID') UID: string): number {
    console.log('Received request to get total income for UID:', UID);
    return this.recordService.calculateTotalIncome(UID);
  }

  @Get('time')
  getCreationTime(): { generationTime: number } {
    console.log('Received request to get creation time');
    const generationTime = this.recordService.getCreationTime();
    console.log('Returning creation time:', generationTime);
    return { generationTime };
  }

  @Get(':UID')
  getUserbyId(@Param('UID') UID: string): Record {
    console.log('Received request to get record by UID:', UID);
    // remove the colon from the UID
    const userID = UID.replace(/^:/, '');
    console.log('Processed UID:', userID);
    return this.recordService.getRecordByUID(userID);
  }
}