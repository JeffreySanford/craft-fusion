import { Controller, Get, Param, Post, Body, HttpException, HttpStatus, Res } from '@nestjs/common';
import { FileService, DocumentUpload } from './file.service';
import { Observable } from 'rxjs';
import { Response } from 'express';
import * as path from 'path';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  @Get('document/:path(*)')
  async getDocument(@Param('path') filePath: string, @Res() res: Response): Promise<void> {
    console.log('STATE: Fetching document:', filePath);
    if (!filePath) {
      throw new HttpException('File path is required', HttpStatus.BAD_REQUEST);
    }

    const contentType = this.getContentType(filePath);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-cache');

    this.fileService.getFile(filePath).subscribe({
      next: (buffer) => res.send(buffer),
      error: (error) => {
        if (error instanceof HttpException) {
          res.status(error.getStatus()).json(error.getResponse());
        } else {
          res.status(500).json({ message: 'Internal server error' });
        }
      }
    });
  }

  @Get(':filename')
  getFile(@Param('filename') filename: string): Observable<Buffer> {
    console.log('STATE: Fetching file:', filename);
    if (!filename) {
      throw new HttpException('Filename is required', HttpStatus.BAD_REQUEST);
    }
    return this.fileService.getFile(filename);
  }

  @Post('upload')
  uploadFile(@Body() file: DocumentUpload): Observable<void> {
    console.log('STATE: Uploading file:', file.originalname);
    if (!file || !file.originalname || !file.buffer) {
      throw new HttpException('Invalid file data', HttpStatus.BAD_REQUEST);
    }
    return this.fileService.saveFile(file);
  }

  @Post('saveOpenedDocuments')
  saveOpenedDocuments(@Body() documents: { name: string, color: string }[]): Observable<void> {
    console.log('STATE: Saving opened documents:', documents);
    if (!Array.isArray(documents)) {
      throw new HttpException('Invalid documents format', HttpStatus.BAD_REQUEST);
    }
    return this.fileService.saveOpenedDocuments(
      ['openedDocs', JSON.stringify(documents)]
    );
  }

  @Get('getOpenedDocuments')
  getOpenedDocuments(): Observable<string[]> {
    console.log('STATE: Fetching opened documents');
    return this.fileService.getOpenedDocuments();
  }
}
