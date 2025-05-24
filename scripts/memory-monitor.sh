#!/bin/bash
# memory-monitor.sh - Real-time memory monitoring during deployment

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# Progress bar
PROGRESS_CHAR="█"
EMPTY_CHAR="░"

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

while true; do
    clear
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║                  🖥️  MEMORY MONITOR                          ║${NC}"
    echo -e "${BOLD}${CYAN}║                   $(date '+%H:%M:%S')                             ║${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
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
    echo -e "${BOLD}${GREEN}🔄 Top Memory Consumers:${NC}"
    ps aux --sort=-%mem | head -6 | tail -5 | while read line; do
        user=$(echo $line | awk '{print $1}')
        pid=$(echo $line | awk '{print $2}')
        mem=$(echo $line | awk '{print $4}')
        cmd=$(echo $line | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}' | cut -c1-30)
        
        printf "   ${CYAN}%8s${NC} ${YELLOW}%6s${NC} ${GREEN}%5s%%${NC} %s\n" "$user" "$pid" "$mem" "$cmd"
    done
    
    echo
    echo -e "${BOLD}${BLUE}🔍 Node/Build Processes:${NC}"
    ps aux | grep -E "(node|ng|nx|npm|tsc)" | grep -v grep | head -3 | while read line; do
        if [ -n "$line" ]; then
            pid=$(echo $line | awk '{print $2}')
            mem=$(echo $line | awk '{print $4}')
            cpu=$(echo $line | awk '{print $3}')
            cmd=$(echo $line | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}' | cut -c1-25)
            
            printf "   ${PURPLE}PID %6s${NC} ${GREEN}%5s%% mem${NC} ${YELLOW}%5s%% cpu${NC} %s\n" "$pid" "$mem" "$cpu" "$cmd"
        fi
    done
    
    # Check if no build processes are running
    if ! ps aux | grep -E "(node|ng|nx|npm|tsc)" | grep -v grep >/dev/null; then
        echo -e "   ${YELLOW}⚪ No active build processes${NC}"
    fi
    
    echo
    echo -e "${BOLD}${CYAN}📈 Memory Pressure Indicators:${NC}"
    
    # Check memory pressure
    if [ $mem_available -lt 200 ]; then
        echo -e "   ${RED}🔥 HIGH PRESSURE - System may slow down${NC}"
    elif [ $mem_available -lt 500 ]; then
        echo -e "   ${YELLOW}⚠️  MODERATE PRESSURE - Monitor closely${NC}"
    else
        echo -e "   ${GREEN}✅ LOW PRESSURE - System performing well${NC}"
    fi
    
    # Check swap activity
    if [ $swap_used -gt 0 ] && [ $swap_used -lt 100 ]; then
        echo -e "   ${CYAN}💭 Light swap usage - Normal for large builds${NC}"
    elif [ $swap_used -gt 100 ]; then
        echo -e "   ${YELLOW}💽 Heavy swap usage - Build may be slower${NC}"
    fi
    
    echo
    echo -e "${CYAN}Press Ctrl+C to exit monitor${NC}"
    
    sleep 2
done
