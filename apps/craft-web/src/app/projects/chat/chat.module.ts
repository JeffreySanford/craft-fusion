import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { ChatComponent } from './chat.component';
import { ChatService } from './chat.service';
import { SplitTextPipe } from './split-text.pipe';
import { MarkdownPipe } from './markdown.pipe';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { ModelSelectorComponent } from './model-selector/model-selector.component';
import { MatSelectModule } from '@angular/material/select';

const routes: Routes = [
  { path: '', component: ChatComponent }
];

@NgModule({
  declarations: [
    ChatComponent,
    MarkdownPipe,
    ModelSelectorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MaterialModule,
    SplitTextPipe,
    MatSnackBarModule,
    MatCardModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatIconModule,
    MatSelectModule
  ],
  providers: [ChatService, SplitTextPipe],
  exports: [
    ChatComponent
  ]
})
export class ChatModule {}
