#!/usr/bin/env node

/**
 * Validates training data against the entity definitions
 * 
 * This script reads training data files and validates them against
 * the entity interfaces defined in entities.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
import { TrainingExample } from '../entities';

program
  .option('-s, --source <dir>', 'Source directory containing JSONL files to validate')
  .option('-v, --verbose', 'Show verbose output', false)
  .parse(process.argv);

const options = program.opts();
const sourceDir = options.source || './training_data';
const verbose = options.verbose;

interface ValidationResult {
  file: string;
  totalExamples: number;
  validExamples: number;
  invalidExamples: number;
  issues: Array<{
    line: number;
    error: string;
  }>;
}

function validateTrainingExample(example: any): { valid: boolean; error?: string } {
  // Basic structure validation
  if (!example.input || typeof example.input !== 'string') {
    return { valid: false, error: 'Missing or invalid input field' };
  }
  
  if (!example.output || typeof example.output !== 'string') {
    return { valid: false, error: 'Missing or invalid output field' };
  }
  
  // Validate input/output aren't too short
  if (example.input.length < 5) {
    return { valid: false, error: 'Input is too short' };
  }
  
  if (example.output.length < 5) {
    return { valid: false, error: 'Output is too short' };
  }
  
  // Optional metadata validation
  if (example.metadata) {
    if (typeof example.metadata !== 'object') {
      return { valid: false, error: 'Metadata must be an object' };
    }
    
    // Validate specific metadata fields if they exist
    if (example.metadata.difficulty && 
        !['beginner', 'intermediate', 'advanced'].includes(example.metadata.difficulty)) {
      return { valid: false, error: 'Invalid difficulty value in metadata' };
    }
  }
  
  return { valid: true };
}

function validateFile(filePath: string): ValidationResult {
  console.log(`Validating file: ${filePath}`);
  
  const result: ValidationResult = {
    file: filePath,
    totalExamples: 0,
    validExamples: 0,
    invalidExamples: 0,
    issues: []
  };
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    result.totalExamples = lines.length;
    
    lines.forEach((line, index) => {
      try {
        const example = JSON.parse(line);
        const validation = validateTrainingExample(example);
        
        if (validation.valid) {
          result.validExamples++;
        } else {
          result.invalidExamples++;
          result.issues.push({
            line: index + 1,
            error: validation.error || 'Unknown validation error'
          });
        }
      } catch (e) {
        result.invalidExamples++;
        result.issues.push({
          line: index + 1,
          error: `JSON parsing error: ${e instanceof Error ? e.message : String(e)}`
        });
      }
    });
    
  } catch (e) {
    console.error(`Error reading file ${filePath}: ${e instanceof Error ? e.message : String(e)}`);
    result.issues.push({
      line: 0,
      error: `File read error: ${e instanceof Error ? e.message : String(e)}`
    });
  }
  
  return result;
}

// Collect all JSONL files in the source directory
function getJsonlFiles(dir: string): string[] {
  const files: string[] = [];
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      files.push(...getJsonlFiles(itemPath));
    } else if (item.isFile() && item.name.endsWith('.jsonl')) {
      files.push(itemPath);
    }
  }
  
  return files;
}

function printValidationSummary(results: ValidationResult[]): void {
  console.log('\nValidation Summary:');
  console.log('==================');
  
  let totalFiles = results.length;
  let totalExamples = 0;
  let totalValidExamples = 0;
  let totalInvalidExamples = 0;
  let filesWithIssues = 0;
  
  results.forEach(result => {
    totalExamples += result.totalExamples;
    totalValidExamples += result.validExamples;
    totalInvalidExamples += result.invalidExamples;
    
    if (result.issues.length > 0) {
      filesWithIssues++;
    }
    
    const validPercent = result.totalExamples ? 
      (result.validExamples / result.totalExamples * 100).toFixed(2) : '0.00';
    
    console.log(`File: ${result.file}`);
    console.log(`  Examples: ${result.totalExamples}`);
    console.log(`  Valid: ${result.validExamples} (${validPercent}%)`);
    console.log(`  Invalid: ${result.invalidExamples}`);
    
    if (verbose && result.issues.length > 0) {
      console.log('  Issues:');
      result.issues.forEach(issue => {
        console.log(`    Line ${issue.line}: ${issue.error}`);
      });
    } else if (result.issues.length > 0) {
      console.log(`  Issues: ${result.issues.length} (use --verbose to see details)`);
    }
    
    console.log('');
  });
  
  const overallValidPercent = totalExamples ? 
    (totalValidExamples / totalExamples * 100).toFixed(2) : '0.00';
  
  console.log('Overall Statistics:');
  console.log(`  Total Files: ${totalFiles}`);
  console.log(`  Files With Issues: ${filesWithIssues}`);
  console.log(`  Total Examples: ${totalExamples}`);
  console.log(`  Valid Examples: ${totalValidExamples} (${overallValidPercent}%)`);
  console.log(`  Invalid Examples: ${totalInvalidExamples}`);
}

// Main execution
console.log(`Validating training data in ${sourceDir}`);

try {
  const files = getJsonlFiles(sourceDir);
  
  if (files.length === 0) {
    console.log('No JSONL files found for validation.');
    process.exit(0);
  }
  
  console.log(`Found ${files.length} JSONL files for validation.`);
  
  const results = files.map(file => validateFile(file));
  printValidationSummary(results);
  
  // Exit with error if any invalid examples found
  const totalInvalid = results.reduce((sum, r) => sum + r.invalidExamples, 0);
  if (totalInvalid > 0) {
    console.log(`\nValidation failed with ${totalInvalid} invalid examples.`);
    process.exit(1);
  } else {
    console.log('\nValidation successful! All examples are valid.');
    process.exit(0);
  }
} catch (error) {
  console.error('Validation process failed:', error);
  process.exit(1);
}
