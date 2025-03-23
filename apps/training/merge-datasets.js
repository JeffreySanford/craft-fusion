#!/usr/bin/env node

/**
 * This script merges multiple JSONL datasets into a single combined file
 * for training LLMs.
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

program
  .option('-i, --input <dir>', 'Input directory containing JSONL files')
  .option('-o, --output <file>', 'Output file path for merged dataset')
  .option('-d, --deduplicate', 'Remove duplicate entries', false)
  .option('-r, --randomize', 'Randomize the order of entries', false)
  .option('-v, --verbose', 'Show verbose output', false)
  .parse(process.argv);

const options = program.opts();

// Set defaults if not provided
const inputDir = options.input || './training_data/etscl';
const outputFile = options.output || './training_data/combined.jsonl';
const shouldDeduplicate = options.deduplicate;
const shouldRandomize = options.randomize;
const verbose = options.verbose;

function log(message) {
  if (verbose) {
    console.log(message);
  }
}

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  log(`Created output directory: ${outputDir}`);
}

// Get all JSONL files from the input directory
const jsonlFiles = fs.readdirSync(inputDir)
  .filter(file => file.endsWith('.jsonl'))
  .map(file => path.join(inputDir, file));

if (jsonlFiles.length === 0) {
  console.error(`No JSONL files found in ${inputDir}`);
  process.exit(1);
}

log(`Found ${jsonlFiles.length} JSONL files to merge.`);

// Read and merge all files
let allEntries = [];
const seenEntries = new Set();

jsonlFiles.forEach(file => {
  log(`Processing file: ${file}`);
  const content = fs.readFileSync(file, 'utf8');
  let fileEntries = 0;
  let duplicates = 0;
  
  content.split('\n').forEach(line => {
    if (!line.trim()) return;
    
    try {
      const entry = JSON.parse(line);
      fileEntries++;
      
      // Deduplicate if necessary
      if (shouldDeduplicate) {
        const key = JSON.stringify({
          input: entry.input,
          output: entry.output
        });
        
        if (seenEntries.has(key)) {
          duplicates++;
          return;
        }
        
        seenEntries.add(key);
      }
      
      allEntries.push(entry);
    } catch (err) {
      console.warn(`Invalid JSON line in ${file}: ${line.substring(0, 50)}...`);
    }
  });
  
  log(`  - Added ${fileEntries - duplicates} entries (${duplicates} duplicates skipped).`);
});

// Randomize if necessary
if (shouldRandomize) {
  log('Randomizing entries...');
  allEntries = allEntries.sort(() => Math.random() - 0.5);
}

// Write the merged dataset
const outputStream = fs.createWriteStream(outputFile);
allEntries.forEach(entry => {
  outputStream.write(JSON.stringify(entry) + '\n');
});
outputStream.end();

console.log(`Merged dataset created at ${outputFile}`);
console.log(`Total entries: ${allEntries.length}`);
