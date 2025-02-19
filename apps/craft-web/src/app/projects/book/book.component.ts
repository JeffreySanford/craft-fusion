import { Component, OnInit, ViewChild, ElementRef, Renderer2, AfterViewInit, ChangeDetectorRef, HostBinding } from '@angular/core';
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
import { of, from, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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
  @ViewChild('markdownPreview', { static: false }) markdownPreview!: ElementRef;

  isDarkTheme = false; // Set light theme as default
  @HostBinding('class.light-theme') isLightTheme: boolean = !this.isDarkTheme;
  @HostBinding('class.dark-theme') get isDarkThemeClass() { return this.isDarkTheme; }
  @HostBinding('style.--book-font-family') fontFamily: string = "'IBM Plex Serif', serif";
  @HostBinding('style.--book-font-size') fontSize: string = "1.25em";

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
  isWinking: boolean = false;
  currentTitle: string = '';

  isRSVPMode = false;
  isRSVPPlaying = false;
  rsvpWord = '';
  rsvpSpeed = 300; // Default 300ms per word
  words: string[] = [];
  wordIndex = 0;
  rsvpInterval: any;
  areImagesVisible = false;

  constructor(
    private docParseService: DocParseService,
    private pdfParseService: PdfParseService,
    private userStateService: UserStateService,
    private ref: ElementRef,
    private renderer2: Renderer2,
    private fileUploadService: FileUploadService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
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
  }

  loadFilesFromAssets(): void {
    console.log('Loading document from API storage...');
    this.http.get('/api/files/document/book/Chapter 1 - Enki.docx', { 
      responseType: 'arraybuffer',
      headers: { 
        'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Cache-Control': 'no-cache'
      }
    }).pipe(
      catchError(error => {
        console.error('Error loading document:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (data: ArrayBuffer) => {
        if (!data || data.byteLength === 0) {
          console.error('Received empty document data');
          return;
        }
        console.log('Document loaded successfully, size:', data.byteLength);
        this.processDocument(data);
      },
      error: (error) => {
        console.error('Failed to load document:', error);
      }
    });
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
    debugger
    this.updateImageVisibility();
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
    console.log('Setting editor content:', content);
    this.editorData = content;
    
    if (this.editorComponent && this.editorComponent.editor) {
      console.log('Updating TinyMCE editor');
      this.editorComponent.editor.setContent(content);
    }
    
    if (this.markdownPreview) {
      console.log('Updating markdown preview');
      this.markdownPreview.nativeElement.innerHTML = content;
      
      const myths = this.markdownPreview.nativeElement.querySelectorAll('.myth-section');
      console.log('Found myth sections:', myths.length);
      myths.forEach((myth: HTMLElement, index: number) => {
        console.log(`Myth ${index + 1}:`, myth.textContent);
      });
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
    console.log('AI Assistant invoked');
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
    console.log('Saving content');
  }

  toggleRSVP() {
    this.isRSVPMode = !this.isRSVPMode;
    if (this.isRSVPMode) {
      this.startRSVP();
    } else {
      clearInterval(this.rsvpInterval);
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
    clearInterval(this.rsvpInterval);
    console.log(`RSVP Speed: ${this.rsvpSpeed} WPM`); // Log the current speed
    const interval = 600000 / Math.pow(this.rsvpSpeed, 1.5); // Exponential function for interval calculation
    this.rsvpInterval = setInterval(() => {
      if (this.wordIndex < this.words.length) {
        this.rsvpWord = this.words[this.wordIndex++];
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

  toggleImages(): void {
    this.areImagesVisible = !this.areImagesVisible;
    this.updateImageVisibility();
  }

  updateImageVisibility(): void {
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

  processDocument(data: ArrayBuffer): void {
    const file = new File([data], 'Chapter 1 - Enki.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    // Use the existing docParseService to parse the DOCX file
    this.docParseService.parseDoc(file).then(content => {
      // Process myths before rendering
      const processedContent = this.processMythContent(content);
      this.renderMarkdown(processedContent);
      this.selectedDocument = {
        name: file.name,
        color: this.documentColors[this.openedDocuments.length % this.documentColors.length]
      };
      this.openedDocuments.push(this.selectedDocument);
      this.cdr.detectChanges();
    }).catch(error => {
      console.error('Error processing document:', error);
    });
  }

  private processMythContent(content: string): string {
    console.log('\n=== Processing Content for Myths ===');
    
    const lines = content.split('\n');
    let mythCount = 0;
    
    const processedLines = lines.map((line, index) => {
      // Match both markdown-style and standard verse formats
      const mythRegex = /^\[(\d+(?:-\d+)?)\](?:\(([^\)]+)\))(.*)$|^(\d+(?:-\d+)?)\.\s*(.+)$/;
      const mythMatch = line.match(mythRegex);
      
      if (mythMatch) {
        mythCount++;
        console.log(`Line ${index + 1}: Found myth:`, mythMatch[0]);
        
        const verse = mythMatch[1] || mythMatch[4]; // Bracketed or standard verse
        const link = mythMatch[2];
        const content = (mythMatch[3] || mythMatch[5] || '').trim();
        
        if (link) {
          return `<p class="myth-line" data-verse="${verse}"><a href="${link}">${verse}</a> ${content}</p>`;
        } else {
          return `<p class="myth-line" data-verse="${verse}">${content}</p>`;
        }
      }
      return line;
    });
  
    const result = processedLines.join('\n');
    console.log(`\nProcessed ${mythCount} myths`);
    
    // Update display
    if (this.markdownPreview) {
      const myths = this.markdownPreview.nativeElement.querySelectorAll('.myth-line');
      console.log('Found myth sections:', myths.length);
      myths.forEach((myth: HTMLElement, index: number) => {
        console.log(`Myth ${index + 1}:`, {
          verse: myth.getAttribute('data-verse'),
          content: myth.textContent?.trim()
        });
      });
    }
    
    return result;
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
  }

  applyTheme(): void {
    this.isLightTheme = !this.isDarkTheme;
  }

  setFontFamily(font: string) {
    this.fontFamily = font;
  }
}
