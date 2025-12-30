import { Injectable } from '@angular/core';
import TurndownService from 'turndown';

export type TurndownKeepReplacement = (content: string, node: Node) => string;

@Injectable({ providedIn: 'root' })
export class TurndownWrapperService {
  turndownHtml(html: string): string {
    const turndown = new TurndownService();
    return turndown.turndown(html);
  }

  turndownWithOptions(html: string, options: { keepReplacement?: TurndownKeepReplacement } = {}): string {
    const turndown = new TurndownService(options as any);
    return turndown.turndown(html);
  }
}
