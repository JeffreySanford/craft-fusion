const { execSync } = require('child_process');

const ports = [3000, 4000, 4200];
const isWindows = process.platform === 'win32';

ports.forEach(port => {
  try {
    let pid;
    if (isWindows) {
      const stdout = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`).toString();
      const lines = stdout.split('\n').filter(l => l.trim());
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          console.log(`Killing process ${pid} on port ${port}`);
          try {
            execSync(`taskkill /F /PID ${pid}`);
          } catch (err) {
            // Might already be dead
          }
        }
      });
    } else {
      try {
        execSync(`lsof -t -i:${port} | xargs kill -9`);
        console.log(`Killed process on port ${port}`);
      } catch (err) {
        // No process or permission issue
      }
    }
  } catch (e) {
    // No process listening on this port
  }
});
