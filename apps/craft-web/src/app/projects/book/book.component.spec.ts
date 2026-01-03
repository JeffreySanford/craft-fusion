import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookComponent } from './book.component';
import { FileUploadService } from '../../common/services/file-upload.service';
import { PdfParseService } from '../../common/services/pdf-parse.service';
import { DocParseService } from '../../common/services/doc-parse.service';
import { UserStateService } from '../../common/services/user-state.service';
import { of } from 'rxjs';

describe('BookComponent', () => {
  let component: BookComponent;
  let fixture: ComponentFixture<BookComponent>;
  let fileUploadService: jest.Mocked<FileUploadService>;
  let userStateService: jest.Mocked<UserStateService>;

  beforeEach(async () => {
    const mockFileUploadService = {
      uploadFile: jest.fn().mockReturnValue(of(undefined)),
    } as unknown as jest.Mocked<FileUploadService>;

    const mockPdfParseService = {
      parsePdf: jest.fn().mockResolvedValue('parsed content'),
    };

    const mockDocParseService = {
      parseDoc: jest.fn().mockResolvedValue('parsed content'),
    };

    const mockUserStateService = {
      setOpenedDocument: jest.fn().mockReturnValue(of([])),
      getOpenedDocuments: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<UserStateService>;

    await TestBed.configureTestingModule({
      declarations: [BookComponent],
      providers: [
        { provide: FileUploadService, useValue: mockFileUploadService },
        { provide: PdfParseService, useValue: mockPdfParseService },
        { provide: DocParseService, useValue: mockDocParseService },
        { provide: UserStateService, useValue: mockUserStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookComponent);
    component = fixture.componentInstance;
    fileUploadService = TestBed.inject(FileUploadService) as jest.Mocked<FileUploadService>;
    userStateService = TestBed.inject(UserStateService) as jest.Mocked<UserStateService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should store file and update user state on file selection', async () => {
    const file = { name: 'test.txt', type: 'application/pdf', text: jest.fn().mockResolvedValue('content') } as any;
    const event = { target: { files: [file] } };
    jest.spyOn(fileUploadService, 'uploadFile').mockReturnValue(of(undefined));
    jest.spyOn(userStateService, 'setOpenedDocument').mockReturnValue(of([]));
    jest.spyOn(userStateService, 'getOpenedDocuments').mockReturnValue([]);

    component.onFileSelected(event);
    await new Promise(resolve => setTimeout(resolve, 0)); // wait for promise

    expect(fileUploadService.uploadFile).toHaveBeenCalledWith(file);
    expect(userStateService.setOpenedDocument).toHaveBeenCalledWith('test.txt');
    expect(component.openedDocuments).toEqual([]);
  });
});
