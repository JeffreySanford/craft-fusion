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

    // Convert count to a number and provide a default if necessary
    const recordCount = Number(count) || 10; // Default to 10 if count is not provided
    console.log('Parsed record count:', recordCount);

    this.recordGenerationTime = 0;
  
    const startTime = performance.now();
    // Generate records logic here...
    const endTime = performance.now();
    this.recordGenerationTime = endTime - startTime;

    return this.recordService.generateMultipleRecords(recordCount);
  }

  @Get('total-income/:UID')
  getTotalIncome(@Param('UID') UID: string): number {
    return this.recordService.calculateTotalIncome(UID);
  }

  @Get('time')
  getCreationTime(): number {
    return this.recordGenerationTime;
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