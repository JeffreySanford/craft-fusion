// memory-monitor.js - Node.js terminal dashboard for system stats
const blessed = require('blessed');
const contrib = require('blessed-contrib');
const si = require('systeminformation');

const screen = blessed.screen({ smartCSR: true, title: 'True North Insights: Craft Fusion System Monitor' });
const grid = new contrib.grid({ rows: 12, cols: 12, screen });

// Widgets
const memGauge = grid.set(0, 0, 3, 4, contrib.gauge, { label: 'Memory Usage', stroke: 'green', fill: 'white' });
const swapGauge = grid.set(0, 4, 3, 4, contrib.gauge, { label: 'Swap Usage', stroke: 'yellow', fill: 'white' });
const cpuGauge = grid.set(0, 8, 3, 4, contrib.gauge, { label: 'CPU Usage', stroke: 'cyan', fill: 'white' });
const topMemTable = grid.set(3, 0, 4, 6, contrib.table, { label: 'Top Memory Consumers', columnWidth: [10, 8, 8, 40] });
const topCpuTable = grid.set(3, 6, 4, 6, contrib.table, { label: 'Top CPU Consumers', columnWidth: [10, 8, 8, 40] });
const netTable = grid.set(7, 0, 2, 12, contrib.table, { label: 'Network', columnWidth: [16, 12, 12, 12] });
const sysSummary = grid.set(9, 0, 3, 12, blessed.box, { label: 'System Health Summary', tags: true, style: { fg: 'white', border: { fg: 'cyan' } } });

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
    `Memory: ${memStatus} (${memPct}% used)  |  Swap: ${swapStatus}  |  CPU: ${cpuStatus} (${cpu.currentload.toFixed(1)}%)\n` +
    `Load Avg: ${loadAvg}  |  Free: ${(mem.free/1e6).toFixed(2)} GB  |  Avail: ${(mem.available/1e6).toFixed(2)} GB\n` +
    `Network: ${net.map(n => `${n.iface}: ↓${(n.rx_sec/1024).toFixed(1)}KB/s ↑${(n.tx_sec/1024).toFixed(1)}KB/s`).join('  ')}\n` +
    `{cyan-fg}Press Q or Ctrl+C to exit{/cyan-fg}`
  );

  screen.render();
}

setInterval(update, 2000);
screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

update();
