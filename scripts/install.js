const { exec } = require('child_process');
const chalk = require('chalk');
const npmlog = require('npmlog');
const progress = require('./progress');

const spinner = progress.spinner;

function runCommand(command, message) {
    return new Promise((resolve, reject) => {
        const process = exec(command, (error, stdout, stderr) => {
            if (error) {
                spinner.fail(chalk.red(`Failed: ${message}`));
                npmlog.error('Error', stderr);
                reject(error);
            } else {
                spinner.succeed(chalk.green(`Completed: ${message}`));
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
    try {
        await runCommand('npm install', 'Installing dependencies');
        spinner.succeed(chalk.green('All dependencies installed successfully!'));
    } catch (error) {
        spinner.fail(chalk.red('Installation failed.'));
        process.exit(1);
    }
}

installDependencies();
