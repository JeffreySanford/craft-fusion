import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData(descriptor: any): { message: string } {
    console.log(descriptor);
    return this.appService.getData();
  }
}
