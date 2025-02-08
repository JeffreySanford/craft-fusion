import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { FileService } from './file.service';
import { Observable } from 'rxjs';
import { Express} from 'express';
import { Multer } from 'multer';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  uploadFile(@Body() file: Express.Multer.File): Observable<void> {
    return this.fileService.saveFile(file);
  }

  @Get(':filename')
  getFile(@Param('filename') filename: string): Observable<Buffer> {
    return this.fileService.getFile(filename);
  }

  @Post('saveOpenedDocuments')
  saveOpenedDocuments(@Body() documents: string[]): Observable<void> {
    return this.fileService.saveOpenedDocuments(documents);
  }

  @Get('getOpenedDocuments')
  getOpenedDocuments(): Observable<string[]> {
    return this.fileService.getOpenedDocuments();
  }
}
