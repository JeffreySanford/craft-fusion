import { Component, OnInit, ViewChild, ElementRef, Renderer2, AfterViewInit, ChangeDetectorRef, HostBinding } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { EditorComponent } from '@tinymce/tinymce-angular';

import tinymce, { Editor, EditorOptions } from 'tinymce';
import { DocParseService } from '../../common/services/doc-parse.service';
import { PdfParseService } from '../../common/services/pdf-parse.service';
import { UserStateService } from '../../common/services/user-state.service';
import { FileUploadService } from '../../common/services/file-upload.service';
import TurndownService from 'turndown';
import * as marked from 'marked';
import * as hljs from 'highlight.js';
import { catchError, map } from 'rxjs/operators';
import { of, from, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { LoggerService } from '../../common/services/logger.service';

export interface Document {
  name: string;
  color: string;
  contrast: string;
}

@Component({
  selector: 'app-book',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.scss'],
  standalone: false,
})
export class BookComponent implements OnInit, AfterViewInit {
  @ViewChild('sidebar', { static: true }) sidebar!: ElementRef;
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild(EditorComponent) editorComponent!: EditorComponent;
  @ViewChild('markdownPreview', { static: false }) markdownPreview!: ElementRef;

  isDarkTheme = false; // Set light theme as default
  selectedDocument: Document | undefined = undefined;
  @HostBinding('class.light-theme') isLightTheme: boolean = !this.isDarkTheme;
  @HostBinding('class.dark-theme') get isDarkThemeClass() {
    return this.isDarkTheme;
  }
  @HostBinding('style.--book-font-family') fontFamily: string = "'IBM Plex Serif', serif";
  @HostBinding('style.--book-font-size') fontSize: string = '1.25em';

  editorData = '<p>Initial content</p>';

  selectedDocuments: string[] = [];
  chapters: string[] = [];
  isMarkdownView = false;
  isReadOnly = true;
  isMarkdownPrettyView = true;
  selectedFont = 'IBM Plex Serif';
  selectedFontSize = '1.25em';

  availableFonts = ['Lora', 'IBM Plex Serif', 'Libre Baskerville', 'EB Garamond', 'Crimson Pro'];

  availableFontSizes = ['1em', '1.25em', '1.5em', '1.75em', '2em'];

  init: Partial<EditorOptions> = {
    license_key: 'gpl',
    base_url: '/tinymce',
    suffix: '.min',
    selector: 'textarea',
    height: 636,
    menubar: false,
    toolbar:
      'undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist | forecolor backcolor | removeformat | link image media | table | code | toggleMarkdown | aiAssistant',
    content_style: `
      :root {
        color-scheme: light dark;
      }
      body { 
        background-color: var(--book-light-bg); 
        color: var(--book-light-text);
      }
      body.dark-theme { 
        background-color: var(--book-dark-bg); 
        color: var(--book-dark-text);
      }
      // Referencing styles from SCSS
      .myth-section {
        margin: 1.5em 0;
        padding: 1em 2em;
        border-left: 4px solid var(--book-light-myth-border);
        background: var(--book-light-myth-bg);
      }
      body.dark-theme .myth-section {
        border-left-color: var(--book-dark-myth-border);
        background: var(--book-dark-myth-bg);
      }
    `,
    setup: (editor: Editor) => {
      editor.ui.registry.addButton('toggleMarkdown', {
        icon: 'code',
        tooltip: 'Toggle Markdown',
        onAction: () => {
          this.toggleMarkdownView();
        },
      });
      editor.ui.registry.addButton('aiAssistant', {
        icon: 'robot',
        tooltip: 'AI Assistant',
        onAction: () => {
          this.invokeAIAssistant();
        },
      });
      editor.ui.registry.addSidebar('mysidebar', {
        tooltip: 'My sidebar',
        icon: 'comment',
        onSetup: (api: any) => {
          return () => {};
        },
        onShow: (api: any) => {
          if (api && typeof api.element === 'function') {
            api.element().appendChild(this.sidebar.nativeElement);
          }
        },
        onHide: (_api: any) => {},
      });
      editor.on('init', () => {
        // Apply font family to editor body
        editor.getBody().style.fontFamily = this.fontFamily;
      });
    },
  };
  openedDocuments: Document[] = [];
  documentColors = [
    { name: 'Patriotic Red', color: '#FF0000', contrast: '#FFFFFF' },
    { name: 'Brilliant White', color: '#FFFFFF', contrast: '#000000' },
    { name: 'True Blue', color: '#0000FF', contrast: '#FFFFFF' },
    { name: 'Banana Cream', color: '#FFF9C4', contrast: '#000000' },
    { name: 'Lilac Love', color: '#D1C4E9', contrast: '#000000' },
    { name: 'Peach Punch', color: '#FFECB3', contrast: '#000000' },
    { name: 'Sky Wave', color: '#B2EBF2', contrast: '#000000' },
    { name: 'Orange Zest', color: '#FFCCBC', contrast: '#000000' },
  ];
  isWinking: boolean = false;
  currentTitle: string = '';

  isRSVPMode = false;
  isRSVPPlaying = false;
  rsvpWord = '';
  rsvpSpeed = 300; // Default 300ms per word
  words: string[] = [];
  wordIndex = 0;
  rsvpInterval: number | undefined;
  areImagesVisible = false;

  constructor(
    private docParseService: DocParseService,
    private pdfParseService: PdfParseService,
    private userStateService: UserStateService,
    private ref: ElementRef,
    private renderer2: Renderer2,
    private fileUploadService: FileUploadService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private logger: LoggerService,
  ) {
    console.log('BookComponent instantiated');
  }

  ngOnInit(): void {
    debugger;
    this.init.readonly = this.isReadOnly;
    this.loadFilesFromAssets();
    this.applyTheme(); // Apply the default theme
    // Open sidebar by default
    setTimeout(() => {
      this.sidenav?.open();
    }, 0);
  }

  ngAfterViewInit(): void {
    this.addHeaderIds();
    this.updateImageVisibility(false);
  }

  loadFilesFromAssets(): void {
    this.logger.info('Loading document from API storage...');
    const files = ['/api/files/document/book/Chapter 1 - Enki.docx', '/api/files/document/book/Chapter 2 - Enlil.docx', '/api/files/document/book/Chapter 3 - The Cities.docx'];

    files.forEach(fileUrl => {
      this.http
        .get(fileUrl, {
          responseType: 'arraybuffer',
          headers: {
            Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Cache-Control': 'no-cache',
          },
        })
        .pipe(
          catchError(error => {
            this.logger.error(`Error loading document ${fileUrl}:`, error);
            return throwError(() => error);
          }),
        )
        .subscribe({
          next: (data: ArrayBuffer) => {
            if (!data || data.byteLength === 0) {
              this.logger.error(`Received empty document data for ${fileUrl}`);
              return;
            }
            this.logger.info(`Document ${fileUrl} loaded successfully, size:`, data.byteLength);
            this.processDocument(data, fileUrl); // Pass the fileUrl
          },
          error: error => {
            this.logger.error(`Failed to load document ${fileUrl}:`, error);
          },
        });
    });
  }

  getFullHeight(): number {
    const container = this.ref.nativeElement.querySelector('.sidenav-container');
    if (container) {
      return container.clientHeight + 400;
    }
    return 500;
  }

  onInit(_event: any): void {
    this.logger.info('EditorComponent initialized');
    tinymce.init({
      selector: 'textarea',
      plugins: 'code lists advlist link image imagetools media table',
      toolbar:
        'code | undo redo | formatselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist | forecolor backcolor | removeformat | link image media | table',
      height: this.getFullHeight(),
      setup: (editor: Editor) => {
        editor.on('Change', e => this.onChange(e));
      },
    });

    window.setInterval(() => {
      this.isWinking = !this.isWinking;
    }, 2000);

    this.openedDocuments = this.userStateService.getOpenedDocuments().map(doc => ({
      ...doc,
      contrast: this.documentColors.find(color => color.name === doc.color)?.contrast || '#000000',
    }));
    this.userStateService.getLoginDateTime();
    this.addHeaderIds();
    this.updateImageVisibility(false);
  }

  onChange({ editor }: { editor: Editor }) {
    const content = editor.getContent();
    this.logger.info(content);
    this.updateChapters(content);
    this.addHeaderIds();
  }

  onDocumentSelected(documentName: string): void {
    this.selectedDocument = this.openedDocuments.find(doc => doc.name === documentName) || undefined;
    this.userStateService.setOpenedDocument(documentName).subscribe(openedDocuments => {
      this.selectedDocument = this.openedDocuments.find(doc => doc.name === documentName);
      this.loadDocumentContent(documentName);
      this.chapters = this.updateChapters(this.editorData);
      this.openedDocuments = openedDocuments.map(doc => ({
        ...doc,
        contrast: this.documentColors.find(color => color.name === doc.color)?.contrast || '#000000',
      }));
      this.addHeaderIds();
      this.assignDocumentColor(documentName);
    });
  }

  assignDocumentColor(document: string): void {
    if (!this.openedDocuments.some(doc => doc.name === document)) {
      if (this.documentColors.length === 0) {
        this.openedDocuments.push({ name: document, color: '#000000', contrast: '#000000' });
        return;
      }
      const colorObj = this.documentColors[this.openedDocuments.length % this.documentColors.length] || { color: '#000000', contrast: '#000000' };
      const color = colorObj.color;
      const contrast = colorObj.contrast || '#000000';
      this.openedDocuments.push({ name: document, color, contrast });
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

  onFileSelected(event: Event | unknown): void {
    const target = (event as Event)?.target as HTMLInputElement | null;
    if (!target || !target.files) {
      this.logger.warn('onFileSelected called without files');
      return;
    }
    const files: File[] = Array.from(target.files);
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
          }),
        );
      }

      if (content$) {
        if (content$ instanceof Promise) {
          content$.then(content => {
            this.renderMarkdown(content);

            this.fileUploadService
              .uploadFile(file)
              .pipe(
                catchError(err => {
                  this.logger.error('Failed to upload file', err);
                  return of(null);
                }),
              )
              .subscribe(() => {
                this.userStateService.setOpenedDocument(file.name);
                this.openedDocuments = this.userStateService.getOpenedDocuments().map(doc => ({
                  ...doc,
                  contrast: this.documentColors.find(color => color.name === doc.color)?.contrast || '#000000',
                }));
                const last = this.openedDocuments[this.openedDocuments.length - 1];
                if (last) {
                  this.onDocumentSelected(last.name);
                }
              });
          });
        } else {
          content$.subscribe(content => {
            this.renderMarkdown(content);
            this.fileUploadService
              .uploadFile(file)
              .pipe(
                catchError(err => {
                  this.logger.error('Failed to upload file', err);
                  return of(null);
                }),
              )
              .subscribe(() => {
                this.userStateService.setOpenedDocument(file.name);
                this.openedDocuments = this.userStateService.getOpenedDocuments().map(doc => ({
                  ...doc,
                  contrast: this.documentColors.find(color => color.name === doc.color)?.contrast || '#000000',
                }));
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
      xhtml: false,
    } as marked.MarkedOptions);
    const parsedMarkdown = marked.parse(markdown);
    if (parsedMarkdown instanceof Promise) {
      parsedMarkdown.then(result => this.setEditorContent(result));
    } else {
      this.setEditorContent(parsedMarkdown);
    }
  }

  setEditorContent(content: string): void {
    this.logger.info('Setting editor content:', content);
    this.editorData = content;

    if (this.editorComponent && this.editorComponent.editor) {
      this.logger.info('Updating TinyMCE editor');
      this.editorComponent.editor.setContent(content);

      // Re-apply styles to editor content
      const myths = this.editorComponent.editor.getBody().querySelectorAll('.myth-line');
      myths.forEach(myth => {
        const mythElement = myth as HTMLElement;
        mythElement.style.color = '#0f0';
        mythElement.style.fontStyle = 'italic';
        const verse = mythElement.getAttribute('data-verse');
        if (verse) {
          mythElement.dataset['verse'] = verse; // Use bracket notation
        }
      });
    }

    if (this.markdownPreview) {
      this.logger.info('Updating markdown preview');
      this.markdownPreview.nativeElement.innerHTML = content;

      const myths = this.markdownPreview.nativeElement.querySelectorAll('.myth-section');
      this.logger.info('Found myth sections:', myths.length);
    }

    this.updateChapters(content);
    this.cdr.detectChanges();
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
    this.logger.info('AI Assistant invoked');
  }

  changeFont(event: Event): void {
    const font = (event.target as HTMLSelectElement).value;
    this.selectedFont = font;
    this.setFontFamily(font);
    if (this.editorComponent && this.editorComponent.editor) {
      this.renderer2.setStyle(this.editorComponent.editor.getBody(), 'fontFamily', font);
    }
    if (this.markdownPreview) {
      this.renderer2.setStyle(this.markdownPreview.nativeElement, 'fontFamily', font);
    }
    this.cdr.detectChanges();
  }

  changeFontSize(event: Event): void {
    const fontSize = (event.target as HTMLSelectElement).value;
    this.selectedFontSize = fontSize;
    if (this.editorComponent && this.editorComponent.editor) {
      this.renderer2.setStyle(this.editorComponent.editor.getBody(), 'fontSize', fontSize);
    }
    if (this.markdownPreview) {
      this.renderer2.setStyle(this.markdownPreview.nativeElement, 'fontSize', fontSize);
    }
    this.cdr.detectChanges();
  }

  onSave(): void {
    this.logger.info('Saving content');
  }

  toggleRSVP() {
    this.isRSVPMode = !this.isRSVPMode;
    if (this.isRSVPMode) {
      this.startRSVP();
    } else {
      if (this.rsvpInterval !== undefined) {
        if (this.rsvpInterval !== undefined) {
          clearInterval(this.rsvpInterval);
          this.rsvpInterval = undefined;
        }
        this.rsvpInterval = undefined;
      }
      this.isRSVPPlaying = false;
    }
  }

  startRSVP() {
    const textContent = this.markdownPreview?.nativeElement?.innerText || '';
    this.words = textContent.split(/\s+/); // Splitting into words
    this.wordIndex = 0;
    this.isRSVPPlaying = true;
    this.runRSVP();
  }

  runRSVP() {
    if (this.rsvpInterval !== undefined) {
      clearInterval(this.rsvpInterval);
      this.rsvpInterval = undefined;
    }
    this.logger.info(`RSVP Speed: ${this.rsvpSpeed} WPM`); // Log the current speed
    const interval = 600000 / Math.pow(this.rsvpSpeed, 1.5); // Exponential function for interval calculation
    this.rsvpInterval = window.setInterval(() => {
      if (this.wordIndex < this.words.length) {
        this.rsvpWord = this.words[this.wordIndex++] || '';
      } else {
        this.toggleRSVP(); // Auto-exit on completion
      }
    }, interval); // Use the calculated interval
  }

  togglePlayPause() {
    this.isRSVPPlaying = !this.isRSVPPlaying;
    if (this.isRSVPPlaying) {
      this.runRSVP();
    } else {
      clearInterval(this.rsvpInterval);
    }
  }

  toggleImages(visible: boolean): void {
    this.areImagesVisible = visible;
    this.updateImageVisibility(this.areImagesVisible);
  }

  updateImageVisibility(visible: boolean): void {
    if (this.editorComponent && this.editorComponent.editor) {
      const editor = this.editorComponent.editor;
      const content = editor.getContent();
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const images = doc.querySelectorAll('img');
      images.forEach((img: HTMLImageElement) => {
        img.style.display = this.areImagesVisible ? 'inline' : 'none';
      });
      editor.setContent(doc.body.innerHTML);
    }

    if (this.markdownPreview) {
      const images = this.markdownPreview.nativeElement.querySelectorAll('img');
      images.forEach((img: HTMLElement) => {
        img.style.display = this.areImagesVisible ? 'inline' : 'none';
      });
    }
  }

  processDocument(data: ArrayBuffer, fileUrl: string): void {
    // Extract file name from the URL
    const fileName = this.extractFileNameFromUrl(fileUrl);

    const file = new File([data], fileName, {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // Use the existing docParseService to parse the DOCX file
    this.docParseService
      .parseDoc(file)
      .then(content => {
        // Process myths before rendering
        const processedContent = this.processMythContent(content);
        this.renderMarkdown(processedContent);
        const colorObj = this.documentColors.length
          ? this.documentColors[this.openedDocuments.length % this.documentColors.length] || { color: '#000000', contrast: '#000000' }
          : { color: '#000000', contrast: '#000000' };
        const newDocument = {
          name: file.name,
          color: colorObj.color,
          contrast: colorObj.contrast || '#000000',
        };

        // Check if the document already exists in openedDocuments
        if (!this.openedDocuments.some(doc => doc.name === file.name)) {
          this.openedDocuments.push(newDocument);
        }
      })
      .catch(error => {
        this.logger.error('Error processing document:', error);
      });

    this.cdr.detectChanges();
  }

  extractFileNameFromUrl(url: string): string {
    const parts = url.split('/');
    let filename = parts[parts.length - 1] || '';
    if (!filename) return '';
    // Remove file extension
    if (filename.includes('.')) {
      filename = filename.split('.').slice(0, -1).join('.');
    }
    return filename;
  }

  private processMythContent(content: string): string {
    this.logger.info('\n=== Processing Content for Myths ===');

    const lines = content.split('\n');
    let mythCount = 0;

    const processedLines = lines.map((line, index) => {
      // Match both markdown-style and standard verse formats
      const mythRegex = /^\[(\d+(?:-\d+)?)\](?:\(([^\)]+)\))(.*)$|^(\d+(?:-\d+)?)\.\s*(.+)$/;
      const mythMatch = line.match(mythRegex);

      if (mythMatch) {
        mythCount++;

        const verse = mythMatch[1] || mythMatch[4]; // Bracketed or standard verse
        const link = mythMatch[2];
        const content = (mythMatch[3] || mythMatch[5] || '').trim();

        this.logger.info(`Line ${index + 1}: Found myth #${verse} (Length: ${content.length} chars, Link: ${link || 'N/A'})`);

        if (link) {
          return `<div class="myth-section">
            <p class="myth-line" data-verse="${verse}"><a href="${link}">${verse}</a> ${content}</p>
          </div>`;
        } else {
          return `<div class="myth-section">
            <p class="myth-line" data-verse="${verse}">${content}</p>
          </div>`;
        }
      }
      return line;
    });

    const result = processedLines.join('\n');
    this.logger.info(`\nProcessed ${mythCount} myths`);

    // Update display
    if (this.markdownPreview) {
      const myths = this.markdownPreview.nativeElement.querySelectorAll('.myth-line');
      this.logger.info('Found myth sections:', myths.length);
      myths.forEach((myth: HTMLElement, index: number) => {
        this.logger.info(`Myth ${index + 1}:`, {
          verse: myth.getAttribute('data-verse'),
          content: myth.textContent?.trim(),
        });
      });
    }

    return result;
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    document.body.classList.toggle('dark-theme', this.isDarkTheme);

    if (this.editorComponent?.editor) {
      const body = this.editorComponent.editor.getBody();
      body.classList.toggle('dark-theme', this.isDarkTheme);
    } else if (this.markdownPreview) {
      const markdownPreviewElement = this.renderer2.selectRootElement(this.markdownPreview.nativeElement, true);
      this.renderer2.addClass(markdownPreviewElement, 'dark-theme');
      this.markdownPreview.nativeElement.classList.toggle('dark-theme', this.isDarkTheme);
    } else {
      this.applyTheme();
    }
  }

  applyTheme(): void {
    this.isLightTheme = !this.isDarkTheme;
  }

  setFontFamily(font: string) {
    this.fontFamily = font;
  }

  loadDocumentContent(documentName: string): void {
    const fileUrl = `/api/files/document/book/${documentName}.docx`;
    this.http
      .get(fileUrl, {
        responseType: 'arraybuffer',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Cache-Control': 'no-cache',
        },
      })
      .pipe(
        catchError(error => {
          this.logger.error(`Error loading document ${fileUrl}:`, error);
          return throwError(() => error);
        }),
      )
      .subscribe({
        next: (data: ArrayBuffer) => {
          if (!data || data.byteLength === 0) {
            this.logger.error(`Received empty document data for ${fileUrl}`);
            return;
          }
          this.logger.info(`Document ${fileUrl} loaded successfully, size:`, data.byteLength);
          this.docParseService
            .parseDoc(new File([data], documentName + '.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))
            .then(content => {
              this.editorData = content;
              this.renderMarkdown(content);
              this.updateChapters(content);
              this.cdr.detectChanges();
            });
        },
        error: error => {
          this.logger.error(`Failed to load document ${fileUrl}:`, error);
        },
      });
  }
}
