const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CHANGELOG_PATH = path.resolve(__dirname, '../../documentation/project/changelog.md');
const CATEGORIES = {
  'feat': 'Added',
  'fix': 'Fixed', 
  'docs': 'Documentation',
  'style': 'Changed',
  'refactor': 'Changed',
  'perf': 'Changed',
  'test': 'Testing',
  'build': 'Build',
  'ci': 'CI',
  'chore': 'Maintenance',
};

// Parse conventional commit messages
function parseCommitMessage(message) {
  const match = message.match(/^(\w+)(?:\((.+)\))?:\s(.+)$/);
  if (!match) return { category: 'Changed', scope: '', description: message };
  
  const [, type, scope, description] = match;
  const category = CATEGORIES[type] || 'Changed';
  
  return { category, scope, description };
}

// Get commits since last version tag
function getCommitsSinceLastTag() {
  try {
    // Find the latest version tag
    const latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    
    // Get commits since that tag
    const gitLogCmd = `git log ${latestTag}..HEAD --pretty=format:"%h|%an|%ad|%s" --date=iso`;
    const gitLog = execSync(gitLogCmd, { encoding: 'utf8' });
    
    return gitLog.split('\n').filter(Boolean).map(line => {
      const [hash, author, date, message] = line.split('|');
      return { hash, author, date, message, ...parseCommitMessage(message) };
    });
  } catch (error) {
    // If no tags exist, get all commits
    const gitLogCmd = 'git log --pretty=format:"%h|%an|%ad|%s" --date=iso';
    const gitLog = execSync(gitLogCmd, { encoding: 'utf8' });
    
    return gitLog.split('\n').filter(Boolean).map(line => {
      const [hash, author, date, message] = line.split('|');
      return { hash, author, date, message, ...parseCommitMessage(message) };
    });
  }
}

// Group commits by category
function groupCommitsByCategory(commits) {
  const grouped = {};
  
  commits.forEach(commit => {
    if (!grouped[commit.category]) {
      grouped[commit.category] = [];
    }
    
    const entry = `${commit.description}${commit.scope ? ` (${commit.scope})` : ''}`;
    grouped[commit.category].push(entry);
  });
  
  return grouped;
}

// Update changelog file
function updateChangelog(groupedCommits, machineInfo) {
  try {
    const content = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    
    // Find the [Unreleased] section
    const unreleasedMatch = content.match(/## \[Unreleased\]\s+(\s+### \w+\s+(?:-.+\s+)+)*?(\s*##|\s*$)/);
    if (!unreleasedMatch) {
      console.error('Could not find [Unreleased] section in changelog.');
      return false;
    }
    
    // Generate new unreleased section
    let newUnreleased = '## [Unreleased]\n';
    
    // Add machine info line
    const date = new Date().toISOString().split('T')[0];
    newUnreleased += `\n_Updated from ${machineInfo} on ${date}_\n`;
    
    // Add categorized entries
    Object.keys(groupedCommits).forEach(category => {
      newUnreleased += `\n### ${category}\n`;
      
      groupedCommits[category].forEach(entry => {
        newUnreleased += `- ${entry}\n`;
      });
    });
    
    // Replace old unreleased section with new content
    const updatedChangelog = content.replace(
      /## \[Unreleased\][\s\S]+?(?=\s*##|\s*$)/,
      newUnreleased + '\n\n'
    );
    
    fs.writeFileSync(CHANGELOG_PATH, updatedChangelog);
    return true;
  } catch (error) {
    console.error('Error updating changelog:', error);
    return false;
  }
}

// Main function
function generateChangelog() {
  try {
    // Get machine information
    const hostname = execSync('hostname', { encoding: 'utf8' }).trim();
    const branchName = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const machineInfo = `${hostname} (${branchName})`;
    
    // Get commits and update changelog
    const commits = getCommitsSinceLastTag();
    const groupedCommits = groupCommitsByCategory(commits);
    const updated = updateChangelog(groupedCommits, machineInfo);
    
    if (updated) {
      console.log('Changelog updated successfully.');
      return true;
    } else {
      console.error('Failed to update changelog.');
      return false;
    }
  } catch (error) {
    console.error('Error generating changelog:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  generateChangelog();
}

module.exports = { generateChangelog };
