#!/bin/bash
# system-analyze-and-tune.sh
# Collects system metrics and applies Fedora/DigitalOcean/Nx/Node/Go tuning recommendations

set -e

LOG=system-analysis-$(date +%Y%m%d-%H%M%S).log

# 1. Collect System Metrics
echo "==== System Info ====" | tee $LOG
uname -a | tee -a $LOG
cat /etc/os-release | tee -a $LOG
echo | tee -a $LOG

echo "==== CPU Info ====" | tee -a $LOG
lscpu | tee -a $LOG
echo | tee -a $LOG

echo "==== Memory Info ====" | tee -a $LOG
free -h | tee -a $LOG
echo | tee -a $LOG
echo "==== Swap Status ====" | tee -a $LOG
swapon --show | tee -a $LOG
echo | tee -a $LOG

echo "==== Disk Usage ====" | tee -a $LOG
df -hT | tee -a $LOG
echo | tee -a $LOG

echo "==== Top Processes ====" | tee -a $LOG
ps aux --sort=-%mem | head -n 10 | tee -a $LOG
echo | tee -a $LOG

echo "==== Uptime & Load ====" | tee -a $LOG
uptime | tee -a $LOG
echo | tee -a $LOG

echo "==== Open File Limits ====" | tee -a $LOG
ulimit -a | tee -a $LOG
echo | tee -a $LOG

echo "==== Network Interfaces ====" | tee -a $LOG
ip addr | tee -a $LOG
echo | tee -a $LOG

echo "==== Node.js Version ====" | tee -a $LOG
node -v 2>/dev/null | tee -a $LOG || echo "Node.js not installed" | tee -a $LOG
echo | tee -a $LOG

echo "==== Go Version ====" | tee -a $LOG
go version 2>/dev/null | tee -a $LOG || echo "Go not installed" | tee -a $LOG
echo | tee -a $LOG

echo "==== NPM Version ====" | tee -a $LOG
npm -v 2>/dev/null | tee -a $LOG || echo "npm not installed" | tee -a $LOG
echo | tee -a $LOG

echo "==== PM2 Status ====" | tee -a $LOG
pm2 ls 2>/dev/null | tee -a $LOG || echo "pm2 not installed" | tee -a $LOG
echo | tee -a $LOG

echo "==== Nginx Status ====" | tee -a $LOG
systemctl status nginx 2>/dev/null | head -20 | tee -a $LOG || echo "nginx not installed" | tee -a $LOG
echo | tee -a $LOG

echo "==== Recent System Logs (last 50 lines) ====" | tee -a $LOG
journalctl -xe --no-pager | tail -50 | tee -a $LOG
echo | tee -a $LOG

# 2. Remediation & Tuning

echo "==== Applying Fedora/DigitalOcean/Nx/Node/Go Tuning ====" | tee -a $LOG

# a. Increase open file/process limits (requires root for permanent)
echo '* soft nofile 65535' | sudo tee -a /etc/security/limits.conf
echo '* hard nofile 65535' | sudo tee -a /etc/security/limits.conf
echo '* soft nproc 65535' | sudo tee -a /etc/security/limits.conf
echo '* hard nproc 65535' | sudo tee -a /etc/security/limits.conf

# b. Set CPU governor to performance (if available)
if command -v cpupower >/dev/null 2>&1; then
  sudo cpupower frequency-set -g performance | tee -a $LOG
else
  echo "cpupower not installed, skipping CPU governor tuning" | tee -a $LOG
fi

# c. Enable dnf fastestmirror plugin
sudo dnf install -y dnf-plugins-core | tee -a $LOG
sudo dnf config-manager --set-enabled fastestmirror | tee -a $LOG

# d. Add recommended sysctl network tuning
sudo tee -a /etc/sysctl.conf <<EOF
net.core.somaxconn = 1024
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.ip_local_port_range = 1024 65000
EOF
sudo sysctl -p | tee -a $LOG

echo "==== Tuning Complete. Please reboot for all changes to take effect. ====" | tee -a $LOG

echo "==== Done. See $LOG for details. ===="
