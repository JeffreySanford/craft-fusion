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
  let fileUploadService: FileUploadService;
  let pdfParseService: PdfParseService;
  let docParseService: DocParseService;
  let userStateService: UserStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookComponent],
      providers: [
        FileUploadService,
        PdfParseService,
        DocParseService,
        UserStateService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BookComponent);
    component = fixture.componentInstance;
    fileUploadService = TestBed.inject(FileUploadService);
    pdfParseService = TestBed.inject(PdfParseService);
    docParseService = TestBed.inject(DocParseService);
    userStateService = TestBed.inject(UserStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should store file and update user state on file selection', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [file] } };
    spyOn(fileUploadService, 'uploadFile').and.returnValue(of(null));
    spyOn(userStateService, 'setOpenedDocument').and.returnValue(of(null));
    spyOn(userStateService, 'getOpenedDocuments').and.returnValue([]);

    component.onFileSelected(event);

    expect(fileUploadService.uploadFile).toHaveBeenCalledWith(file);
    expect(userStateService.setOpenedDocument).toHaveBeenCalledWith('test.txt');
    expect(component.openedDocuments).toEqual([]);
  });
});
