import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
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
import { catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

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
export class BookComponent implements OnInit {
  @ViewChild('sidebar', { static: true }) sidebar!: ElementRef;
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild(EditorComponent) editorComponent!: EditorComponent;

  editorData = '<p>Initial content</p>';
  selectedDocument?: Document;
  selectedDocuments: string[] = [];
  chapters: string[] = [];
  isMarkdownView = false;

  init: Partial<EditorOptions> = {
    license_key: 'gpl', // License key
    base_url: '/tinymce', // Base URL for Tinymce
    suffix: '.min', // File suffix
    selector: 'textarea', // Textarea selector
    height: 500, // Editor height
    menubar: false, // Menubar
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
    fileUploadService: FileUploadService
  ) {
    this.fileUploadService = fileUploadService;
  }

  ngOnInit(): void { }

  getFullHeight(): number {
    const container = this.ref.nativeElement.querySelector('.sidenav-container');
    if (container) {
      return container.clientHeight;
    }
    return 500; // Default height if container is not found
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
    console.log(content); // Handle editor data here
    this.updateChapters(content);
    this.addHeaderIds();
  }

  onDocumentSelected(document: string): void {
    // Load the selected document into TinyMCE editor
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

    return this.chapters;
  }

  addHeaderIds(): void {
    const editor = this.editorComponent.editor;

    if (editor) {
      const content = editor.getContent();
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headers.forEach((header, index) => {
        header.id = `header-${index}`;
      });

      editor.setContent(doc.body.innerHTML);
    }
  }

  scrollToChapter(index: number): void {

    const editor = this.editorComponent.editor;
    if (editor) {
      const headers = editor.getDoc().querySelectorAll('h3');
      const header = headers[index];
      if (header) {
        header.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  toggleSidebar(): void {
    this.sidenav.toggle();
  }

  async onFileSelected(event: any): Promise<void> {
    const files: File[] = Array.from(event.target.files);
    for (const file of files) {
      let content = '';
      if (file.type === 'application/pdf') {
        content = await this.pdfParseService.parsePdf(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        content = await this.docParseService.parseDoc(file);
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        const turndown = new TurndownService();
        content = turndown.turndown(text);
      }
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

  invokeAIAssistant(): void {
    console.log('AI Assistant invoked');
    // Implement AI assistant interaction logic here
  }
}