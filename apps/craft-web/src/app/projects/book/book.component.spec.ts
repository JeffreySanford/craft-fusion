import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookComponent } from './book.component';
import { FileService } from '../../common/services/file.service';

describe('BookComponent', () => {
  let component: BookComponent;
  let fixture: ComponentFixture<BookComponent>;
  let fileService: FileService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookComponent],
      providers: [FileService]
    }).compileComponents();

    fixture = TestBed.createComponent(BookComponent);
    component = fixture.componentInstance;
    fileService = TestBed.inject(FileService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should store file and update user state on file selection', async () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [file] } };
    spyOn(fileService, 'saveFile').and.returnValue(Promise.resolve());
    spyOn(component.userStateService, 'addOpenedDocument');

    await component.onFileSelected(event);

    expect(fileService.saveFile).toHaveBeenCalledWith(file);
    expect(component.userStateService.addOpenedDocument).toHaveBeenCalledWith('test.txt');
  });
});
