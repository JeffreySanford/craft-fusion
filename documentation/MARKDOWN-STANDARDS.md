# Markdown Standards Guide

This document demonstrates proper Markdown formatting that will pass markdownlint checks.

## Blank Lines Around Headings

All headings should have blank lines before and after them, like this heading.

## Lists Must Have Blank Lines

Lists should be surrounded by blank lines:

- Item 1
- Item 2
- Item 3

The list above has proper blank lines before and after.

## Code Blocks Need Language Identifiers

Always include language identifiers with code blocks:

```typescript
// This TypeScript code block has a language identifier
function exampleFunction(): string {
  return "Hello, world!";
}
```

## Proper Heading Structure

### Don't Skip Heading Levels

Always use proper heading hierarchy - don't jump from H2 to H4.

## Tables Should Be Formatted Consistently

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |

## Avoid Trailing Spaces

Lines should not end with spaces. Use a linter to detect these.

## Use Proper Link Syntax

[Use descriptive link text](https://example.com) rather than just URLs.

## Indented Lists Need Proper Spacing

1. First level item
   - Second level item
   - Another second level
2. Back to first level

## Images Should Have Alt Text

![Alt text describing this image](path/to/image.jpg)

## Emphasis and Strong Text

Use *italic* for emphasis and **bold** for strong emphasis.

## Project-wide Standards

- All documentation should reference the vibrant, color-coded CLI output where relevant.
- DRY scripting and system-prep.sh are project-wide standards.

---

Last Updated: 2025-05-25
