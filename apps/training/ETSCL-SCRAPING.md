# ETSCL Data Scraping Documentation

This document explains the Enhanced Technical Support Conversation Logs (ETSCL) scraping functionality within the Craft Fusion project.

## Overview

The ETSCL scraper is a utility designed to extract technical support conversations from various sources and convert them into structured training data for fine-tuning large language models. The primary focus is on IT support, software engineering, and technical troubleshooting conversations.

## Components

### 1. Main Scraping Script

The `new-etscl.ts/js` script is the primary entry point for initiating a scraping session. It uses a configurable approach to target specific data sources and extract relevant information.

### 2. Entity Definitions

The `entities.ts` file contains TypeScript interfaces that represent the data model for scraped conversations. These type-safe definitions ensure consistent data formatting and enable automated validation. The entity system includes:

- `Conversation`: Complete technical support interactions
- `Message`: Individual messages within a conversation
- `CodeSnippet`: Code examples within messages
- `Author`: Information about message authors
- `Source`: Data about the origin of the conversation
- `TrainingExample`: Processed data ready for model training

See [ENTITIES.md](./ENTITIES.md) for detailed documentation of the entity system.

## Usage

### Basic Scraping

```bash
# Using NX
nx run training:scrape-etscl
nx run training:scrape-github
nx run training:scrape-stackexchange

# Using Node.js
node new-etscl.js --source website --output ./training_data/etscl/scraped-support.jsonl
node new-etscl.js --source github --output ./training_data/etscl/github-issues.jsonl
node new-etscl.js --source stackexchange --output ./training_data/etscl/stackexchange-qa.jsonl

# Using NPM scripts
npm run scrape-etscl
npm run scrape-github
npm run scrape-stackexchange

# Using TypeScript (requires ts-node)
ts-node new-etscl.ts --source website --output ./training_data/etscl/scraped-support.jsonl
```

### Merging Datasets

After collecting data from multiple sources, you can merge them into a single dataset:

```bash
# Using NX
nx run training:merge-datasets

# Using Node.js
node merge-datasets.js --input ./training_data/etscl --output ./training_data/combined.jsonl --deduplicate --randomize

# Using NPM script
npm run merge-datasets
```

The merge script supports several options:
- `--input <dir>`: Directory containing JSONL files to merge
- `--output <file>`: Output file path for the merged dataset
- `--deduplicate`: Remove duplicate entries
- `--randomize`: Randomize the order of entries
- `--verbose`: Show detailed output

### Configuration Options

The scraper supports several configuration options:

- `--source`: Specify the data source (e.g., 'website', 'database', 'archive')
- `--format`: Output format ('jsonl', 'csv', 'json')
- `--filter`: Filter criteria for data extraction
- `--limit`: Maximum number of records to extract
- `--transform`: Apply specific transformations to the scraped data
- `--auth`: Authentication credentials for protected sources (if needed)

## Data Processing Pipeline

1. **Extraction**: Raw data is extracted from the source
2. **Filtering**: Irrelevant content is filtered out based on criteria
3. **Normalization**: Text is normalized and cleaned
4. **Structuring**: Data is structured according to entity definitions
5. **Transformation**: Optional transformations are applied
6. **Output**: Data is saved in the specified format

## Output Format

The default output is in JSONL format, optimized for LLM training:

```jsonl
{"input": "How do I troubleshoot a network connectivity issue?", "output": "First, verify your physical connections. Then check your IP configuration with 'ipconfig' on Windows or 'ifconfig' on Linux..."}
{"input": "What's causing my application to crash on startup?", "output": "Application crashes on startup can be caused by corrupted configuration files, missing dependencies, or insufficient permissions..."}
```

## Data Sources

The scraper currently supports the following sources:

1. **ETSCL Website**: Technical support forum conversations, focusing on:
   - User-submitted questions and expert responses
   - Step-by-step troubleshooting sequences
   - Resolution confirmations and follow-ups

2. **GitHub Issues and Discussions**:
   - Bug reports and their resolutions
   - Feature discussions with technical reasoning
   - Code review feedback and improvements
   - Pull request conversations about implementation choices
   
   The GitHub scraper targets open source repositories related to web development, focusing particularly on Angular, React, and related technologies. It extracts structured conversations that show problem-solving processes, technical decision-making, and coding best practices.

3. **Stack Exchange Q&A**:
   - High-quality answers with detailed explanations
   - Code examples and solutions
   - Best practices and architectural advice
   - Expert discussions in comments
   
   The Stack Exchange scraper prioritizes answers with high vote counts and accepted status, ensuring the model learns from community-validated knowledge. It focuses on Stack Overflow, Software Engineering, and Web Applications sites.

4. **Internal Knowledge Base**: Company-specific troubleshooting guides and documentation.

## Scraper-Specific Features

### GitHub Scraper

The GitHub scraper includes specialized features:

1. **Repository Filtering**: Target specific repositories or search across GitHub by topic tags
2. **Issue Quality Metrics**:
   - Prioritize issues with detailed descriptions
   - Focus on issues with accepted solutions
   - Weight issues by reaction counts and comment quality
3. **Code Context Extraction**:
   - Extract code snippets with surrounding discussions
   - Correlate fixes with problem statements
4. **Meta-Discussion Filtering**:
   - Remove non-technical chatter
   - Preserve architectural and design discussions

Usage:
```bash
node new-etscl.js --source github --repo "angular/angular" --output ./training_data/etscl/angular-issues.jsonl
```

### Stack Exchange Scraper

The Stack Exchange scraper features:

1. **Quality Filtering**:
   - Target questions with minimum score threshold
   - Prioritize questions with accepted answers
   - Focus on higher-vote answers
2. **Domain Specialization**:
   - Support for multiple Stack Exchange sites (StackOverflow, ServerFault, etc.)
   - Topic filtering by tags
3. **Answer Curation**:
   - Extract explanations alongside code
   - Process code formatting and blocks
   - Preserve comments on accepted answers

Usage:
```bash
node new-etscl.js --source stackexchange --site "stackoverflow" --tags "angular,typescript" --output ./training_data/etscl/angular-qa.jsonl
```

## Integration with Mythology Data

The training system uniquely integrates technical content with mythological knowledge by:

1. **Cross-Domain Connections**: 
   The scraper tags technical content with relevant philosophical or mythological concepts where applicable (e.g., connecting distributed systems to ancient cosmology).

2. **Concept Mapping**:
   We map technical problem-solving patterns to mythological narratives, creating rich metaphorical connections that enhance the model's conceptual reasoning.

This integration creates a unique training corpus that encourages the model to think across domains and develop deeper conceptual understanding.

## Ethical Considerations

When using the scraper:

1. Respect website terms of service and robots.txt directives
2. Implement rate limiting to avoid overloading servers
3. Anonymize personal information from scraped content
4. Use data only for legitimate training purposes
5. Consider privacy implications of the collected data

## Maintenance

The scraper requires periodic updates to adapt to changes in source websites and data formats. The following maintenance tasks are recommended:

1. Update selector patterns when website layouts change
2. Add support for new data sources as needed
3. Enhance filtering to improve data quality
4. Optimize performance for large-scale scraping operations

## Integration with Training Pipeline

The scraped data integrates with the training pipeline through the following workflow:

1. Run the scraper to collect fresh data
2. Validate and clean the collected data
3. Merge with existing training datasets
4. Use the combined dataset for model fine-tuning

See the main [README.md](./README.md) for more details on the training process.
