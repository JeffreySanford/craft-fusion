const { rimraf } = require('rimraf');
const progress = require('./install-progress');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

async function cleanProject() {
    progress.startPhase('Project Cleanup', 5);

    try {
        // Notify NX Cloud about the cleanup
        progress.updateProgress(1, 'Notifying NX Cloud...');
        execSync('npx nx-cloud start-ci-run --distribute-on="5 linux-medium-js"');
        progress.complete('NX Cloud notified');

        // Clean cache
        progress.updateProgress(2, 'Clearing NX cache...');
        await exec('nx reset');
        progress.complete('NX cache cleared');

        // Clean build files
        progress.updateProgress(3, 'Removing build artifacts...');
        const buildPaths = [path.resolve('dist'), path.resolve('tmp')];
        progress.logStep(3, `Removing build artifacts from: ${buildPaths.join(', ')}`);
        await rimraf(buildPaths);
        progress.complete('Build artifacts removed');

        // Clean dependencies
        progress.updateProgress(4, 'Removing dependencies...');
        const depPaths = [path.resolve('node_modules'), path.resolve('package-lock.json')];
        progress.logStep(4, `Removing dependencies from: ${depPaths.join(', ')}`);
        await rimraf(depPaths);
        progress.complete('Dependencies removed');

        // Reinstall dependencies
        progress.updateProgress(5, 'Reinstalling dependencies...');
        progress.trackNpmInstall();
        await exec('npm install');
        progress.complete('Dependencies reinstalled');

        progress.logSuccess('Cleanup completed successfully!');
    } catch (error) {
        progress.error(`Cleanup failed: ${error.message}`);
        progress.logError(`Error details: ${error.stack}`);
        process.exit(1);
    }
}

function exec(cmd) {
    return new Promise((resolve, reject) => {
        require('child_process').exec(cmd, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve(stdout);
        });
    });
}

module.exports = cleanProject;

if (require.main === module) {
    cleanProject();
}
