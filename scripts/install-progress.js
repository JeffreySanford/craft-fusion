const chalk = require('chalk');
const ora = require('ora');
const npmlog = require('npmlog');

class InstallProgress {
    constructor() {
        this.totalSteps = 0;
        this.currentStep = 0;
        this.spinner = ora();
    }

    startPhase(name, total) {
        this.totalSteps = total;
        this.currentStep = 0;
        console.log(chalk.bgMagenta.black.bold(`\n🌈🚀 Starting ${name}...\n`));
    }

    updateProgress(step, message) {
        this.currentStep = step;
        const percent = Math.round((step / this.totalSteps) * 100);
        const progressBar = this.getProgressBar(percent);
        
        this.spinner.text = chalk.yellow(`${progressBar} ${percent}% | ${message}`);
        this.spinner.start();
    }

    complete(message) {
        this.spinner.succeed(chalk.green.bold(message));
    }

    error(message) {
        this.spinner.fail(chalk.red.bold(message));
    }

    getProgressBar(percent) {
        const width = 30;
        const complete = Math.round((width * percent) / 100);
        const incomplete = width - complete;
        return chalk.green('█'.repeat(complete)) + chalk.gray('░'.repeat(incomplete));
    }

    trackNpmInstall() {
        npmlog.on('log', (log) => {
            if (log.prefix === 'install') {
                this.updateProgress(this.currentStep + 1, log.message);
            }
        });
    }

    logStep(step, message) {
        console.log(chalk.blue.bold(`Step ${step}: ${message}`));
    }

    logSuccess(message) {
        console.log(chalk.green.bold(`\n✨ ${message}\n`));
    }

    logError(message) {
        console.error(chalk.red.bold(`\n❌ ${message}\n`));
    }
}

module.exports = new InstallProgress();
