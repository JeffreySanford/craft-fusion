import { Controller, Get, Param, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { FileService } from './file.service';
import { Observable } from 'rxjs';
import { Express } from 'express';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  uploadFile(@Body() file: Express.Multer.File): Observable<void> {
    console.log('STATE: Uploading file:', file.originalname);
    if (!file || !file.originalname || !file.buffer) {
      throw new HttpException('Invalid file data', HttpStatus.BAD_REQUEST);
    }
    return this.fileService.saveFile(file);
  }

  @Get(':filename')
  getFile(@Param('filename') filename: string): Observable<Buffer> {
    console.log('STATE: Fetching file:', filename);
    if (!filename) {
      throw new HttpException('Filename is required', HttpStatus.BAD_REQUEST);
    }
    return this.fileService.getFile(filename);
  }

  @Post('saveOpenedDocuments')
  saveOpenedDocuments(@Body() documents: string[]): Observable<void> {
    console.log('STATE: Saving opened documents:', documents);
    if (!Array.isArray(documents)) {
      throw new HttpException('Invalid documents format', HttpStatus.BAD_REQUEST);
    }
    return this.fileService.saveOpenedDocuments(documents);
  }

  @Get('getOpenedDocuments')
  getOpenedDocuments(): Observable<string[]> {
    console.log('STATE: Fetching opened documents');
    return this.fileService.getOpenedDocuments();
  }
}
