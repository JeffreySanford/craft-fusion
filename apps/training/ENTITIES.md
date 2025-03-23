# Entities for ETSCL Data Scraping

This document describes the entity definitions used in the ETSCL data scraping process of the Craft Fusion project.

## Overview

The entities defined in `entities.ts` provide TypeScript interfaces that model the structure of conversations and technical support interactions. These entities ensure consistent data formatting across different sources and enable type safety throughout the scraping and processing pipeline.

## Core Entities

### Conversation

The `Conversation` entity represents a complete technical support conversation, including:

- Initial question or problem description
- Series of responses and follow-ups
- Resolution status
- Metadata about source and participants

### Message

The `Message` entity represents an individual message within a conversation:

- Content of the message
- Author information
- Timestamps
- Message type (question, answer, follow-up, etc.)
- Related code snippets

### CodeSnippet

The `CodeSnippet` entity captures code examples within messages:

- Code content
- Language identifier
- Context description
- Line references

### Author

The `Author` entity stores information about conversation participants:

- Username or identifier
- Reputation or expertise level
- Role in the conversation
- Profile information

### Source

The `Source` entity tracks the origin of the conversation:

- Platform (GitHub, Stack Exchange, etc.)
- URL
- Original collection timestamp
- Licensing information

## Processing Flow

1. Raw data is scraped from websites and APIs
2. Data is parsed and transformed into these entity structures
3. Entities are validated against the TypeScript interfaces
4. Valid entities are transformed into training-ready formats
5. The resulting data is stored in JSONL format for model training

## Usage in the Codebase

The entity definitions are used throughout the project:

- In scraper modules to structure the extracted data
- In transformation utilities to standardize outputs
- In validation functions to ensure data quality
- In export modules to format data for training

## Examples

### GitHub Issue Entity Example

```typescript
const githubIssue: Conversation = {
  id: "angular/angular#12345",
  title: "Router not working with lazy loaded modules",
  source: {
    platform: "GitHub",
    url: "https://github.com/angular/angular/issues/12345",
    timestamp: "2023-10-15T14:32:45Z",
    license: "MIT"
  },
  messages: [
    {
      id: "issue-body",
      content: "When I try to use lazy loading with the Angular router...",
      author: {
        username: "developer123",
        role: "reporter",
        expertiseLevel: "intermediate"
      },
      timestamp: "2023-10-15T14:32:45Z",
      type: "question",
      codeSnippets: [
        {
          language: "typescript",
          code: "const routes: Routes = [\n  { path: 'feature', loadChildren: () => import('./feature/feature.module').then(m => m.FeatureModule) }\n];"
        }
      ]
    },
    // More messages...
  ],
  resolutionStatus: "solved",
  tags: ["angular", "routing", "lazy-loading"]
};
```

### Stack Exchange Q&A Entity Example

```typescript
const stackOverflowQuestion: Conversation = {
  id: "stackoverflow-54321",
  title: "Understanding RxJS debounceTime vs throttleTime",
  source: {
    platform: "StackOverflow",
    url: "https://stackoverflow.com/questions/54321",
    timestamp: "2023-09-22T09:15:32Z",
    license: "CC BY-SA 4.0"
  },
  messages: [
    // Question and answers...
  ],
  resolutionStatus: "solved",
  acceptedAnswerId: "answer-98765",
  tags: ["rxjs", "angular", "typescript"]
};
```

## Extension and Customization

The entity system is designed to be extensible:

1. New data sources can be accommodated by adding source-specific fields
2. Additional entity types can be added for specialized data
3. Existing entities can be extended with new properties as needs evolve

For adding support for a new data source, extend the related interfaces with the specific fields needed for that source.
