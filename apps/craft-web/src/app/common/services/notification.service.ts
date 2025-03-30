import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class NotificationService {
    private unreadCount: number = 0;

    constructor(private toastr: ToastrService) { }

    clear() {
        this.toastr.clear();
    }
    
    // Consolidated showSuccess method
    showSuccess(message: string, title?: string): void {
        this.toastr.success(message, title || 'Success');
        console.log(`Success notification: ${message}`);
    }

    // Consolidated showError method
    showError(message: string, title?: string): void {
        this.toastr.error(message, title || 'Error');
        console.log(`Error notification: ${message}`);
    }

    showInfo(message: string, title: string = 'Info'): void {
        this.toastr.info(message, title);
    }

    showWarning(message: string, title: string = 'Warning'): void {
        this.toastr.warning(message, title);
    }

    /**
     * Display custom notification
     * @param message The message configuration
     */
    show(message: { message: string, type: string, duration: number }): void {
        // Implementation depends on your notification system
        console.log(`Notification: ${message.type} - ${message.message}`);
        
        switch(message.type) {
            case 'success':
                this.toastr.success(message.message);
                break;
            case 'error':
                this.toastr.error(message.message);
                break;
            case 'info':
                this.toastr.info(message.message);
                break;
            case 'warning':
                this.toastr.warning(message.message);
                break;
        }
    }

    /**
     * Get unread notification count
     * @returns Observable of unread count
     */
    getUnreadCount(): Observable<number> {
        return of(this.unreadCount);
    }
}