import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { EventObj } from '@tinymce/tinymce-angular/editor/Events';
import tinymce, { Editor, EditorOptions } from 'tinymce';
import { DocParseService } from '../../common/services/doc-parse.service';
import { PdfParseService } from '../../common/services/pdf-parse.service';
import { UserStateService } from '../../common/services/user-state.service';
import TurndownService from 'turndown';
import * as marked from 'marked';
import * as hljs from 'highlight.js';

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

  documents = ['Document 1', 'Document 2', 'Document 3'];
  editorData = '<p>Initial content</p>';
  selectedDocument: string | null = null;
  chapters: string[] = [];
  isMarkdownView = false;

  init: Partial<EditorOptions> = {
    license_key: 'gpl', // License key
    base_url: '/tinymce', // Base URL for Tinymce
    suffix: '.min', // File suffix
    selector: 'textarea', // Textarea selector
    height: 500, // Editor height
    menubar: false, // Menubar
    toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | code | toggleMarkdown',
    setup: (editor: Editor) => {
      editor.ui.registry.addButton('toggleMarkdown', {
        text: 'Toggle Markdown',
        onAction: () => {
          this.toggleMarkdownView();
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

  constructor(
    private docParseService: DocParseService,
    private pdfParseService: PdfParseService,
    private userStateService: UserStateService
  ) { }

  ngOnInit(): void { }

  onInit(event: EventObj<any>): void {
    console.log('EditorComponent initialized');
    tinymce.init({
      selector: 'textarea',
      plugins: 'code',
      toolbar: 'code',
      height: 500,
      setup: (editor: Editor) => {
        editor.on('Change', (e) => this.onChange(e));
      }
    });
  }

  onChange({ editor }: { editor: Editor }) {
    const content = editor.getContent();
    console.log(content); // Handle editor data here
    this.updateChapters(content);
  }

  onDocumentSelected(document: string): void {
    // Load the selected document into TinyMCE
    this.selectedDocument = document;
    this.editorData = `<h1>${document}</h1><h2>Chapter 1</h2><p>Content of ${document} - Chapter 1</p><h2>Chapter 2</h2><p>Content of ${document} - Chapter 2</p>`;
    this.updateChapters(this.editorData);
    this.userStateService.addOpenedDocument(document);
  }

  updateChapters(content: string): void {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    this.chapters = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(header => header.textContent || '');
  }

  toggleSidebar(): void {
    this.sidenav.toggle();
  }

  async onFileSelected(event: any): Promise<void> {
    const file: File = event.target.files[0];
    if (file) {
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
    }
  }

  renderMarkdown(markdown: string): void {
    marked.setOptions({
      highlight: (code: string) => {
        return hljs.default.highlightAuto(code).value;
      }
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
}