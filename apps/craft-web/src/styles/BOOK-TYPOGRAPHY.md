# Book Typography

# Book Application Typography Guide

This document outlines the typography system used in the Craft Fusion book application, following Material Design 3 principles.

## Transparency Note
Typography guidelines now align with MD3 principles. Automated steps helped ensure consistent updates across all styles.

## Font Hierarchy

We use five specialized fonts for different parts of the book content:

| Role | Font | Usage |
|------|------|-------|
| Body Text | Merriweather | Main content text for optimal reading experience |
| Chapter Headings | Playfair Display | Chapter titles and major section divisions |
| Section Headings | Lora | Section headings and subheadings within chapters |
| Quotes & Callouts | Libre Baskerville | Block quotes, important callouts, and epigraphs |
| Footnotes & Captions | Source Sans Pro | Footnotes, captions, and supplementary information |

## Typography Classes

### Main Content

```html
<div class="chapter-content">
  <h1>Chapter One: The Beginning</h1>
  
  <p>The main text of the chapter goes here, using the body text font.</p>
  
  <h2>First Section Heading</h2>
  
  <p>More content using the body text font.</p>
  
  <blockquote>
    This is a quote that will use the quote styling.
  </blockquote>
  
  <p>Additional content with a <span class="footnote">1. This is a footnote using the footnote styling.</span></p>
</div>
```

### Title Page

```html
<div class="book-title-page">
  <h1 class="book-title">The Great American Novel</h1>
  <h2 class="book-subtitle">A Journey Through History</h2>
  <div class="book-author">By John Doe</div>
</div>
```

## CSS Variables

For component-specific styling, use these CSS variables:

```scss
// Font families
--font-book-body: var(--font-merriweather);
--font-book-chapter: var(--font-playfair);
--font-book-section: var(--font-lora);
--font-book-quote: var(--font-libre-baskerville);
--font-book-footnote: var(--font-source-sans-pro);
```

## Responsive Considerations

The book typography automatically adjusts for different screen sizes:

- **Desktop**: Optimal reading width of 800px with larger font sizes
- **Tablet**: Slightly reduced margins and font sizes
- **Mobile**: Single-column layout with adjusted font sizes for readability

## Accessibility Features

- All text maintains a minimum contrast ratio of 4.5:1 against backgrounds
- Font sizes use relative units (em) for user scalability
- Line heights are optimized for readability (1.5-1.7 for body text)
- Color is not used as the only means of conveying information
