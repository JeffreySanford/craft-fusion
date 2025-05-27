#!/bin/bash
# memory-monitor.sh - TRUE NORTH INSIGHTS: Craft Fusion System Monitor

BOLD='\033[1m'
NC='\033[0m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'

clear
printf "${BOLD}${CYAN}\n╔══════════════════════════════════════════════════════════════════════════════╗\n"
printf "║        🖥️  TRUE NORTH INSIGHTS: CRAFT FUSION SYSTEM MONITOR v2.1         ║\n"
printf "║                by True North Insights  |  LIVE UPDATING                   ║\n"
printf "╚══════════════════════════════════════════════════════════════════════════════╝${NC}\n"

# --- System Prep: Clean up lingering processes and free memory ---
source "$(dirname "$0")/system-prep.sh"

# Network monitoring variables
LAST_RX_BYTES=0
LAST_TX_BYTES=0
LAST_CHECK_TIME=0

# Progress bar
PROGRESS_CHAR="█"
EMPTY_CHAR="░"

# Network functions
get_network_interface() {
    # Get the main network interface (usually eth0, ens3, or similar for VPS)
    ip route | grep default | awk '{print $5}' | head -1
}

get_network_stats() {
    local interface=$1
    if [ -f "/sys/class/net/$interface/statistics/rx_bytes" ]; then
        local rx_bytes=$(cat /sys/class/net/$interface/statistics/rx_bytes)
        local tx_bytes=$(cat /sys/class/net/$interface/statistics/tx_bytes)
        echo "$rx_bytes $tx_bytes"
    else
        echo "0 0"
    fi
}

format_bytes() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes}B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$((bytes/1024))KB"
    elif [ $bytes -lt 1073741824 ]; then
        echo "$((bytes/1048576))MB"
    else
        echo "$((bytes/1073741824))GB"
    fi
}

check_network_connectivity() {
    # Check multiple endpoints for reliability
    local endpoints=("8.8.8.8" "1.1.1.1" "github.com")
    local success=0
    local latency_sum=0
    
    for endpoint in "${endpoints[@]}"; do
        if ping -c 1 -W 2 "$endpoint" >/dev/null 2>&1; then
            local latency=$(ping -c 1 -W 2 "$endpoint" 2>/dev/null | grep 'time=' | sed 's/.*time=\([0-9.]*\).*/\1/')
            if [ -n "$latency" ]; then
                latency_sum=$(echo "$latency_sum + $latency" | bc 2>/dev/null || echo "$latency_sum")
                success=$((success + 1))
            fi
        fi
    done
    
    echo "$success $latency_sum"
}

check_deployment_endpoints() {
    local endpoints=("localhost:3000" "localhost:4000")
    local api_status=""
    
    for endpoint in "${endpoints[@]}"; do
        if curl -s --max-time 2 "http://$endpoint/health" >/dev/null 2>&1 || \
           curl -s --max-time 2 "http://$endpoint" >/dev/null 2>&1; then
            if [[ "$endpoint" == *":3000"* ]]; then
                api_status="${api_status}${GREEN}NestJS✓${NC} "
            else
                api_status="${api_status}${GREEN}Go✓${NC} "
            fi
        else
            if [[ "$endpoint" == *":3000"* ]]; then
                api_status="${api_status}${RED}NestJS✗${NC} "
            else
                api_status="${api_status}${RED}Go✗${NC} "
            fi
        fi
    done
    
    echo "$api_status"
}

print_memory_bar() {
    local used=$1
    local total=$2
    local percent=$((used * 100 / total))
    local filled=$((used * 30 / total))
    local empty=$((30 - filled))
    
    if [ $percent -lt 60 ]; then
        color=$GREEN
    elif [ $percent -lt 80 ]; then
        color=$YELLOW
    else
        color=$RED
    fi
    
    printf "${color}"
    for ((i=0; i<filled; i++)); do printf "${PROGRESS_CHAR}"; done
    printf "${NC}${YELLOW}"
    for ((i=0; i<empty; i++)); do printf "${EMPTY_CHAR}"; done
    printf "${NC} ${BOLD}%d%%${NC}" "$percent"
}

print_cpu_bar() {
    local percent=$1
    local filled=$((percent * 30 / 100))
    local empty=$((30 - filled))
    
    if [ $percent -lt 50 ]; then
        color=$GREEN
    elif [ $percent -lt 80 ]; then
        color=$YELLOW
    else
        color=$RED
    fi
    
    printf "${color}"
    for ((i=0; i<filled; i++)); do printf "${PROGRESS_CHAR}"; done
    printf "${NC}${BLUE}"
    for ((i=0; i<empty; i++)); do printf "${EMPTY_CHAR}"; done
    printf "${NC} ${BOLD}%d%%${NC}" "$percent"
}

print_disk_bar() {
    local used=$1
    local total=$2
    local percent=$((used * 100 / total))
    local filled=$((percent * 30 / 100))
    local empty=$((30 - filled))
    
    if [ $percent -lt 70 ]; then
        color=$GREEN
    elif [ $percent -lt 90 ]; then
        color=$YELLOW
    else
        color=$RED
    fi
    
    printf "${color}"
    for ((i=0; i<filled; i++)); do printf "${PROGRESS_CHAR}"; done
    printf "${NC}${PURPLE}"
    for ((i=0; i<empty; i++)); do printf "${EMPTY_CHAR}"; done
    printf "${NC} ${BOLD}%d%%${NC}" "$percent"
}

print_network_bar() {
    local speed=$1
    local max_speed=$2
    local percent=0
    
    if [ $max_speed -gt 0 ]; then
        percent=$((speed * 100 / max_speed))
        if [ $percent -gt 100 ]; then
            percent=100
        fi
    fi
    
    local filled=$((percent * 30 / 100))
    local empty=$((30 - filled))
    
    if [ $percent -lt 30 ]; then
        color=$WHITE
    elif [ $percent -lt 70 ]; then
        color=$CYAN
    else
        color=$GREEN
    fi
    
    printf "${color}"
    for ((i=0; i<filled; i++)); do printf "${PROGRESS_CHAR}"; done
    printf "${NC}${WHITE}"
    for ((i=0; i<empty; i++)); do printf "${EMPTY_CHAR}"; done
    printf "${NC} ${BOLD}%d%%${NC}" "$percent"
}

# Cursor control functions
hide_cursor() {
    printf "\033[?25l"
}

show_cursor() {
    printf "\033[?25h"
}

move_cursor_home() {
    printf "\033[H"
}

clear_to_end() {
    printf "\033[J"
}

# Initialize screen once
init_screen() {
    clear
    hide_cursor
    START_TIME=$(date +%s)
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║              🖥️  SYSTEM MONITOR v2.1                        ║${NC}"
    echo -e "${BOLD}${CYAN}║                   LIVE UPDATING                             ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# Server status function
check_server_status() {
    local name=$1
    local port=$2
    local process_pattern=$3
    local status=""
    local color=""
    local health_url="http://localhost:$port/health"
    local pid=$(pgrep -f "$process_pattern" | head -1)
    local health_resp=""
    
    if [ -n "$pid" ]; then
        # Process is running, check health endpoint
        health_resp=$(curl -s --max-time 2 "$health_url")
        if [ $? -eq 0 ] && [ -n "$health_resp" ]; then
            status="UP"
            color=$GREEN
        else
            # Process running but health endpoint not responding
            status="RESTARTING"
            color=$YELLOW
        fi
    else
        # Process not running
        status="DOWN"
        color=$RED
    fi
    printf "   %s: %b%s%b\n" "$name" "$color" "$status" "$NC"
}

# OSCAL/SCAP scan check (FedRAMP compliance)
OSCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)/oscal-analysis"
OSCAL_PROFILES=("standard" "ospp" "pci-dss" "cusp" "medium-high" "rev5" "truenorth") # Added truenorth profile
OSCAL_MAX_AGE_DAYS=7

# Vibrant OSCAL scan status header
CPU_CORES=$(nproc 2>/dev/null || echo 1)
MEM_TOTAL_MB=$(free -m 2>/dev/null | awk '/^Mem:/ {print $2}' || echo 2000)
DISK_AVAIL=$(df -h / | awk 'NR==2{print $4}')
BOLD="\033[1m"; CYAN="\033[0;36m"; NC="\033[0m"; WHITE="\033[1;37m"; GREEN="\033[0;32m"; YELLOW="\033[1;33m"; RED="\033[0;31m"; MAGENTA="\033[0;35m"; BLUE="\033[0;34m"

printf "${BOLD}${CYAN}\n╔══════════════════════════════════════════════════════════════╗\n"
printf "║        🛡️  OSCAL/FedRAMP Compliance Scan Status      ║\n"
printf "╚══════════════════════════════════════════════════════════════╝${NC}\n"
echo -e "${BLUE}CPU Cores:   ${GREEN}$CPU_CORES${NC}   ${BLUE}Memory: ${GREEN}${MEM_TOTAL_MB}MB${NC}   ${BLUE}Disk Free: ${GREEN}${DISK_AVAIL}${NC}"
echo

# Show available OSCAL scan profiles
printf "${BOLD}${CYAN}Monitored OSCAL scan profiles:${NC} ${YELLOW}%s${NC}\n" "${OSCAL_PROFILES[*]}"

# Show status for each profile
missing_profiles=()
for profile in "${OSCAL_PROFILES[@]}"; do
  OSCAL_RESULT_FILE="$OSCAL_DIR/oscap-results-$profile.xml"
  OSCAL_REPORT_FILE="$OSCAL_DIR/oscap-report-$profile.html"
  USER_RESULT_FILE="$OSCAL_DIR/user-readable-results-$profile.xml"
  USER_REPORT_FILE="$OSCAL_DIR/user-readable-report-$profile.html"
  # Check for user-readable files first, then admin files
  if [ -f "$USER_RESULT_FILE" ]; then
    OSCAL_RESULT_FILE="$USER_RESULT_FILE"
    OSCAL_REPORT_FILE="$USER_REPORT_FILE"
  elif [ "$profile" = "standard" ]; then
    # Also check for legacy report names for standard
    if [ -f "$OSCAL_DIR/user-readable-results.xml" ]; then
      OSCAL_RESULT_FILE="$OSCAL_DIR/user-readable-results.xml"
      OSCAL_REPORT_FILE="$OSCAL_DIR/user-readable-report.html"
    elif [ -f "$OSCAL_DIR/oscap-results.xml" ]; then
      OSCAL_RESULT_FILE="$OSCAL_DIR/oscap-results.xml"
      OSCAL_REPORT_FILE="$OSCAL_DIR/oscap-report.html"
    fi
  fi
  if [ -f "$OSCAL_RESULT_FILE" ]; then
    LAST_RUN=$(stat -c %Y "$OSCAL_RESULT_FILE")
    NOW_TS=$(date +%s)
    AGE_DAYS=$(( (NOW_TS - LAST_RUN) / 86400 ))
    printf "   ${GREEN}✓ %s scan found (%d days ago)${NC}\n" "$profile" "$AGE_DAYS"
    printf "   Report: ${CYAN}%s${NC}\n" "$OSCAL_REPORT_FILE"
    printf "   Server date/time: ${WHITE}%s${NC}\n" "$(date)"
    # Show pass/fail/total summary if xmllint is available
    if command -v xmllint &>/dev/null; then
      # Use more robust XPath and add notapplicable
      TOTAL_XPATH="count(//rule-result)"
      PASS_XPATH="count(//rule-result[result='pass'])"
      FAIL_XPATH="count(//rule-result[result='fail'])"
      NOTAPPLICABLE_XPATH="count(//rule-result[result='notapplicable'])"
      TOTAL=$(xmllint --xpath "$TOTAL_XPATH" "$OSCAL_RESULT_FILE" 2>/dev/null)
      PASS=$(xmllint --xpath "$PASS_XPATH" "$OSCAL_RESULT_FILE" 2>/dev/null)
      FAIL=$(xmllint --xpath "$FAIL_XPATH" "$OSCAL_RESULT_FILE" 2>/dev/null)
      NOTAPPLICABLE=$(xmllint --xpath "$NOTAPPLICABLE_XPATH" "$OSCAL_RESULT_FILE" 2>/dev/null)

      PASS=${PASS:-0}
      FAIL=${FAIL:-0}
      TOTAL=${TOTAL:-0}
      NOTAPPLICABLE=${NOTAPPLICABLE:-0}
      if [[ "$PASS" =~ ^[0-9]+$ ]] && [[ "$FAIL" =~ ^[0-9]+$ ]] && [[ "$TOTAL" =~ ^[0-9]+$ ]] && [[ "$NOTAPPLICABLE" =~ ^[0-9]+$ ]]; then
        printf "   ${GREEN}Pass: %s${NC}  ${RED}Fail: %s${NC}  ${YELLOW}N/A: %s${NC}  ${WHITE}Total: %s${NC}\n" "$PASS" "$FAIL" "$NOTAPPLICABLE" "$TOTAL"
      fi
    fi
  else
    printf "   ${RED}✗ No OpenSCAP scan results found for %s${NC}\n" "$profile"
    missing_profiles+=("$profile")
  fi
done

# Only show available options if any are missing
if [ ${#missing_profiles[@]} -gt 0 ]; then
  printf "${BOLD}${CYAN}Actionable OSCAL Scans (missing from monitor):${NC} ${YELLOW}%s${NC}\n" "${missing_profiles[*]}"
fi

# Vibrant environment summary and time estimate for memory monitoring
CPU_CORES=$(nproc 2>/dev/null || echo 1)
MEM_TOTAL_MB=$(free -m 2>/dev/null | awk '/^Mem:/ {print $2}' || echo 2000)
DISK_AVAIL=$(df -h / | awk 'NR==2{print $4}')

bar() {
  local label="$1"; local value="$2"; local max="$3"; local color="$4"
  local n=$((value > max ? max : value))
  printf "${color}%-18s [" "$label"
  for ((i=0;i<n;i++)); do printf "█"; done
  for ((i=n;i<max;i++)); do printf "·"; done
  printf "]${NC} %s\n" "$value"
}

MONITOR_EST=1
if [ "$CPU_CORES" -le 1 ]; then MONITOR_EST=2; fi
if [ "$MEM_TOTAL_MB" -lt 1500 ]; then MONITOR_EST=$((MONITOR_EST+1)); fi

printf "${BOLD}${CYAN}\n╔══════════════════════════════════════════════════════════════╗\n"
printf "║        🧠 Memory Monitor Environment                 ║\n"
printf "╚══════════════════════════════════════════════════════════════╝${NC}\n"
echo -e "${BLUE}CPU Cores:   ${GREEN}$CPU_CORES${NC}   ${BLUE}Memory: ${GREEN}${MEM_TOTAL_MB}MB${NC}   ${BLUE}Disk Free: ${GREEN}${DISK_AVAIL}${NC}"
bar "Monitoring" $MONITOR_EST 10 "$GREEN"
echo -e "${BOLD}${WHITE}Estimated Time: Continuous${NC}\n"

init_screen
START_TIME=$(date +%s)

while true; do
    # Initialize network speed variables to avoid unbound variable errors
    rx_speed=0
    tx_speed=0
    
    move_cursor_home
    clear_to_end
    now_time=$(date '+%H:%M:%S')
    current_time=$(date +%s)
    elapsed=$((current_time - START_TIME))
    elapsed_h=$((elapsed / 3600))
    elapsed_m=$(((elapsed % 3600) / 60))
    elapsed_s=$((elapsed % 60))
    elapsed_fmt=$(printf "%02d:%02d:%02d" $elapsed_h $elapsed_m $elapsed_s)

    # Vibrant color cycling for time and elapsed (alternates CYAN, GREEN, PURPLE)
    color_cycle=($CYAN $GREEN $PURPLE)
    color_idx=$(( (current_time / 2) % 3 ))
    time_color=${color_cycle[$color_idx]}
    elapsed_color=${color_cycle[$(( (color_idx+1)%3 ))]}

    # Elapsed time progress bar (30 chars, fills as time passes in the hour)
    elapsed_percent=$(( (elapsed % 3600) * 100 / 3600 ))
    elapsed_bar_filled=$((elapsed_percent * 30 / 100))
    elapsed_bar_empty=$((30 - elapsed_bar_filled))
    elapsed_bar=""
    for ((i=0; i<elapsed_bar_filled; i++)); do elapsed_bar+="${GREEN}━${NC}"; done
    for ((i=0; i<elapsed_bar_empty; i++)); do elapsed_bar+="${CYAN}─${NC}"; done

    # Print legendary header (no box)
    echo -e "${BOLD}${CYAN}🖥️  TRUE NORTH INSIGHTS: CRAFT FUSION SYSTEM MONITOR${NC}"
    echo -e "${WHITE}${BOLD}by True North Insights${NC}"
    printf "${BOLD}${time_color}⏰ %s${NC}    ${BOLD}${elapsed_color}⏳ Elapsed: %s${NC}\n" "$now_time" "$elapsed_fmt"
    echo -e "$elapsed_bar"
    echo -e "${PURPLE}${BOLD}LIVE UPDATING • LEGENDARY MODE${NC}"
    echo
    
    # Get memory info
    if command -v free >/dev/null 2>&1; then
        mem_info=$(free -m)
        mem_line=$(echo "$mem_info" | grep "^Mem:")
        swap_line=$(echo "$mem_info" | grep "^Swap:")
        
        # Parse memory values
        mem_total=$(echo $mem_line | awk '{print $2}')
        mem_used=$(echo $mem_line | awk '{print $3}')
        mem_free=$(echo $mem_line | awk '{print $4}')
        mem_shared=$(echo $mem_line | awk '{print $5}')
        mem_buffers=$(echo $mem_line | awk '{print $6}')
        mem_available=$(echo $mem_line | awk '{print $7}')
        
        swap_total=$(echo $swap_line | awk '{print $2}')
        swap_used=$(echo $swap_line | awk '{print $3}')
        swap_free=$(echo $swap_line | awk '{print $4}')
        
        echo -e "${BOLD}${BLUE}💾 Memory Usage:${NC}"
        printf "   RAM:  %4d MB / %4d MB  " "$mem_used" "$mem_total"
        print_memory_bar "$mem_used" "$mem_total"
        echo
        
        printf "   Free: %4d MB            " "$mem_free"
        if [ $mem_free -lt 100 ]; then
            echo -e "${RED}${BOLD}⚠️  LOW${NC}"
        elif [ $mem_free -lt 300 ]; then
            echo -e "${YELLOW}${BOLD}⚠️  TIGHT${NC}"
        else
            echo -e "${GREEN}${BOLD}✓ OK${NC}"
        fi
        
        printf "   Avail:%4d MB            " "$mem_available"
        if [ $mem_available -lt 200 ]; then
            echo -e "${RED}${BOLD}⚠️  CRITICAL${NC}"
        elif [ $mem_available -lt 500 ]; then
            echo -e "${YELLOW}${BOLD}⚠️  LOW${NC}"
        else
            echo -e "${GREEN}${BOLD}✓ GOOD${NC}"
        fi
        
        echo
        echo -e "${BOLD}${PURPLE}💽 Swap Usage:${NC}"
        if [ $swap_total -gt 0 ]; then
            printf "   Swap: %4d MB / %4d MB  " "$swap_used" "$swap_total"
            print_memory_bar "$swap_used" "$swap_total"
            echo
            
            if [ $swap_used -gt 0 ]; then
                echo -e "   ${CYAN}📊 System is using swap (memory pressure)${NC}"
            fi
        else
            echo -e "   ${YELLOW}⚠️  No swap configured${NC}"
        fi
    fi
    
    echo
    echo -e "${BOLD}${WHITE}🌐 Network Connectivity:${NC}"
    
    # Get network interface
    NETWORK_INTERFACE=$(get_network_interface)
    if [ -n "$NETWORK_INTERFACE" ]; then
        echo -e "   Interface: ${CYAN}$NETWORK_INTERFACE${NC}"
        
        # Check network connectivity and latency
        connectivity_result=$(check_network_connectivity)
        success_count=$(echo "$connectivity_result" | awk '{print $1}')
        total_latency=$(echo "$connectivity_result" | awk '{print $2}')
        
        if [ $success_count -eq 3 ]; then
            avg_latency=$(echo "scale=1; $total_latency / 3" | bc 2>/dev/null || echo "$((${total_latency%.*} / 3))")
            echo -e "   Status:    ${GREEN}${BOLD}✓ ONLINE${NC} (${avg_latency}ms avg)"
        elif [ $success_count -gt 0 ]; then
            avg_latency=$(echo "scale=1; $total_latency / $success_count" | bc 2>/dev/null || echo "$((${total_latency%.*} / $success_count))")
            echo -e "   Status:    ${YELLOW}${BOLD}⚠️  PARTIAL${NC} ($success_count/3, ${avg_latency}ms)"
        else
            echo -e "   Status:    ${RED}${BOLD}✗ OFFLINE${NC}"
        fi
        
        # Get current network stats
        current_stats=$(get_network_stats "$NETWORK_INTERFACE")
        current_rx=$(echo "$current_stats" | awk '{print $1}')
        current_tx=$(echo "$current_stats" | awk '{print $2}')
        current_time=$(date +%s)
        
        # Calculate network speed if we have previous data
        if [ $LAST_CHECK_TIME -gt 0 ] && [ $current_time -gt $LAST_CHECK_TIME ]; then
            time_diff=$((current_time - LAST_CHECK_TIME))
            rx_diff=$((current_rx - LAST_RX_BYTES))
            tx_diff=$((current_tx - LAST_TX_BYTES))
            
            if [ $time_diff -gt 0 ]; then
                rx_speed=$((rx_diff / time_diff))
                tx_speed=$((tx_diff / time_diff))
                
                echo -e "   Traffic:   ${GREEN}↓$(format_bytes $rx_speed)/s${NC} ${YELLOW}↑$(format_bytes $tx_speed)/s${NC}"
            fi
        fi
        
        # Update last values
        LAST_RX_BYTES=$current_rx
        LAST_TX_BYTES=$current_tx
        LAST_CHECK_TIME=$current_time
        
        # Show total data transfer
        echo -e "   Total RX:  ${CYAN}$(format_bytes $current_rx)${NC}"
        echo -e "   Total TX:  ${CYAN}$(format_bytes $current_tx)${NC}"
        
    else
        echo -e "   ${RED}✗ No network interface detected${NC}"
    fi
    
    echo
    echo -e "${BOLD}${PURPLE}🎯 API Endpoints:${NC}"
    api_status=$(check_deployment_endpoints)
    if [ -n "$api_status" ]; then
        echo -e "   Services:  $api_status"
    else
        echo -e "   ${YELLOW}⚪ No APIs responding${NC}"
    fi
    
    echo
    echo -e "${BOLD}${GREEN}🔄 Top Memory Consumers:${NC}"
    # Get total memory for per-process bar
    total_mem=$(free -m | awk '/^Mem:/ {print $2}')
    ps aux --sort=-%mem | head -6 | tail -5 | while read line; do
        user=$(echo $line | awk '{print $1}')
        pid=$(echo $line | awk '{print $2}')
        mem_perc=$(echo $line | awk '{print $4}')
        mem_mb=$(awk -v perc="$mem_perc" -v total="$total_mem" 'BEGIN {printf "%d", perc*total/100}')
        cmd=$(echo $line | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}' | cut -c1-30)
        printf "   ${CYAN}%8s${NC} ${YELLOW}%6s${NC} ${GREEN}%5s%%${NC} %s\n" "$user" "$pid" "$mem_perc" "$cmd"
        printf "        "
        print_memory_bar "$mem_mb" "$total_mem"
        echo
    done
    
    echo
    # CPU Block: Show overall and per-core usage
    echo -e "${BOLD}${WHITE}🧮 CPU Usage:${NC}"
    if command -v mpstat >/dev/null 2>&1; then
        # Show per-core and overall CPU usage
        mpstat -P ALL 1 1 | awk 'NR==4{printf "   Total:   %s%% user, %s%% sys, %s%% idle, %s%% iowait, %s%% steal\n", $3, $5, $13, $6, $11} NR>4 && $3 ~ /[0-9]+/ {printf "   Core %s: %s%% user, %s%% sys, %s%% idle, %s%% iowait, %s%% steal\n", $3, $4, $6, $13, $7, $12}'
    else
        # Fallback: Show top 3 CPU-consuming processes
        echo -e "   ${YELLOW}mpstat not found. Showing top CPU-consuming processes:${NC}"
        ps aux --sort=-%cpu | head -6 | tail -5 | awk '{printf "   %-8s %6s %5s%% %s\n", $1, $2, $3, $11}'
    fi
    echo
    
    # Check if no build processes are running
    if ! ps aux | grep -E "(node|ng|nx|npm|tsc)" | grep -v grep >/dev/null; then
        echo -e "   ${YELLOW}⚪ No active build processes${NC}"
    fi
    
    echo
    echo -e "${BOLD}${WHITE}🌍 Network Conditions:${NC}"
    
    # Network condition analysis
    if [ $success_count -eq 3 ] && [ -n "$avg_latency" ] && [ "$avg_latency" != "N/A" ]; then
        latency_num=$(echo "$avg_latency" | cut -d'.' -f1 2>/dev/null || echo "$avg_latency")
        if [ "$latency_num" -lt 50 ] 2>/dev/null; then
            echo -e "   Quality:   ${GREEN}${BOLD}🚀 EXCELLENT${NC} - Low latency"
        elif [ "$latency_num" -lt 100 ] 2>/dev/null; then
            echo -e "   Quality:   ${GREEN}${BOLD}✓ GOOD${NC} - Normal latency"
        elif [ "$latency_num" -lt 200 ] 2>/dev/null; then
            echo -e "   Quality:   ${YELLOW}${BOLD}⚠️  FAIR${NC} - Moderate latency"
        else
            echo -e "   Quality:   ${RED}${BOLD}⚠️  POOR${NC} - High latency"
        fi
    elif [ $success_count -gt 0 ]; then
        echo -e "   Quality:   ${YELLOW}${BOLD}⚠️  UNSTABLE${NC} - Intermittent connectivity"
    else
        echo -e "   Quality:   ${RED}${BOLD}✗ NO CONNECTION${NC}"
    fi
    
    # Check current network activity level
    if [ $LAST_CHECK_TIME -gt 0 ] && [ -n "$rx_speed" ] && [ -n "$tx_speed" ]; then
        total_speed=$((rx_speed + tx_speed))
        if [ $total_speed -gt 1048576 ]; then  # > 1MB/s
            echo -e "   Activity:  ${GREEN}${BOLD}🔥 HIGH${NC} - Heavy data transfer"
        elif [ $total_speed -gt 102400 ]; then  # > 100KB/s
            echo -e "   Activity:  ${CYAN}${BOLD}📊 MODERATE${NC} - Active transfer"
        elif [ $total_speed -gt 1024 ]; then   # > 1KB/s
            echo -e "   Activity:  ${YELLOW}${BOLD}💭 LOW${NC} - Light activity"
        else
            echo -e "   Activity:  ${WHITE}${BOLD}⚪ IDLE${NC} - Minimal traffic"
        fi
    else
        echo -e "   Activity:  ${WHITE}${BOLD}⏳ MEASURING${NC} - Collecting data..."
    fi
    
    echo
    echo -e "${BOLD}${CYAN}📈 System Health Summary:${NC}"
    
    # Memory pressure
    if [ $mem_available -lt 200 ]; then
        echo -e "   Memory:    ${RED}🔥 HIGH PRESSURE - System may slow down${NC}"
    elif [ $mem_available -lt 500 ]; then
        echo -e "   Memory:    ${YELLOW}⚠️  MODERATE PRESSURE - Monitor closely${NC}"
    else
        echo -e "   Memory:    ${GREEN}✅ LOW PRESSURE - System performing well${NC}"
    fi
    
    # Swap activity
    if [ $swap_used -gt 100 ]; then
        echo -e "   Swap:      ${YELLOW}💽 Heavy usage - Build may be slower${NC}"
    elif [ $swap_used -gt 0 ]; then
        echo -e "   Swap:      ${CYAN}💭 Light usage - Normal for large builds${NC}"
    else
        echo -e "   Swap:      ${GREEN}✓ No usage - Memory sufficient${NC}"
    fi
    
    # Network status
    if [ $success_count -eq 3 ]; then
        echo -e "   Network:   ${GREEN}✓ Stable connection - Deployments OK${NC}"
    elif [ $success_count -gt 0 ]; then
        echo -e "   Network:   ${YELLOW}⚠️  Unstable - Watch deployment progress${NC}"
    else
        echo -e "   Network:   ${RED}✗ No connection - Deployments will fail${NC}"
    fi
    
    echo
    echo -e "${CYAN}Press Ctrl+C to exit monitor${NC}"
    
    echo
    echo -e "${BOLD}${CYAN}🛡️  OSCAL/FedRAMP Compliance Scan:${NC}"
    for profile_loop_var in "${OSCAL_PROFILES[@]}"; do # Renamed loop variable for clarity
        current_profile_result_file=""
        current_profile_report_file=""

        # Define potential file names
        user_readable_profile_specific="$OSCAL_DIR/user-readable-results-$profile_loop_var.xml"
        admin_profile_specific="$OSCAL_DIR/oscap-results-$profile_loop_var.xml"
        user_readable_generic_standard="$OSCAL_DIR/user-readable-results.xml" # Only for standard profile legacy
        admin_generic_standard="$OSCAL_DIR/oscap-results.xml"               # Only for standard profile legacy

        # Prefer user-readable files
        if [ -f "$user_readable_profile_specific" ]; then
            current_profile_result_file="$user_readable_profile_specific"
            current_profile_report_file="${user_readable_profile_specific/.xml/.html}"
        elif [ "$profile_loop_var" = "standard" ]; then # Check for legacy standard files
            if [ -f "$user_readable_generic_standard" ]; then
                current_profile_result_file="$user_readable_generic_standard"
                current_profile_report_file="${user_readable_generic_standard/.xml/.html}"
            elif [ -f "$admin_generic_standard" ]; then
                current_profile_result_file="$admin_generic_standard"
                current_profile_report_file="${admin_generic_standard/.xml/.html}"
            fi
        fi
        # Fallback to admin profile-specific if no user-readable or generic standard found
        if [ -z "$current_profile_result_file" ] && [ -f "$admin_profile_specific" ]; then
            current_profile_result_file="$admin_profile_specific"
            current_profile_report_file="${admin_profile_specific/.xml/.html}"
        fi

        if [ -n "$current_profile_result_file" ] && [ -f "$current_profile_result_file" ]; then
            LAST_RUN=$(stat -c %Y "$current_profile_result_file")
            NOW_TS=$(date +%s)
            AGE_DAYS=$(( (NOW_TS - LAST_RUN) / 86400 ))
            if [ "$AGE_DAYS" -le "$OSCAL_MAX_AGE_DAYS" ]; then
                echo -e "   ${GREEN}✓ OpenSCAP scan found for ${profile_loop_var} ($AGE_DAYS days ago)${NC}"
            else
                echo -e "   ${YELLOW}⚠️  OpenSCAP scan for ${profile_loop_var} is older than $OSCAL_MAX_AGE_DAYS days ($AGE_DAYS days ago)${NC}"
            fi
            echo -e "   Report: ${CYAN}$current_profile_report_file${NC}"
            # Show human readable date/time in SFO (America/Los_Angeles)
            if command -v date >/dev/null 2>&1; then
                local_time_sfo=$(TZ=America/Los_Angeles date -d "$(stat -c '%y' "$current_profile_result_file")" '+%Y-%m-%d %I:%M:%S %p %Z (%A)')
                echo -e "   Server date/time: ${WHITE}$local_time_sfo${NC}"
                # Indicate if the file is older than the last OSCAL run (stale)
                if [ $LAST_RUN -lt $NOW_TS ]; then
                    echo -e "   ${YELLOW}⚠️  Note: This report has not been updated since the last OSCAL run. Please re-run OSCAL for fresh results.${NC}"
                fi
            else
                echo -e "   Server date/time: ${WHITE}$(stat -c '%y' "$current_profile_result_file")${NC}"
            fi
            # Show pass/fail summary if xmllint is available
            if command -v xmllint &>/dev/null; then
                # Use more robust XPath and add notapplicable
                TOTAL_XPATH_LOOP="count(//rule-result)"
                PASS_XPATH_LOOP="count(//rule-result[result='pass'])"
                FAIL_XPATH_LOOP="count(//rule-result[result='fail'])"
                NOTAPPLICABLE_XPATH_LOOP="count(//rule-result[result='notapplicable'])"
                TOTAL=$(xmllint --xpath "$TOTAL_XPATH_LOOP" "$current_profile_result_file" 2>/dev/null)
                PASS=$(xmllint --xpath "$PASS_XPATH_LOOP" "$current_profile_result_file" 2>/dev/null)
                FAIL=$(xmllint --xpath "$FAIL_XPATH_LOOP" "$current_profile_result_file" 2>/dev/null)
                NOTAPPLICABLE=$(xmllint --xpath "$NOTAPPLICABLE_XPATH_LOOP" "$current_profile_result_file" 2>/dev/null)

                PASS=${PASS:-0}
                FAIL=${FAIL:-0}
                TOTAL=${TOTAL:-0}
                NOTAPPLICABLE=${NOTAPPLICABLE:-0}
                if [[ "$PASS" =~ ^[0-9]+$ ]] && [[ "$FAIL" =~ ^[0-9]+$ ]] && [[ "$TOTAL" =~ ^[0-9]+$ ]] && [[ "$NOTAPPLICABLE" =~ ^[0-9]+$ ]]; then
                    printf "   ${GREEN}Pass: %s${NC}  ${RED}Fail: %s${NC}  ${YELLOW}N/A: %s${NC}  ${WHITE}Total: %s${NC}\n" "$PASS" "$FAIL" "$NOTAPPLICABLE" "$TOTAL"
                fi
            fi
        else
            echo -e "   ${RED}✗ No OpenSCAP scan results found for ${profile_loop_var}${NC}"
        fi
    done
    # At the end, print colored monitored profiles
    colored_profiles=""
    for p in "${OSCAL_PROFILES[@]}"; do
      if [ -f "$OSCAL_DIR/user-readable-results-$p.xml" ] || [ -f "$OSCAL_DIR/oscap-results-$p.xml" ]; then
        colored_profiles+="${GREEN}$p${NC} ";
      else
        colored_profiles+="${RED}$p${NC} ";
      fi

    done
    echo -e "${BOLD}${CYAN}Monitored OSCAL scan profiles:${NC} $colored_profiles"
    
    echo
    echo -e "${BOLD}${CYAN}🌐 Frontend (nginx) Service:${NC}"
    # Check nginx service status
    if command -v systemctl &>/dev/null; then
        nginx_status=$(systemctl is-active nginx 2>/dev/null)
        if [ "$nginx_status" = "active" ]; then
            echo -e "   ${GREEN}✓ nginx is running${NC}"
        else
            echo -e "   ${RED}✗ nginx is not running${NC} (status: $nginx_status)"
        fi
    else
        # Fallback for systems without systemctl
        if pgrep -x nginx >/dev/null; then
            echo -e "   ${GREEN}✓ nginx process found${NC}"
        else
            echo -e "   ${RED}✗ nginx process not found${NC}"
        fi
    fi
    # Check web root and permissions
    WEB_ROOT="/var/www/jeffreysanford.us"
    if [ -d "$WEB_ROOT" ]; then
        owner_group=$(stat -c '%U:%G' "$WEB_ROOT")
        echo -e "   Web root: ${CYAN}$WEB_ROOT${NC} (owner:group ${YELLOW}$owner_group${NC})"
        index_file="$WEB_ROOT/index.html"
        if [ -f "$index_file" ]; then
            echo -e "   ${GREEN}✓ index.html present${NC}"
        else
            echo -e "   ${YELLOW}⚠ index.html missing${NC}"
        fi
    else
        echo -e "   ${RED}✗ Web root $WEB_ROOT not found${NC}"
    fi
    echo
    echo -e "${BOLD}${CYAN}🗂️  OSCAL Files Present:${NC}"
    if [ -d "$OSCAL_DIR" ]; then
        find "$OSCAL_DIR" -maxdepth 1 -type f | sort | while read f; do
            fname=$(basename "$f")
            echo -e "   ${WHITE}$fname${NC}"
        done
    else
        echo -e "   ${RED}✗ OSCAL directory not found${NC}"
    fi
    echo
    echo -e "${BOLD}${CYAN}🟢 PM2 Process Status:${NC}"
    if command -v pm2 &>/dev/null; then
        pm2 list || echo -e "   ${YELLOW}⚠ pm2 list failed${NC}"
    else
        echo -e "   ${YELLOW}⚠ pm2 not installed${NC}"
    fi

    sleep 2
done
