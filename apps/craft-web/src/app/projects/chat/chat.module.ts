import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { ChatComponent } from './chat.component';
import { ChatService } from './chat.service';
import { MarkdownPipe } from './markdown.pipe';
import { ModelSelectorComponent } from './model-selector/model-selector.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { SplitTextPipe } from './split-text.pipe';

const routes: Routes = [{ path: '', component: ChatComponent }];

@NgModule({
  declarations: [ChatComponent, MarkdownPipe, ModelSelectorComponent, SplitTextPipe],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MaterialModule,
    MatSnackBarModule,
    MatCardModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatIconModule,
    MatSelectModule,
  ],
  providers: [ChatService],
  exports: [ChatComponent, MarkdownPipe, ModelSelectorComponent],
})
export class ChatModule {}
