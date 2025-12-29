const { rimraf } = require('rimraf');
const progress = require('./install-progress');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const os = require('os');
const checkDiskSpace = require('check-disk-space');
const npmlog = require('npmlog');
const osUtils = require('os-utils');
const speedTest = require('speedtest-net');
const cliProgress = require('cli-progress');

let peakCpuUsage = 0;
let peakMemoryUsage = 0;
let networkPerformance = {};
const progressBar = new cliProgress.SingleBar({
    format: 'Progress |' + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total} Steps || ' + chalk.yellow('CPU: {cpu}%') + ' ' + chalk.green('Free Mem: {freeMem}GB') + ' ' + chalk.red('Used Mem: {usedMem}GB'),
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
});

async function cleanProject() {
    const startTime = Date.now();
    logSystemInfo();
    monitorSystemUsage();
    monitorNetworkPerformance();
    progress.startPhase('Project Cleanup', 6);
    progressBar.start(6, 0, {
        cpu: 'N/A',
        freeMem: 'N/A',
        usedMem: 'N/A'
    });

    try {
        // Notify NX Cloud about the cleanup
        progress.updateProgress(1, 'Notifying NX Cloud...');
        execSync('npx nx-cloud start-ci-run --distribute-on="5 linux-medium-js"');
        progress.complete('NX Cloud notified');
        progressBar.update(1);

        // Clean cache
        progress.updateProgress(2, 'Clearing NX cache...');
        await exec('nx reset');
        progress.complete('NX cache cleared');
        progressBar.update(2);

        // Clean build files
        progress.updateProgress(3, 'Removing build artifacts...');
        const buildPaths = [path.resolve('dist'), path.resolve('tmp')];
        progress.logStep(3, `Removing build artifacts from: ${buildPaths.join(', ')}`);
        await rimrafPromise(buildPaths);
        progress.complete('Build artifacts removed');
        progressBar.update(3);

        // Clean dependencies
        progress.updateProgress(4, 'Removing dependencies...');
        const depPaths = [path.resolve('node_modules'), path.resolve('package-lock.json')];
        progress.logStep(4, `Removing dependencies from: ${depPaths.join(', ')}`);
        await rimrafPromise(depPaths);
        progress.complete('Dependencies removed');
        progressBar.update(4);

        // Reinstall dependencies
        progress.updateProgress(5, 'Reinstalling dependencies...');
        progress.trackNpmInstall();
        await exec('npm install');
        progress.complete('Dependencies reinstalled');
        progressBar.update(5);

        // Clean TypeScript build info files
        progress.updateProgress(6, 'Removing TypeScript build info files...');
        await exec('find-exec "*.tsbuildinfo" -type f -delete || rimraf **/*.tsbuildinfo');
        progress.complete('TypeScript build info files removed');
        progressBar.update(6);

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        progress.logSuccess(`Cleanup completed successfully in ${duration} seconds!`);
        await logFinalSystemInfo();
    } catch (error) {
        progress.error(`Cleanup failed: ${error.message}`);
        progress.logError(`Error details: ${error.stack}`);
        process.exit(1);
    } finally {
        progressBar.stop();
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

function rimrafPromise(paths) {
    return new Promise((resolve, reject) => {
        rimraf(paths, { glob: false }, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

function logSystemInfo() {
    const userInfo = os.userInfo();
    const cpus = os.cpus();
    const totalMemory = (os.totalmem() / (1024 ** 3)).toFixed(2);
    const freeMemory = (os.freemem() / (1024 ** 3)).toFixed(2);
    const networkInterfaces = os.networkInterfaces();

    npmlog.info('System Info', `User: ${userInfo.username}`);
    npmlog.info('System Info', `Home Directory: ${userInfo.homedir}`);
    npmlog.info('System Info', `Processor: ${cpus[0].model}`);
    npmlog.info('System Info', `Cores: ${cpus.length}`);
    npmlog.info('System Info', `Total Memory: ${totalMemory} GB`);
    npmlog.info('System Info', `Free Memory: ${freeMemory} GB`);

    Object.keys(networkInterfaces).forEach((iface) => {
        networkInterfaces[iface].forEach((details) => {
            if (details.family === 'IPv4') {
                npmlog.info('Network Info', `Interface: ${iface}, Address: ${details.address}`);
            }
        });
    });

    const rootPath = os.platform() === 'win32' ? 'C:\\' : '/';
    checkDiskSpace(rootPath).then((diskSpace) => {
        npmlog.info('Disk Info', `Disk Space: ${(diskSpace.size / (1024 ** 3)).toFixed(2)} GB`);
        npmlog.info('Disk Info', `Free Disk Space: ${(diskSpace.free / (1024 ** 3)).toFixed(2)} GB`);
    });
}

function monitorSystemUsage() {
    setInterval(() => {
        osUtils.cpuUsage((v) => {
            const cpuUsage = (v * 100).toFixed(2);
            peakCpuUsage = Math.max(peakCpuUsage, cpuUsage);
            const freeMemory = (osUtils.freemem() / 1024).toFixed(2);
            const usedMemory = ((osUtils.totalmem() - osUtils.freemem()) / 1024).toFixed(2);
            peakMemoryUsage = Math.max(peakMemoryUsage, usedMemory);
            progressBar.update(progressBar.value, {
                cpu: cpuUsage,
                freeMem: freeMemory,
                usedMem: usedMemory
            });
        });
    }, 5000);
}

function monitorNetworkPerformance() {
    speedTest({ maxTime: 5000 }).then((result) => {
        networkPerformance = {
            downloadSpeed: (result.download.bandwidth / 125000).toFixed(2), // Convert from bps to Mbps
            uploadSpeed: (result.upload.bandwidth / 125000).toFixed(2), // Convert from bps to Mbps
            latency: result.ping.latency.toFixed(2),
        };
        console.log(chalk.cyan(`Download Speed (Mbps): ${networkPerformance.downloadSpeed}`));
        console.log(chalk.cyan(`Upload Speed (Mbps): ${networkPerformance.uploadSpeed}`));
        console.log(chalk.cyan(`Latency (ms): ${networkPerformance.latency}`));
    }).catch((error) => {
        console.error(chalk.red(`Network performance monitoring failed: ${error.message}`));
    });
}

async function logFinalSystemInfo() {
    const cpus = os.cpus();
    const totalMemory = (os.totalmem() / (1024 ** 3)).toFixed(2);
    const freeMemory = (os.freemem() / (1024 ** 3)).toFixed(2);
    const usedMemory = (totalMemory - freeMemory).toFixed(2);

    console.log(chalk.blue.bold('\nFinal System Information:'));
    console.log(chalk.blue(`Processor: ${cpus[0].model}`));
    console.log(chalk.blue(`Cores: ${cpus.length}`));
    console.log(chalk.blue(`Total Memory: ${totalMemory} GB`));
    console.log(chalk.blue(`Used Memory: ${usedMemory} GB`));
    console.log(chalk.blue(`Free Memory: ${freeMemory} GB`));
    console.log(chalk.blue(`Peak CPU Usage (%): ${peakCpuUsage}`));
    console.log(chalk.blue(`Peak Memory Usage (GB): ${peakMemoryUsage}`));
    console.log(chalk.blue(`Download Speed (Mbps): ${networkPerformance.downloadSpeed}`));
    console.log(chalk.blue(`Upload Speed (Mbps): ${networkPerformance.uploadSpeed}`));
    console.log(chalk.blue(`Latency (ms): ${networkPerformance.latency}`));

    const rootPath = os.platform() === 'win32' ? 'C:\\' : '/';
    const diskSpace = await checkDiskSpace(rootPath);
    const usedDiskSpace = ((diskSpace.size - diskSpace.free) / (1024 ** 3)).toFixed(2);

    console.log(chalk.blue(`Disk Space: ${(diskSpace.size / (1024 ** 3)).toFixed(2)} GB`));
    console.log(chalk.blue(`Used Disk Space: ${usedDiskSpace} GB`));
    console.log(chalk.blue(`Free Disk Space: ${(diskSpace.free / (1024 ** 3)).toFixed(2)} GB`));
}

module.exports = cleanProject;

if (require.main === module) {
    cleanProject();
}
