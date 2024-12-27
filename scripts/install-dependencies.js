const { exec } = require('child_process');
const chalk = require('chalk');
const npmlog = require('npmlog');
const progress = require('./install-progress');

async function runCommand(command, message) {
    return new Promise((resolve, reject) => {
        const process = exec(command, (error, stdout, stderr) => {
            if (error) {
                progress.spinner.fail(chalk.red(`Failed: ${message}`));
                npmlog.error('Error', stderr);
                reject(error);
            } else {
                progress.spinner.succeed(chalk.green(`Completed: ${message}`));
                npmlog.info('Output', stdout);
                resolve(stdout);
            }
        });

        process.stdout.on('data', (data) => {
            npmlog.info('Output', data.toString());
        });

        process.stderr.on('data', (data) => {
            npmlog.error('Error', data.toString());
        });
    });
}

async function installDependencies() {
    await progress.init();
    try {
        await runCommand('npm install', 'Installing dependencies');
        progress.spinner.succeed(chalk.green('All dependencies installed successfully!'));
    } catch (error) {
        progress.spinner.fail(chalk.red('Installation failed.'));
        process.exit(1);
    }
}

installDependencies();
