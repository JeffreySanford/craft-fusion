const chalk = require('chalk');
const npmlog = require('npmlog');
const cliProgress = require('cli-progress');

class InstallProgress {
    constructor() {
        this.totalSteps = 0;
        this.currentStep = 0;
        this.spinner = null;
        this.progressBar = new cliProgress.SingleBar({
            format: 'Progress |' + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total} Steps || ' + chalk.yellow('CPU: {cpu}%') + ' ' + chalk.green('Free Mem: {freeMem}GB') + ' ' + chalk.red('Used Mem: {usedMem}GB'),
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });
    }

    async init() {
        const ora = await import('ora');
        this.spinner = ora.default();
    }

    startPhase(name, total) {
        this.totalSteps = total;
        this.currentStep = 0;
        console.log(chalk.bgMagenta.black.bold(`\n🌈🚀 Starting ${name}...\n`));
        this.progressBar.start(total, 0, {
            cpu: 'N/A',
            freeMem: 'N/A',
            usedMem: 'N/A'
        });
    }

    updateProgress(step, message) {
        this.currentStep = step;
        const percent = Math.round((step / this.totalSteps) * 100);
        const progressBar = this.getProgressBar(percent);
        
        this.spinner.text = chalk.yellow(`${progressBar} ${percent}% | ${message}`);
        this.spinner.start();
        this.progressBar.update(step);
    }

    complete(message) {
        this.spinner.succeed(chalk.green.bold(message));
        this.progressBar.update(this.totalSteps);
        this.progressBar.stop();
    }

    error(message) {
        this.spinner.fail(chalk.red.bold(message));
        this.progressBar.stop();
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
