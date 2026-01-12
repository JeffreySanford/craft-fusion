import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

const thumbsUpSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M12 2l2 6h6v8h-5l1 6-7-8H6V8h4z" />
</svg>`;

@Component({
  selector: 'app-material-buttons',
  templateUrl: './material-buttons.component.html',
  styleUrls: ['./material-buttons.component.scss'],
  standalone: false,
})
export class MaterialButtonsComponent {
  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
    const iconLiteral = sanitizer.bypassSecurityTrustHtml(thumbsUpSvg);
    iconRegistry.addSvgIconLiteral('thumbs-up', iconLiteral);
  }
}
