#!/bin/bash
# fedramp-monitor.sh - FedRAMP 20x Rev 5 Security Controls Monitoring Script
# Scans key controls every minute and logs results to fedramp-monitor.log

LOG_FILE="$(dirname "$0")/../logs/fedramp-monitor.log"
mkdir -p "$(dirname "$LOG_FILE")"

scan_once() {
    echo "==== FedRAMP Security Scan: $(date) ===="
    # 1. Unauthorized users (UID 0 other than root)
    echo "[AC-2] Checking for unauthorized UID 0 accounts..."
    awk -F: '($3 == 0 && $1 != "root") {print $1}' /etc/passwd | while read user; do
        echo "  [!] Unauthorized UID 0 user: $user"
    done

    # 2. World-writable files
    echo "[CM-7] Checking for world-writable files..."
    find / -xdev -type f -perm -0002 2>/dev/null | head -n 10 | while read file; do
        echo "  [!] World-writable file: $file"
    done

    # 3. Suspicious processes (running as root, not in allowlist)
    echo "[SI-4] Checking for suspicious root processes..."
    ps -U root -u root u | grep -vE "(sshd|systemd|bash|ps|grep|init|kthreadd|kworker|dbus|cron|rsyslog|nginx|pm2|node|go)" | awk 'NR>1 {print "  [!] Suspicious root process: "$11}'

    # 4. Open ports/services
    echo "[CM-7] Listing open ports/services..."
    ss -tuln | grep -vE "127.0.0.1|::1|127.0.1.1" | awk 'NR>1 {print "  [*] Open: "$5}'

    # 5. Failed logins
    echo "[AU-2] Checking for failed logins..."
    lastb -n 5 2>/dev/null | awk 'NR>1 {print "  [!] Failed login: "$1, $3, $4, $5, $6, $7}'

    # 6. System file integrity (basic check)
    echo "[SI-7] Checking for modified system binaries..."
    for bin in /bin/ls /bin/bash /usr/bin/ssh /usr/bin/sudo; do
        if [ -f "$bin" ]; then
            md5sum "$bin"
        fi
    done

    # 7. Critical system updates
    echo "[SI-2] Checking for critical updates..."
    if command -v dnf &>/dev/null; then
        dnf check-update --security | grep -E "Important|Critical" || echo "  [*] No critical updates found."
    elif command -v yum &>/dev/null; then
        yum check-update --security | grep -E "Important|Critical" || echo "  [*] No critical updates found."
    else
        echo "  [*] Package manager not found."
    fi

    # 8. SELinux/AppArmor status
    echo "[AC-3] Checking SELinux/AppArmor status..."
    if command -v getenforce &>/dev/null; then
        echo "  SELinux: $(getenforce)"
    elif command -v aa-status &>/dev/null; then
        aa-status
    else
        echo "  [*] SELinux/AppArmor not found."
    fi

    # 9. SSH config best practices
    echo "[SC-7] Checking SSH config..."
    if [ -f /etc/ssh/sshd_config ]; then
        grep -E 'PermitRootLogin|PasswordAuthentication' /etc/ssh/sshd_config
    fi
    echo
}

while true; do
    scan_once | tee -a "$LOG_FILE"
    sleep 60
done
