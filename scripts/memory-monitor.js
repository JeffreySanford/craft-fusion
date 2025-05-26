// memory-monitor.js - Node.js terminal dashboard for system stats
const blessed = require('blessed');
const contrib = require('blessed-contrib');
const si = require('systeminformation');

const screen = blessed.screen({ smartCSR: true, title: 'True North Insights: Craft Fusion System Monitor' });
const grid = new contrib.grid({ rows: 12, cols: 12, screen });

// Branding and theme
const BRAND = '{green-fg}True North Insights{/green-fg} {yellow-fg}Legendary Mode{/yellow-fg} - {cyan-fg}Craft Fusion System Monitor{/cyan-fg}';
screen.title = 'True North Insights: Craft Fusion System Monitor';

// Header box for branding
const header = grid.set(0, 0, 1, 12, blessed.box, {
  content: BRAND,
  tags: true,
  style: { fg: 'green', bg: 'black', border: { fg: 'green' } },
  align: 'center',
  valign: 'middle',
  height: 1
});

// Widgets
const memGauge = grid.set(1, 0, 3, 4, contrib.gauge, { label: 'Memory Usage', stroke: 'green', fill: 'white' });
const swapGauge = grid.set(1, 4, 3, 4, contrib.gauge, { label: 'Swap Usage', stroke: 'yellow', fill: 'white' });
const cpuGauge = grid.set(1, 8, 3, 4, contrib.gauge, { label: 'CPU Usage', stroke: 'cyan', fill: 'white' });
const topMemTable = grid.set(4, 0, 4, 6, contrib.table, { label: 'Top Memory Consumers', columnWidth: [10, 8, 8, 40] });
const topCpuTable = grid.set(4, 6, 4, 6, contrib.table, { label: 'Top CPU Consumers', columnWidth: [10, 8, 8, 40] });
const netTable = grid.set(8, 0, 2, 12, contrib.table, { label: 'Network', columnWidth: [16, 12, 12, 12] });
const sysSummary = grid.set(10, 0, 3, 12, blessed.box, { label: 'System Health Summary', tags: true, style: { fg: 'white', border: { fg: 'cyan' } } });

// Move all widgets down by 1 row
memGauge.top = 1;
swapGauge.top = 1;
cpuGauge.top = 1;
topMemTable.top = 4;
topCpuTable.top = 4;
netTable.top = 8;
sysSummary.top = 10;

// Refresh interval state
let refreshInterval = 3000;
let refreshTimer;
let paused = false;

function scheduleUpdate() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => { if (!paused) update(); }, refreshInterval);
}

// Keyboard controls
screen.key(['+', '='], () => {
  refreshInterval = Math.max(1000, refreshInterval - 1000);
  scheduleUpdate();
});
screen.key(['-', '_'], () => {
  refreshInterval = Math.min(30000, refreshInterval + 1000);
  scheduleUpdate();
});
screen.key(['p'], () => {
  paused = !paused;
  sysSummary.setContent(sysSummary.getContent() + `\n{yellow-fg}${paused ? 'Paused' : 'Resumed'}{/yellow-fg}`);
  screen.render();
});
screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

// Instructions
const instructions = blessed.box({
  parent: screen,
  top: 1,
  left: 'center',
  width: '100%',
  height: 1,
  content: '{green-fg}Press +/- to change refresh rate, p to pause/resume, q to quit{/green-fg}',
  tags: true,
  style: { fg: 'green', bg: 'black' }
});

async function update() {
  const [mem, swap, cpu, processes, net, load] = await Promise.all([
    si.mem(),
    si.memSwap(),
    si.currentLoad(),
    si.processes(),
    si.networkStats(),
    si.currentLoad()
  ]);

  // Memory
  const memPct = Math.round((mem.active / mem.total) * 100);
  memGauge.setData([memPct]);
  swapGauge.setData([Math.round((swap.used / (swap.total || 1)) * 100)]);

  // CPU
  cpuGauge.setData([Math.round(cpu.currentload)]);

  // Top Memory
  const topMem = processes.list
    .sort((a, b) => b.mem - a.mem)
    .slice(0, 5)
    .map(p => [p.user, p.pid, `${p.mem.toFixed(1)}%`, p.command]);
  topMemTable.setData({ headers: ['User', 'PID', 'Mem%', 'Command'], data: topMem });

  // Top CPU
  const topCpu = processes.list
    .sort((a, b) => b.pcpu - a.pcpu)
    .slice(0, 5)
    .map(p => [p.user, p.pid, `${p.pcpu.toFixed(1)}%`, p.command]);
  topCpuTable.setData({ headers: ['User', 'PID', 'CPU%', 'Command'], data: topCpu });

  // Network
  netTable.setData({
    headers: ['Interface', 'RX MB', 'TX MB', 'RX/s KB'],
    data: net.map(n => [n.iface, (n.rx_bytes/1e6).toFixed(2), (n.tx_bytes/1e6).toFixed(2), (n.rx_sec/1024).toFixed(2)])
  });

  // System Health Summary
  let memStatus = memPct > 90 ? '{red-fg}HIGH PRESSURE{/red-fg}' : memPct > 75 ? '{yellow-fg}TIGHT{/yellow-fg}' : '{green-fg}OK{/green-fg}';
  let swapStatus = swap.used > 0 ? '{yellow-fg}IN USE{/yellow-fg}' : '{green-fg}OK{/green-fg}';
  let cpuStatus = cpu.currentload > 90 ? '{red-fg}HIGH{/red-fg}' : cpu.currentload > 75 ? '{yellow-fg}BUSY{/yellow-fg}' : '{green-fg}OK{/green-fg}';
  let loadAvg = load.avgload.toFixed(2);
  sysSummary.setContent(
    `{green-fg}${BRAND}{/green-fg}\n` +
    `Memory: ${memStatus} (${memPct}% used)  |  Swap: ${swapStatus}  |  CPU: ${cpuStatus} (${cpu.currentload.toFixed(1)}%)\n` +
    `Load Avg: ${loadAvg}  |  Free: ${(mem.free/1e6).toFixed(2)} GB  |  Avail: ${(mem.available/1e6).toFixed(2)} GB\n` +
    `Network: ${net.map(n => `${n.iface}: ↓${(n.rx_sec/1024).toFixed(1)}KB/s ↑${(n.tx_sec/1024).toFixed(1)}KB/s`).join('  ')}\n` +
    `{green-fg}Refresh: ${refreshInterval/1000}s | +/- to change | p to pause | q to quit{/green-fg}`
  );
  screen.render();
}

scheduleUpdate();
update();
