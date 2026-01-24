import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { RecordsService } from './records.service';
import { Record } from './entities/record.interface';

@Controller('records')
export class RecordsController {
  private readonly logger = new Logger(RecordsController.name);

  constructor(private readonly recordService: RecordsService) {}

  @Get()
  getAllRecords(): Record[] {
    this.logger.log('Received request to get all records');
    return this.recordService.getAllRecords();
  }

  @Get('generate')
  generateMultipleRecords(@Query('count') count: number): Record[] {
    this.logger.log(`Received request to generate records with count: ${count}`);
    const recordCount = Number(count) || 10;
    return this.recordService.generateMultipleRecords(recordCount);
  }

  @Get('total-income/:UID')
  getTotalIncome(@Param('UID') UID: string): number {
    this.logger.log(`Received request to get total income for UID: ${UID}`);
    return this.recordService.calculateTotalIncome(UID);
  }

  @Get('time')
  getCreationTime(): { generationTime: number } {
    this.logger.log('Received request to get creation time');
    const generationTime = this.recordService.getCreationTime();
    this.logger.log(`Returning creation time: ${generationTime}`);
    return { generationTime };
  }

  @Get(':UID')
  getUserbyId(@Param('UID') UID: string): Record {
    this.logger.log(`Received request to get record by UID: ${UID}`);
    // remove the colon from the UID
    const userID = UID.replace(/^:/, '');
    this.logger.log(`Processed UID: ${userID}`);
    return this.recordService.getRecordByUID(userID);
  }
}
