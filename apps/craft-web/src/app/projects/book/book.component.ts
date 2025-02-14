import { Component, OnInit, ViewChild, ElementRef, Renderer2, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { EventObj } from '@tinymce/tinymce-angular/editor/Events';
import tinymce, { Editor, EditorOptions } from 'tinymce';
import { DocParseService } from '../../common/services/doc-parse.service';
import { PdfParseService } from '../../common/services/pdf-parse.service';
import { UserStateService } from '../../common/services/user-state.service';
import { FileUploadService } from '../../common/services/file-upload.service';
import TurndownService from 'turndown';
import * as marked from 'marked';
import * as hljs from 'highlight.js';
import { catchError, map } from 'rxjs/operators';
import { of, from } from 'rxjs';

export interface Document {
  name: string;
  color: string;
}

@Component({
  selector: 'app-book',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.scss'],
  standalone: false
})
export class BookComponent implements OnInit, AfterViewInit {
  @ViewChild('sidebar', { static: true }) sidebar!: ElementRef;
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild(EditorComponent) editorComponent!: EditorComponent;
  @ViewChild('markdownPreview') markdownPreview!: ElementRef;

  editorData = '<p>Initial content</p>';
  selectedDocument?: Document;
  selectedDocuments: string[] = [];
  chapters: string[] = [];
  isMarkdownView = false;
  isReadOnly = true;
  isMarkdownPrettyView = true;
  selectedFont = 'IBM Plex Serif';
  selectedFontSize = '1.25em';

  availableFonts = [
    'Lora',
    'IBM Plex Serif',
    'Libre Baskerville',
    'EB Garamond',
    'Crimson Pro'
  ];

  availableFontSizes = [
    '1em',
    '1.25em',
    '1.5em',
    '1.75em',
    '2em'
  ];

  init: Partial<EditorOptions> = {
    license_key: 'gpl',
    base_url: '/tinymce',
    suffix: '.min',
    selector: 'textarea',
    height: 636,
    menubar: false,
    toolbar: 'undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist | forecolor backcolor | removeformat | link image media | table | code | toggleMarkdown | aiAssistant',
    setup: (editor: Editor) => {
      editor.ui.registry.addButton('toggleMarkdown', {
        icon: 'code',
        tooltip: 'Toggle Markdown',
        onAction: () => {
          this.toggleMarkdownView();
        }
      });
      editor.ui.registry.addButton('aiAssistant', {
        icon: 'robot',
        tooltip: 'AI Assistant',
        onAction: () => {
          this.invokeAIAssistant();
        }
      });
      editor.ui.registry.addSidebar('mysidebar', {
        tooltip: 'My sidebar',
        icon: 'comment',
        onSetup: (api: any) => {
          console.log('Render panel', api.element());
          return () => {
            console.log('Removing sidebar');
          };
        },
        onShow: (api: any) => {
          console.log('Show panel', api.element());
          api.element().appendChild(this.sidebar.nativeElement);
        },
        onHide: (api: any) => {
          console.log('Hide panel', api.element());
        }
      });
    }
  };
  openedDocuments: { name: string, color: string }[] = [];
  documentColors: string[] = ['#FFCDD2', '#C8E6C9', '#BBDEFB', '#FFF9C4', '#D1C4E9', '#FFECB3', '#B2EBF2', '#FFCCBC'];
  fileUploadService: FileUploadService;
  isWinking: boolean = false;
  currentTitle: string = '';

  constructor(
    private docParseService: DocParseService,
    private pdfParseService: PdfParseService,
    private userStateService: UserStateService,
    private ref: ElementRef,
    private renderer2: Renderer2,
    fileUploadService: FileUploadService,
    private cdr: ChangeDetectorRef
  ) {
    this.fileUploadService = fileUploadService;
  }

  ngOnInit(): void {
    this.init.readonly = this.isReadOnly;
  }

  ngAfterViewInit(): void {
    this.addHeaderIds();
  }

  getFullHeight(): number {
    const container = this.ref.nativeElement.querySelector('.sidenav-container');
    if (container) {
      return container.clientHeight + 400;
    }
    return 500;
  }

  onInit(event: EventObj<any>): void {
    console.log('EditorComponent initialized');
    tinymce.init({
      selector: 'textarea',
      plugins: 'code lists advlist link image imagetools media table',
      toolbar: 'code | undo redo | formatselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist | forecolor backcolor | removeformat | link image media | table',
      height: this.getFullHeight(),
      setup: (editor: Editor) => {
        editor.on('Change', (e) => this.onChange(e));
      }
    });

    setInterval(() => {
      this.isWinking = !this.isWinking;
    }, 2000);

    this.openedDocuments = this.userStateService.getOpenedDocuments();
    this.userStateService.getLoginDateTime();
    this.addHeaderIds();
  }

  onChange({ editor }: { editor: Editor }) {
    const content = editor.getContent();
    console.log(content);
    this.updateChapters(content);
    this.addHeaderIds();
  }

  onDocumentSelected(document: string): void {
    this.userStateService.setOpenedDocument(document).subscribe(openedDocuments => {
      this.selectedDocument = this.openedDocuments.find(doc => doc.name === document);
      this.editorData += '<p>Content from ' + document + '</p>';
      this.chapters = this.updateChapters(this.editorData);
      this.openedDocuments = openedDocuments;
      this.addHeaderIds();
      this.assignDocumentColor(document);
    });
  }

  assignDocumentColor(document: string): void {
    if (!this.openedDocuments.some(doc => doc.name === document)) {
      const color = this.documentColors[this.openedDocuments.length % this.documentColors.length];
      this.openedDocuments.push({ name: document, color });
    }
  }

  updateChapters(content: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    this.currentTitle = Array.from(doc.querySelectorAll('h1')).map(header => header.textContent || '')[0] || 'Untitled';
    this.chapters = Array.from(doc.querySelectorAll('h3')).map(header => (header.textContent || '') + '\n');
    this.addHeaderIds();
    return this.chapters;
  }

  addHeaderIds(): void {
    if (this.editorComponent && this.editorComponent.editor) {
      const editor = this.editorComponent.editor;
      const content = editor.getContent();
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headers.forEach((header, index) => {
        header.id = `header-${index}`;
      });

      editor.setContent(doc.body.innerHTML);
    }

    if (this.markdownPreview) {
      const markdownContent = this.markdownPreview.nativeElement.innerHTML;
      const parser = new DOMParser();
      const doc = parser.parseFromString(markdownContent, 'text/html');
      const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headers.forEach((header, index) => {
        header.id = `header-${index}`;
      });

      this.markdownPreview.nativeElement.innerHTML = doc.body.innerHTML;
    }
  }

  scrollToChapter(index: number): void {
    if (this.isMarkdownPrettyView && this.markdownPreview) {
      const headers = this.markdownPreview.nativeElement.querySelectorAll('h3');
      const header = headers[index];
      if (header) {
        header.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (this.editorComponent && this.editorComponent.editor) {
      const editor = this.editorComponent.editor;
      const headers = editor.getDoc().querySelectorAll('h3');
      const header = headers[index];
      if (header) {
        header.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  toggleSidebar(): void {
    this.sidenav.toggle();
  }

  onFileSelected(event: any): void {
    const files: File[] = Array.from(event.target.files);
    for (const file of files) {
      let content$;
      if (file.type === 'application/pdf') {
        content$ = this.pdfParseService.parsePdf(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        content$ = from(this.docParseService.parseDoc(file));
      } else if (file.type === 'text/plain') {
        content$ = from(file.text()).pipe(
          map(text => {
            const turndown = new TurndownService();
            return turndown.turndown(text);
          })
        );
      }

      if (content$) {
        if (content$ instanceof Promise) {
          content$.then(content => {
            this.renderMarkdown(content);
            this.fileUploadService.uploadFile(file).pipe(
              catchError(err => {
                console.error('Failed to upload file', err);
                return of(null);
              })
            ).subscribe(() => {
              this.userStateService.setOpenedDocument(file.name);
              this.openedDocuments = this.userStateService.getOpenedDocuments();
              this.onDocumentSelected(this.openedDocuments[this.openedDocuments.length - 1].name);
            });
          });
        } else {
          content$.subscribe(content => {
            this.renderMarkdown(content);
            this.fileUploadService.uploadFile(file).pipe(
              catchError(err => {
                console.error('Failed to upload file', err);
                return of(null);
              })
            ).subscribe(() => {
              this.userStateService.setOpenedDocument(file.name);
              this.openedDocuments = this.userStateService.getOpenedDocuments();
            });
          });
        }
      }
    }
  }

  renderMarkdown(markdown: string): void {
    marked.setOptions({
      breaks: true,
      gfm: true,
      highlight: (code: string) => {
        return hljs.default.highlightAuto(code).value;
      },
      pedantic: false,
      sanitize: true,
      smartLists: true,
      smartypants: true,
      xhtml: false
    } as marked.MarkedOptions);
    const parsedMarkdown = marked.parse(markdown);
    if (parsedMarkdown instanceof Promise) {
      parsedMarkdown.then(result => this.setEditorContent(result));
    } else {
      this.setEditorContent(parsedMarkdown);
    }
  }

  setEditorContent(content: string): void {
    this.editorData = content;
    if (this.editorComponent && this.editorComponent.editor) {
      this.editorComponent.editor.setContent(content);
    }
    if (this.markdownPreview) {
      this.markdownPreview.nativeElement.innerHTML = content;
    }
    this.updateChapters(content);
  }

  toggleMarkdownView(): void {
    if (this.isMarkdownView) {
      this.renderMarkdown(this.editorData);
    } else {
      const turndown = new TurndownService();
      const markdown = turndown.turndown(this.editorData);
      this.setEditorContent(markdown);
    }
    this.isMarkdownView = !this.isMarkdownView;
  }

  toggleReadOnly(): void {
    this.isReadOnly = !this.isReadOnly;
    if (this.editorComponent && this.editorComponent.editor) {
      this.editorComponent.editor.mode.set(this.isReadOnly ? 'readonly' : 'design');
    }
  }

  toggleMarkdownPrettyView(): void {
    this.isMarkdownPrettyView = !this.isMarkdownPrettyView;
    if (!this.isMarkdownPrettyView) {
      this.toggleReadOnly();
    }
  }

  invokeAIAssistant(): void {
    console.log('AI Assistant invoked');
  }

  changeFont(event: Event): void {
    const font = (event.target as HTMLSelectElement).value;
    console.log('Selected font:', font);
    this.selectedFont = font;
    if (this.editorComponent && this.editorComponent.editor) {
      console.log('Setting font in editor:', font);
      this.editorComponent.editor.getBody().style.fontFamily = font;
    }
    if (this.markdownPreview) {
      console.log('Setting font in markdown preview:', font);
      this.markdownPreview.nativeElement.style.fontFamily = font;
    }
    this.cdr.detectChanges();
  }

  changeFontSize(event: Event): void {
    const fontSize = (event.target as HTMLSelectElement).value;
    console.log('Selected font size:', fontSize);
    this.selectedFontSize = fontSize;
    if (this.editorComponent && this.editorComponent.editor) {
      console.log('Setting font size in editor:', fontSize);
      this.editorComponent.editor.getBody().style.fontSize = fontSize;
    }
    if (this.markdownPreview) {
      console.log('Setting font size in markdown preview:', fontSize);
      this.markdownPreview.nativeElement.style.fontSize = fontSize;
    }
    this.cdr.detectChanges();
  }

  onSave(): void {
    console.log('Saving content');
  }
}