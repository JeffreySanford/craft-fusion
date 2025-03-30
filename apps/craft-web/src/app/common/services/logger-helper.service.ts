import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerHelperService {
  /**
   * Convert any timestamp (Date or number) to a Date object
   */
  toDate(timestamp: Date | number): Date {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    return new Date(timestamp);
  }

  /**
   * Convert any timestamp (Date or number) to milliseconds
   */
  toMilliseconds(timestamp: Date | number): number {
    if (timestamp instanceof Date) {
      return timestamp.getTime();
    }
    return timestamp;
  }

  /**
   * Safely compare two timestamps that could be Date or number
   */
  compareTimestamps(a: Date | number, b: Date | number): number {
    const timeA = a instanceof Date ? a.getTime() : a;
    const timeB = b instanceof Date ? b.getTime() : b;
    return timeA - timeB;
  }

  /**
   * Format a timestamp as a relative time string
   */
  formatTimeAgo(timestamp: Date | number): string {
    if (!timestamp) return 'Never';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    // Create stable time outputs by rounding to nearest increment
    if (seconds < 60) {
      const roundedSeconds = Math.floor(seconds / 5) * 5; // Round to nearest 5 seconds
      return `${roundedSeconds === 0 ? 'Just now' : roundedSeconds + ' sec ago'}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  /**
   * Format a timestamp as a date string
   */
  formatDate(timestamp: Date | number): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString();
  }

  /**
   * Format a timestamp as a time string
   */
  formatTime(timestamp: Date | number): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString();
  }

  /**
   * Format a timestamp as a full date and time string
   */
  formatDateTime(timestamp: Date | number): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString();
  }
}
