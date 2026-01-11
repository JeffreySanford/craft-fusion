// scripts/copy-kanban-seed-jsons.js
// Copies kanban seed JSON files from src/app/seed to frontend mocks directory

const fs = require('fs');
const path = require('path');

// Source and destination paths
const sourceDir = path.join(__dirname, '..', 'forgeboard-api', 'src', 'app', 'mocks');
const targetDir = path.join(__dirname, '..', 'forgeboard-api', 'src', 'app', 'seed');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// Files to copy
const filesToCopy = [
  'kanban-example-boards.json',
  'kanban-forgeboard-stories.json'
];

console.log('Copying kanban seed files...');

filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✓ Copied ${file}`);
    } else {
      console.log(`⚠ Source file not found: ${sourcePath}`);
    }
  } catch (error) {
    console.error(`✗ Error copying ${file}:`, error.message);
  }
});

console.log('Copy operation completed.');

// Verify the files exist and show summary
console.log('\nSeed files summary:');
filesToCopy.forEach(file => {
  const targetPath = path.join(targetDir, file);
  if (fs.existsSync(targetPath)) {
    const stats = fs.statSync(targetPath);
    const content = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
    const boardCount = Array.isArray(content) ? content.length : 0;
    console.log(`✓ ${file} (${stats.size} bytes, ${boardCount} boards)`);
  } else {
    console.log(`✗ ${file} - not found`);
  }
});
