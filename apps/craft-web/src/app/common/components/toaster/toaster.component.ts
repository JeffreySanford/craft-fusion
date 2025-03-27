import { Component, OnInit, Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-toaster',
  templateUrl: './toaster.component.html',
  styleUrls: ['./toaster.component.scss'],
})
export class ToasterComponent implements OnInit {
  @Input() message: string = '';
  @Input() title: string = '';
  @Input() showOnInit: boolean = false;
  @Input() useHtml: boolean = false;

  constructor(private toastr: ToastrService, private notifyService: NotificationService) {}

  ngOnInit(): void {
    console.log('ToasterComponent');
    if (this.showOnInit && this.message) {
      this.showToast();
    }
  }

  showToast() {
    if (this.useHtml) {
      this.showHTMLMessage(this.message, this.title);
    } else {
      this.showToaster(this.message, this.title);
    }
  }

  showToaster(message: string, title: string) {
    this.notifyService.showSuccess(message, title);
  }

  showHTMLMessage(message: string, title: string) {
    this.toastr.success(message, title, {
      enableHtml: true
    });
  }
}
