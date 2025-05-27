#!/bin/bash
# Common utility functions for deployment scripts

# Print a progress bar for long-running steps
print_progress() {
    local title="$1"
    local estimated_total_seconds="$2"
    local start_time_epoch="$3"
    local progress_bar_width=30

    if [ ! -t 1 ]; then return; fi # Only run if TTY

    while true; do
        local current_time_epoch=$(date +%s)
        local elapsed_seconds=$((current_time_epoch - start_time_epoch))
        local remaining_seconds=$((estimated_total_seconds - elapsed_seconds))

        [ "$remaining_seconds" -lt 0 ] && remaining_seconds=0

        local percent_done=0
        [ "$estimated_total_seconds" -gt 0 ] && percent_done=$((elapsed_seconds * 100 / estimated_total_seconds))
        [ "$percent_done" -gt 100 ] && percent_done=100

        local filled_width=$((percent_done * progress_bar_width / 100))
        local empty_width=$((progress_bar_width - filled_width))

        local bar=""
        for ((i=0; i<filled_width; i++)); do bar+="█"; done
        for ((i=0; i<empty_width; i++)); do bar+="░"; done

        local rem_min=$((remaining_seconds / 60))
        local rem_sec=$((remaining_seconds % 60))
        local time_left_str=$(printf "%02d:%02d" "$rem_min" "$rem_sec")

        printf "\r%-25s [%s] %3d%% (%s remaining)\033[K" "$title:" "$bar" "$percent_done" "$time_left_str"

        if [ "$remaining_seconds" -eq 0 ] && [ "$elapsed_seconds" -ge "$estimated_total_seconds" ]; then break; fi
        command sleep 5
    done
}

# Clean up the progress bar line
cleanup_progress_line() { [ -t 1 ] && printf "\r\033[K"; }
