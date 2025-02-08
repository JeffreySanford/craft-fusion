import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { ChatComponent } from './chat.component';
import { ChatService } from './chat.service';
import { SplitTextPipe } from './split-text.pipe';

const routes: Routes = [
  { path: '', component: ChatComponent }
];

@NgModule({
  declarations: [
    ChatComponent,

  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MaterialModule,
    SplitTextPipe
  ],
  providers: [ChatService, SplitTextPipe],
  exports: [
    ChatComponent
  ]
})
export class ChatModule {}
