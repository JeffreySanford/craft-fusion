package main

import (
	"bytes"
	"encoding/json"
	"encoding/xml"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// ANSI color codes
const (
	ColorReset   = "\033[0m"
	ColorRed     = "\033[31m"
	ColorGreen   = "\033[32m"
	ColorYellow  = "\033[33m"
	ColorBlue    = "\033[34m"
	ColorMagenta = "\033[35m"
	ColorCyan    = "\033[36m"
	ColorWhite   = "\033[97m"
	ColorBold    = "\033[1m"
	ColorPurple  = "\033[95m"
)

// OscalScan represents a scan profile and its configuration
type OscalScan struct {
	Profile     string
	ProfileID   string
	Description string
	Color       string
	Reference   string
	Note        string
	Results     ScanResults
}

// ScanResults stores the results of a scan
// Add Created and Updated timestamps
type ScanResults struct {
	XMLPath       string
	HTMLPath      string
	JSONPath      string
	MarkdownPath  string
	PDFPath       string
	Pass          int
	Fail          int
	NotApplicable int
	Total         int
	ExitCode      int
	StartTime     time.Time
	EndTime       time.Time
	Created       time.Time // New: file creation time
	Updated       time.Time // New: file last update time
}

// OscalResults represents XML structure of oscap results
type OscalResults struct {
	XMLName    xml.Name `xml:"Benchmark"`
	TestResult struct {
		RuleResults []struct {
			Result string `xml:"result"`
		} `xml:"rule-result"`
	} `xml:"TestResult"`
}

// OscalProfile represents a profile entry from oscal-profiles.json
// Add Reference and Note fields
type OscalProfile struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	ID          string `json:"id"`
	Status      string `json:"status"`
	Note        string `json:"note"`
	Reference   string `json:"reference"`
}

// Global variables for progress tracking
var (
	completedScans int32      // Atomically incremented counter for completed scans
	progressMutex  sync.Mutex // To synchronize printing of the overall progress bar
)

func printLegendaryHeader() {
	fmt.Printf("%s%s\n", ColorBold+ColorCyan, strings.Repeat("═", 70))
	fmt.Printf("%s🛡️  TRUE NORTH INSIGHTS: CRAFT FUSION OSCAL SCANNER%s\n", ColorBold+ColorGreen, ColorReset)
	fmt.Printf("%s%s\n", ColorBold+ColorCyan, strings.Repeat("═", 70))
	fmt.Printf("%sLegendary Mode: Vibrant, animated, and branded reporting!%s\n", ColorMagenta, ColorReset)
}

func main() {
	// Parse command-line flags
	purge := flag.Bool("purge", false, "Purge existing scan results before running new scans")
	scapContentPath := flag.String("scap-content", getDefaultScapContentPath(), "Path to SCAP content XML file (e.g., ssg-fedora-ds.xml or C:\\path\\to\\content.xml)")
	verbose := flag.Bool("verbose", false, "Show detailed per-control output")
	flag.Parse()

	// Define base directory for scan results
	oscalDir := filepath.Join("..", "oscal-analysis")
	os.MkdirAll(oscalDir, 0755)

	// Load available scan profiles from oscal-profiles.json if present
	oscalProfilesPath := filepath.Join("..", "oscal-profiles.json")
	var profiles []OscalScan
	if fileExists(oscalProfilesPath) {
		data, err := ioutil.ReadFile(oscalProfilesPath)
		if err == nil {
			var parsed struct {
				Profiles []OscalProfile `json:"profiles"`
			}
			if err := json.Unmarshal(data, &parsed); err == nil && len(parsed.Profiles) > 0 {
				for _, p := range parsed.Profiles {
					color := ColorPurple
					switch {
					case p.Name == "ospp":
						color = ColorCyan
					case p.Name == "pci-dss":
						color = ColorYellow
					case p.Name == "cusp":
						color = ColorGreen
					case p.Name == "medium-high":
						color = ColorBlue
					case p.Name == "rev5":
						color = ColorPurple
					case p.Name == "truenorth":
						color = ColorWhite
					}
					profiles = append(profiles, OscalScan{
						Profile:     p.Name,
						ProfileID:   p.ID,
						Description: p.Description,
						Color:       color,
						Reference:   p.Reference,
						Note:        p.Note,
					})
				}
				fmt.Printf("%sLoaded profiles from oscal-profiles.json:%s ", ColorCyan, ColorReset)
				for _, p := range profiles {
					fmt.Printf("%s ", p.Profile)
				}
				fmt.Println()
			}
		}
	}
	if len(profiles) == 0 {
		// Fallback to hardcoded profiles if file missing or parse error
		profiles = []OscalScan{
			{
				Profile:     "standard",
				ProfileID:   "xccdf_org.ssgproject.content_profile_standard",
				Description: "Baseline security (recommended for most)",
				Color:       ColorPurple,
			},
			{
				Profile:     "ospp",
				ProfileID:   "xccdf_org.ssgproject.content_profile_ospp",
				Description: "Protection Profile for General Purpose Operating Systems",
				Color:       ColorCyan,
			},
			{
				Profile:     "pci-dss",
				ProfileID:   "xccdf_org.ssgproject.content_profile_pci-dss",
				Description: "Payment Card Industry Data Security Standard",
				Color:       ColorYellow,
			},
			{
				Profile:     "cusp",
				ProfileID:   "xccdf_org.ssgproject.content_profile_cusp_fedora",
				Description: "Custom User Security Profile (Fedora-specific)",
				Color:       ColorGreen,
			},
			{
				Profile:     "medium-high",
				ProfileID:   "xccdf_org.ssgproject.content_profile_moderate",
				Description: "FedRAMP Moderate Impact (aligned with Rev5)",
				Color:       ColorBlue,
			},
			{
				Profile:     "rev5",
				ProfileID:   "xccdf_org.ssgproject.content_profile_high",
				Description: "FedRAMP High Impact (aligned with Rev5)",
				Color:       ColorPurple,
			},
			{
				Profile:     "truenorth",
				ProfileID:   "oscal_truenorth_profile",
				Description: "TrueNorth custom OSCAL profile (exceeds all other standards)",
				Color:       ColorWhite,
			},
		}
	}

	// If purge flag is set, remove existing scan results
	if *purge {
		fmt.Printf("%sPurging existing scan results...%s\n", ColorYellow, ColorReset)
		patterns := []string{
			"oscap-results-*.xml",
			"oscap-report-*.html",
			"user-readable-*.xml",
			"user-readable-*.html",
			"*.json",
			"*.md",
			"*.pdf",
			"truenorth-results.json", // Specific file for truenorth
		}
		for _, pattern := range patterns {
			matches, err := filepath.Glob(filepath.Join(oscalDir, pattern))
			if err != nil {
				fmt.Printf("%sError finding files with pattern %s: %v%s\n", ColorRed, pattern, err, ColorReset)
				continue
			}
			for _, match := range matches {
				err := os.Remove(match)
				if err != nil && !os.IsNotExist(err) { // Don't error if file is already gone
					fmt.Printf("%sError removing file %s: %v%s\n", ColorRed, match, err, ColorReset)
				}
			}
		}
		fmt.Printf("%s✓ Scan results purged%s\n", ColorGreen, ColorReset)
	}

	printLegendaryHeader()

	// Check for existing scan results and their status
	checkExistingScans(profiles, oscalDir)

	// Run scans concurrently
	fmt.Printf("\n%s=== Running OSCAL scans in parallel (this may take several minutes) ===%s\n", ColorBold+ColorCyan, ColorReset)
	var wg sync.WaitGroup
	results := make([]OscalScan, len(profiles))
	copy(results, profiles)

	totalScansToRun := len(results)
	atomic.StoreInt32(&completedScans, 0) // Reset completed scans counter

	printOverallProgress(0, totalScansToRun, "", false) // Initial progress bar display

	// Use a buffered channel as a semaphore to limit concurrency
	semaphore := make(chan struct{}, 3) // Run up to 3 scans concurrently

	for i := 0; i < totalScansToRun; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			semaphore <- struct{}{}        // Acquire semaphore
			defer func() { <-semaphore }() // Release semaphore when done

			profile := results[idx] // Create a local copy for this goroutine
			defer func() {
				atomic.AddInt32(&completedScans, 1)
				printOverallProgress(int(atomic.LoadInt32(&completedScans)), totalScansToRun, profile.Profile, false)
			}()

			if profile.Profile == "truenorth" {
				// For truenorth, run a special JSON validation instead of oscap
				runTrueNorthScan(&results[idx], oscalDir)
			} else {
				// For all other profiles, run an oscap scan
				runOscapScan(&results[idx], oscalDir, *scapContentPath, *verbose)
			}

		}(i)
	}

	wg.Wait()

	// Generate summary report
	generateSummaryReport(results, oscalDir)
	// Final progress bar update with newline
	printOverallProgress(int(atomic.LoadInt32(&completedScans)), totalScansToRun, "", true)

	// Update the central profile file locally
	updateOscalProfilesJSON(results, oscalProfilesPath)

	// Optionally, update the central profile file remotely (placeholder)
	// Example: uploadOscalProfilesJSON(oscalProfilesPath)
	// Implement remote update logic here, e.g., HTTP PUT/POST or SFTP upload

	// Display final results
	fmt.Printf("\n%s=== OSCAL Scan Summary ===%s\n", ColorBold+ColorCyan, ColorReset)
	successful := 0
	withFailures := 0
	failed := 0

	for _, result := range results {
		fmt.Printf("%s%s Profile: %s%s\n", result.Color, ColorBold, result.Profile, ColorReset)
		// Print reference and note if available
		if result.Description != "" {
			fmt.Printf("  Description: %s\n", result.Description)
		}
		if result.Reference != "" {
			fmt.Printf("  Reference: %s\n", result.Reference)
		}
		if result.Note != "" {
			fmt.Printf("  Note: %s\n", result.Note)
		}

		if result.Profile == "truenorth" {
			if result.Results.ExitCode == 0 {
				fmt.Printf("  %s✓ TrueNorth JSON validation completed successfully%s\n", ColorGreen, ColorReset)
				successful++
			} else {
				fmt.Printf("  %s✗ TrueNorth JSON validation failed%s\n", ColorRed, ColorReset)
				failed++
			}
			continue
		}

		if result.Results.ExitCode == 0 {
			fmt.Printf("  %s✓ Scan completed successfully%s\n", ColorGreen, ColorReset)
			successful++
		} else if result.Results.ExitCode == 2 {
			fmt.Printf("  %s⚠ Scan completed with rule failures%s\n", ColorYellow, ColorReset)
			withFailures++
		} else {
			fmt.Printf("  %s✗ Scan failed (Exit code: %d)%s\n", ColorRed, result.Results.ExitCode, ColorReset)
			failed++
		}

		if result.Results.Total > 0 {
			fmt.Printf("  Pass: %s%d%s  Fail: %s%d%s  N/A: %s%d%s  Total: %s%d%s\n",
				ColorGreen, result.Results.Pass, ColorReset,
				ColorRed, result.Results.Fail, ColorReset,
				ColorYellow, result.Results.NotApplicable, ColorReset,
				ColorWhite, result.Results.Total, ColorReset)
		}

		if result.Results.XMLPath != "" {
			fmt.Printf("  XML: %s%s%s\n", ColorCyan, result.Results.XMLPath, ColorReset)
			fmt.Printf("  HTML: %s%s%s\n", ColorCyan, result.Results.HTMLPath, ColorReset)
			if result.Results.JSONPath != "" {
				fmt.Printf("  JSON: %s%s%s\n", ColorCyan, result.Results.JSONPath, ColorReset)
			}
			if result.Results.MarkdownPath != "" {
				fmt.Printf("  Markdown: %s%s%s\n", ColorCyan, result.Results.MarkdownPath, ColorReset)
			}
		}

		fmt.Printf("  Duration: %s%.1f seconds%s\n", ColorWhite,
			result.Results.EndTime.Sub(result.Results.StartTime).Seconds(), ColorReset)
	}

	fmt.Printf("\n%s=== Final Tallies ===%s\n", ColorBold+ColorCyan, ColorReset)
	fmt.Printf("%sSuccessful scans: %d%s\n", ColorGreen, successful, ColorReset)
	fmt.Printf("%sScans with rule failures: %d%s\n", ColorYellow, withFailures, ColorReset)
	fmt.Printf("%sFailed scans: %d%s\n", ColorRed, failed, ColorReset)

	// Print colored profile status
	fmt.Printf("\n%sMonitored OSCAL scan profiles: ", ColorBold+ColorCyan)
	for _, p := range profiles {
		if fileExists(filepath.Join(oscalDir, "oscap-results-"+p.Profile+".xml")) ||
			fileExists(filepath.Join(oscalDir, "user-readable-results-"+p.Profile+".xml")) {
			fmt.Printf("%s%s%s ", ColorGreen, p.Profile, ColorReset)
		} else {
			fmt.Printf("%s%s%s ", ColorRed, p.Profile, ColorReset)
		}
	}
	fmt.Printf("%s\n", ColorReset)
}

func checkExistingScans(profiles []OscalScan, oscalDir string) {
	fmt.Printf("\n%sChecking status of existing OSCAL scan profiles...%s\n", ColorBold+ColorCyan, ColorReset)

	maxAgeDays := 7
	now := time.Now()
	actionableScans := []string{}

	for _, profile := range profiles {
		resultFile := filepath.Join(oscalDir, "oscap-results-"+profile.Profile+".xml")
		userResultFile := filepath.Join(oscalDir, "user-readable-results-"+profile.Profile+".xml")

		// Check for legacy files for standard profile
		if profile.Profile == "standard" {
			legacyResult := filepath.Join(oscalDir, "oscap-results.xml")
			legacyUserResult := filepath.Join(oscalDir, "user-readable-results.xml")

			if fileExists(legacyUserResult) {
				resultFile = legacyUserResult
			} else if fileExists(legacyResult) {
				resultFile = legacyResult
			}
		}

		// Check user-readable file first
		if fileExists(userResultFile) {
			resultFile = userResultFile
		}

		if fileExists(resultFile) {
			info, err := os.Stat(resultFile)
			if err == nil {
				ageDays := int(now.Sub(info.ModTime()).Hours() / 24)
				fmt.Printf("%s✓ %s scan found (%d days ago)%s\n", ColorGreen, profile.Profile, ageDays, ColorReset)
				fmt.Printf("   Report: %s%s%s\n", ColorCyan, resultFile, ColorReset)
				fmt.Printf("   Last modified: %s%s%s\n", ColorWhite, info.ModTime().Format("2006-01-02 15:04:05"), ColorReset)

				if ageDays > maxAgeDays {
					actionableScans = append(actionableScans, fmt.Sprintf("%s%s (stale - %d days old)%s",
						ColorYellow, profile.Profile, ageDays, ColorReset))
				}

				// Parse and display result counts if possible
				counts := parseResultCounts(resultFile)
				if counts != nil {
					fmt.Printf("   %sPass: %d%s  %sFail: %d%s  %sN/A: %d%s  %sTotal: %d%s\n",
						ColorGreen, counts["pass"], ColorReset,
						ColorRed, counts["fail"], ColorReset,
						ColorYellow, counts["notapplicable"], ColorReset,
						ColorWhite, counts["total"], ColorReset)
				}
			}
		} else {
			fmt.Printf("%s✗ No OpenSCAP scan results found for %s%s\n", ColorRed, profile.Profile, ColorReset)
			actionableScans = append(actionableScans, fmt.Sprintf("%s%s (missing)%s",
				ColorRed, profile.Profile, ColorReset))
		}
	}

	if len(actionableScans) > 0 {
		fmt.Printf("\n%sActionable OSCAL Scans:%s %s\n", ColorBold+ColorCyan, ColorReset,
			strings.Join(actionableScans, ", "))
	} else {
		fmt.Printf("\n%s✓ All OSCAL profiles appear up-to-date.%s\n", ColorGreen, ColorReset)
	}
}

func runOscapScan(profile *OscalScan, oscalDir string, scapContentFile string, verbose bool) {
	profile.Results.StartTime = time.Now() // Initialize StartTime early

	fmt.Printf("%s=== Running OSCAL scan for profile: %s ===%s\n",
		ColorBold+profile.Color, profile.Profile, ColorReset)

	if scapContentFile == "" {
		fmt.Printf("%s✗ SCAP content path is not specified. Use the --scap-content flag.%s\n", ColorRed, ColorReset)
		profile.Results.ExitCode = 1
		profile.Results.EndTime = time.Now()
		return
	}

	if !fileExists(scapContentFile) {
		fmt.Printf("%s✗ SCAP Security Guide content not found: %s%s\n", ColorRed, scapContentFile, ColorReset)
		fmt.Printf("%s  Please ensure the path is correct and the file exists, or use the --scap-content flag.%s\n", ColorYellow, ColorReset)
		profile.Results.ExitCode = 1
		profile.Results.EndTime = time.Now()
		return
	}

	resultsFile := filepath.Join(oscalDir, "oscap-results-"+profile.Profile+".xml")
	reportFile := filepath.Join(oscalDir, "oscap-report-"+profile.Profile+".html")

	// Setup paths for additional formats
	jsonFile := filepath.Join(oscalDir, "oscap-results-"+profile.Profile+".json")
	markdownFile := filepath.Join(oscalDir, "oscap-results-"+profile.Profile+".md")
	pdfFile := filepath.Join(oscalDir, "oscap-results-"+profile.Profile+".pdf")

	profile.Results.XMLPath = resultsFile
	profile.Results.HTMLPath = reportFile
	profile.Results.JSONPath = jsonFile
	profile.Results.MarkdownPath = markdownFile
	profile.Results.PDFPath = pdfFile // PDF generation is not implemented, but path is stored

	var cmd *exec.Cmd
	args := []string{
		"xccdf", "eval",
		"--profile", profile.ProfileID,
		"--results", resultsFile, // This will be translated for WSL if needed
		"--report", reportFile, // This will be translated for WSL if needed
		scapContentFile, // This will be translated for WSL if needed
	}

	if runtime.GOOS == "windows" {
		fmt.Printf("%sAttempting to run 'oscap' via WSL on Windows. Ensure WSL and OpenSCAP are installed in your WSL distribution.%s\n", ColorYellow, ColorReset)

		// Remove unused variables
		// absResultsFile, errResults := filepath.Abs(resultsFile)
		// absReportFile, errReport := filepath.Abs(reportFile)
		absScapContentFile, errScapContent := filepath.Abs(scapContentFile)

		if errScapContent != nil {
			fmt.Printf("%sError converting file paths to absolute for WSL: %v%s\n", ColorRed, errScapContent, ColorReset)
			profile.Results.ExitCode = 1
			profile.Results.EndTime = time.Now()
			return
		}

		args[7] = convertWindowsPathToWSL(absScapContentFile)
		cmd = exec.Command("wsl", append([]string{"oscap"}, args...)...)
	} else {
		cmd = exec.Command("oscap", args...)
	}

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	fmt.Printf("%sRunning OpenSCAP for %s profile...%s\n", profile.Color, profile.Profile, ColorReset)
	err := cmd.Run()
	profile.Results.EndTime = time.Now()

	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			// Command started but returned non-zero exit code
			profile.Results.ExitCode = exitErr.ExitCode()
			fmt.Printf("%s  oscap command failed. Stderr: %s%s\n", ColorRed, stderr.String(), ColorReset)
		} else {
			// Command could not be started (e.g., "oscap" not found, or "wsl" not found)
			profile.Results.ExitCode = 1
			fmt.Printf("%s  Failed to run oscap command: %v. Stderr: %s%s\n", ColorRed, err, stderr.String(), ColorReset)
		}
	} else {
		profile.Results.ExitCode = 0
	}

	// Parse results and convert to other formats
	if fileExists(resultsFile) {
		fmt.Printf("%sProfile [%s]: Parsing XML results from %s...%s\n", profile.Color, profile.Profile, filepath.Base(resultsFile), ColorReset)
		counts := parseResultCounts(resultsFile)
		if counts != nil {
			profile.Results.Pass = counts["pass"]
			profile.Results.Fail = counts["fail"]
			profile.Results.NotApplicable = counts["notapplicable"]
			profile.Results.Total = counts["total"]
		} else {
			fmt.Printf("%sProfile [%s]: Warning - could not parse result counts from %s.%s\n", ColorYellow, profile.Profile, filepath.Base(resultsFile), ColorReset)
		}

		// --- Stylized per-control progress bar (verbose only) ---
		if verbose {
			controls, err := extractControlsVerbose(resultsFile)
			if err == nil && len(controls) > 0 {
				fmt.Printf("%s\nListing all tested controls (verbose):%s\n", ColorCyan, ColorReset)
				printControlVerbose(controls)
			}
		}

		fmt.Printf("%sProfile [%s]: Converting %s to JSON (%s)...%s\n", profile.Color, profile.Profile, filepath.Base(resultsFile), filepath.Base(jsonFile), ColorReset)
		if err := convertXMLtoJSON(resultsFile, jsonFile); err != nil {
			fmt.Printf("%sError converting XML to JSON: %v%s\n", ColorRed, err, ColorReset)
		}

		fmt.Printf("%sProfile [%s]: Converting %s to Markdown (%s)...%s\n", profile.Color, profile.Profile, filepath.Base(resultsFile), filepath.Base(markdownFile), ColorReset)
		if err := convertXMLtoMarkdown(resultsFile, markdownFile, profile); err != nil {
			fmt.Printf("%sError converting XML to Markdown: %v%s\n", ColorRed, err, ColorReset)
		}

		// Make user-readable copies
		userResultsFile := filepath.Join(oscalDir, "user-readable-results-"+profile.Profile+".xml")
		userReportFile := filepath.Join(oscalDir, "user-readable-report-"+profile.Profile+".html")

		originalScanExitCode := profile.Results.ExitCode // Preserve original oscap exit code

		if err := os.Rename(resultsFile, userResultsFile); err != nil {
			fmt.Printf("%sError renaming %s to %s: %v%s\n", ColorRed, resultsFile, userResultsFile, err, ColorReset)
			// Do not mark the entire scan as failed if oscap succeeded, but log the rename issue.
			// The XMLPath will remain the original if rename fails.
		} else {
			profile.Results.XMLPath = userResultsFile // Update path to user-readable XML
			fmt.Printf("%sProfile [%s]: Renamed results to %s%s\n", profile.Color, profile.Profile, userResultsFile, ColorReset)
		}

		if err := os.Rename(reportFile, userReportFile); err != nil {
			fmt.Printf("%sError renaming %s to %s: %v%s\n", ColorRed, reportFile, userReportFile, err, ColorReset)
			// Do not mark the entire scan as failed if oscap succeeded, but log the rename issue.
			// The HTMLPath will remain the original if rename fails.
		} else {
			profile.Results.HTMLPath = userReportFile // Update path to user-readable HTML
			fmt.Printf("%sProfile [%s]: Renamed report to %s%s\n", profile.Color, profile.Profile, userReportFile, ColorReset)
		}
		profile.Results.ExitCode = originalScanExitCode // Restore original oscap exit code
	}

	// === PDF/Markdown Export via Puppeteer (oscal-export.js) ===
	// Only attempt if Node.js is available and HTML report exists
	if profile.Results.HTMLPath != "" && fileExists(profile.Results.HTMLPath) {
		exportScript := "../tools/oscal-export.js"
		if !fileExists(exportScript) {
			fmt.Printf("%s  Export script not found at %s. Skipping PDF export.%s\n", ColorYellow, exportScript, ColorReset)
			return
		}
		// Check if Puppeteer is installed
		puppeteerCheck := exec.Command("node", "-e", "require('puppeteer')")
		if err := puppeteerCheck.Run(); err != nil {
			fmt.Printf("%s  Puppeteer is not installed. Run 'npm install puppeteer' in your project root to enable PDF export.%s\n", ColorYellow, ColorReset)
			return
		}
		fmt.Printf("%sProfile [%s]: Exporting PDF/Markdown via Puppeteer...%s\n", profile.Color, profile.Profile, ColorReset)
		var exportCmd *exec.Cmd
		if runtime.GOOS == "windows" {
			exportCmd = exec.Command("node", exportScript)
			exportCmd.Dir = oscalDir + "/.." // scripts dir
		} else {
			exportCmd = exec.Command("node", exportScript)
			exportCmd.Dir = oscalDir + "/.." // scripts dir
		}
		var exportOut, exportErr bytes.Buffer
		exportCmd.Stdout = &exportOut
		exportCmd.Stderr = &exportErr
		err := exportCmd.Run()
		if err != nil {
			fmt.Printf("%s  PDF/Markdown export failed: %v%s\n%s\n", ColorYellow, err, ColorReset, exportErr.String())
		} else {
			fmt.Printf("%s  PDF/Markdown export complete.%s\n", ColorGreen, ColorReset)
			if exportOut.Len() > 0 {
				fmt.Printf("%s", exportOut.String())
			}
		}
	}
}

// TrueNorth scan handler for custom JSON validation
func runTrueNorthScan(profile *OscalScan, oscalDir string) {
	fmt.Printf("%s=== Running TrueNorth OSCAL JSON validation ===%s\n",
		ColorBold+profile.Color, ColorReset)
	profile.Results.StartTime = time.Now()

	scriptName := "truenorth-oscal-test.sh"
	scriptPath := "./" + scriptName // Assumes script is in the current working directory

	if fileExists(scriptPath) {
		var cmd *exec.Cmd
		if runtime.GOOS == "windows" {
			fmt.Printf("%sAttempting to run '%s' via WSL on Windows. Ensure WSL and bash are available.%s\n", ColorYellow, scriptName, ColorReset)
			cmd = exec.Command("wsl", "bash", scriptPath)
		} else {
			cmd = exec.Command("/bin/bash", scriptPath)
		}

		var stdout, stderr bytes.Buffer
		cmd.Stdout = &stdout
		cmd.Stderr = &stderr

		fmt.Printf("%sProfile [%s]: Running script %s...%s\n", profile.Color, profile.Profile, scriptPath, ColorReset)
		err := cmd.Run()
		profile.Results.EndTime = time.Now()

		if stdout.Len() > 0 {
			fmt.Printf("%s  Stdout: %s%s\n", ColorWhite, stdout.String(), ColorReset)
		}
		if stderr.Len() > 0 {
			fmt.Printf("%s  Stderr: %s%s\n", ColorRed, stderr.String(), ColorReset)
		}

		if err != nil {
			if exitErr, ok := err.(*exec.ExitError); ok {
				profile.Results.ExitCode = exitErr.ExitCode()
			} else {
				profile.Results.ExitCode = 1
				fmt.Printf("%s  Failed to start TrueNorth script: %v%s\n", ColorRed, err, ColorReset)
			}
		} else {
			profile.Results.ExitCode = 0
		}
	} else {
		// Create a sample TrueNorth JSON result
		fmt.Printf("%sProfile [%s]: Script '%s' not found. Generating sample JSON results.%s\n", ColorYellow, profile.Profile, scriptPath, ColorReset)
		sampleJSON := `{
  "version": "1.0",
  "profile": "` + profile.Profile + `",
  "results": {
    "pass": 10,
    "fail": 2,
    "not_applicable": 1,
    "total": 13
  },
  "controls": [
    {
      "id": "C1",
      "result": "pass",
      "time": "2023-10-01T12:00:00Z",
      "description": "Sample control 1",
      "message": "Control passed."
    },
    {
      "id": "C2",
      "result": "fail",
      "time": "2023-10-01T12:05:00Z",
      "description": "Sample control 2",
      "message": "Control failed. See details."
    }
  ]
}`

		sampleFile := filepath.Join(oscalDir, "sample-truenorth-results.json")
		if err := os.WriteFile(sampleFile, []byte(sampleJSON), 0644); err != nil {
			fmt.Printf("%sError writing sample JSON results to %s: %v%s\n", ColorRed, sampleFile, err, ColorReset)
		} else {
			fmt.Printf("%sSample TrueNorth results written to %s%s\n", ColorGreen, sampleFile, ColorReset)
		}
	}

	fmt.Printf("%sTrueNorth validation completed with exit code %d%s\n",
		profile.Color, profile.Results.ExitCode, ColorReset)
}

// Print overall progress bar with vibrant color and profile name
func printOverallProgress(current, total int, profileName string, final bool) {
	progressMutex.Lock()
	defer progressMutex.Unlock()

	percentage := 0.0
	if total > 0 {
		percentage = (float64(current) / float64(total)) * 100
	}

	barLength := 30 // Length of the progress bar
	filledLength := 0
	if total > 0 {
		filledLength = int(float64(barLength) * float64(current) / float64(total))
	}

	bar := strings.Repeat("=", filledLength) + strings.Repeat("-", barLength-filledLength)

	// Vibrant color cycling for profile name
	profileColors := []string{ColorCyan, ColorGreen, ColorYellow, ColorPurple, ColorBlue, ColorWhite}
	colorIdx := (current + len(profileName)) % len(profileColors)
	profileColor := profileColors[colorIdx]

	// \r moves cursor to beginning of line. Pad with spaces to clear previous, longer lines.
	clearLine := strings.Repeat(" ", 80) // Increased padding to ensure full line clear
	fmt.Printf("\r%s", clearLine)        // Clear the line first
	fmt.Printf("\r%sOverall Progress: [%s%s%s] [%s] %d/%d (%.1f%%)%s", ColorBold, profileColor, profileName, ColorReset, bar, current, total, percentage, ColorReset)

	if final && current == total { // Ensure it's truly the final call and all are done
		fmt.Printf(" %sAll scans complete.%s\n", ColorGreen, ColorReset) // Newline and final message
	}
}

// After all scans, update oscal-profiles.json with results and timestamps
func updateOscalProfilesJSON(results []OscalScan, oscalProfilesPath string) {
	if oscalProfilesPath == "" {
		return
	}
	// Read existing file
	var profilesData struct {
		Profiles []map[string]interface{} `json:"profiles"`
	}
	data, err := os.ReadFile(oscalProfilesPath)
	if err == nil {
		_ = json.Unmarshal(data, &profilesData)
	}
	// Update or add each profile
	for _, r := range results {
		found := false
		for _, p := range profilesData.Profiles {
			if p["name"] == r.Profile {
				p["last_scan"] = time.Now().Format(time.RFC3339)
				p["pass"] = r.Results.Pass
				p["fail"] = r.Results.Fail
				p["notapplicable"] = r.Results.NotApplicable
				p["total"] = r.Results.Total
				p["updated"] = time.Now().Format(time.RFC3339)
				found = true
				break
			}
		}
		if !found {
			profilesData.Profiles = append(profilesData.Profiles, map[string]interface{}{
				"name":          r.Profile,
				"last_scan":     time.Now().Format(time.RFC3339),
				"pass":          r.Results.Pass,
				"fail":          r.Results.Fail,
				"notapplicable": r.Results.NotApplicable,
				"total":         r.Results.Total,
				"updated":       time.Now().Format(time.RFC3339),
			})
		}
	}
	// Write back
	out, _ := json.MarshalIndent(profilesData, "", "  ")
	_ = os.WriteFile(oscalProfilesPath, out, 0644)
}

func generateSummaryReport(results []OscalScan, oscalDir string) {
	summaryFile := filepath.Join(oscalDir, "oscal-summary.md")

	md := "# OSCAL Scan Summary Report\n\n"
	md += fmt.Sprintf("**Report Generated:** %s\n\n", time.Now().Format("2006-01-02 15:04:05"))
	md += "## Profile Results\n\n"
	md += "| Profile | Status | Pass | Fail | N/A | Total | Duration | Created | Updated | Reference | Note |\n"
	md += "|---------|--------|------|------|-----|-------|----------|---------|---------|-----------|------|\n"

	for _, result := range results {
		status := "❌ Failed"
		if result.Results.ExitCode == 0 {
			status = "✅ Passed"
		} else if result.Results.ExitCode == 2 {
			status = "⚠️ Warnings"
		}

		duration := result.Results.EndTime.Sub(result.Results.StartTime).Seconds()

		md += fmt.Sprintf("| %s | %s | %d | %d | %d | %d | %.1fs | %s | %s | %s | %s |\n",
			result.Profile,
			status,
			result.Results.Pass,
			result.Results.Fail,
			result.Results.NotApplicable,
			result.Results.Total,
			duration,
			result.Results.Created.Format(time.RFC3339),
			result.Results.Updated.Format(time.RFC3339),
			result.Reference,
			result.Note)
	}

	md += "\n## System Information\n\n"
	md += "| Metric | Value |\n"
	md += "|--------|-------|\n"

	// Add system information
	switch runtime.GOOS {
	case "linux":
		if cpuInfo, err := exec.Command("nproc").Output(); err == nil {
			md += fmt.Sprintf("| CPU Cores | %s |\n", strings.TrimSpace(string(cpuInfo)))
		} else {
			fmt.Printf("%sFailed to get CPU cores (nproc): %v%s\n", ColorYellow, err, ColorReset)
		}

		if memInfo, err := exec.Command("free", "-m").Output(); err == nil {
			lines := strings.Split(string(memInfo), "\n")
			if len(lines) > 1 { // Look for the "Mem:" line
				fields := strings.Fields(lines[1])
				if len(fields) > 1 {
					md += fmt.Sprintf("| Total Memory | %s MB |\n", fields[1])
				}
			}
		} else {
			fmt.Printf("%sFailed to get memory info (free -m): %v%s\n", ColorYellow, err, ColorReset)
		}
	case "windows":
		// %NUMBER_OF_PROCESSORS% is an environment variable
		if numProc := os.Getenv("NUMBER_OF_PROCESSORS"); numProc != "" {
			md += fmt.Sprintf("| CPU Cores | %s |\n", numProc)
		} else {
			// Fallback using WMIC if env var is not set (less common)
			if cpuInfo, err := exec.Command("wmic", "cpu", "get", "NumberOfLogicalProcessors").Output(); err == nil {
				lines := strings.Split(strings.TrimSpace(string(cpuInfo)), "\n")
				if len(lines) > 1 { // Output is like "NumberOfLogicalProcessors \n16 "
					md += fmt.Sprintf("| CPU Cores | %s |\n", strings.TrimSpace(lines[len(lines)-1]))
				}
			} else {
				fmt.Printf("%sFailed to get CPU cores (wmic): %v%s\n", ColorYellow, err, ColorReset)
			}
		}

		if memInfo, err := exec.Command("wmic", "OS", "get", "TotalVisibleMemorySize").Output(); err == nil {
			lines := strings.Split(strings.TrimSpace(string(memInfo)), "\n")
			if len(lines) > 1 { // Output is like "TotalVisibleMemorySize \n16777216 " (in KB)
				kbStr := strings.TrimSpace(lines[len(lines)-1])
				md += fmt.Sprintf("| Total Memory | %s KB |\n", kbStr) // User can convert to MB if desired
			}
		} else {
			fmt.Printf("%sFailed to get memory info (wmic): %v%s\n", ColorYellow, err, ColorReset)
		}
	}

	// Hostname is cross-platform using os.Hostname()
	if host, err := os.Hostname(); err == nil {
		md += fmt.Sprintf("| Hostname | %s |\n", host)
	} else {
		fmt.Printf("%sFailed to get hostname: %v%s\n", ColorYellow, err, ColorReset)
	}

	if err := os.WriteFile(summaryFile, []byte(md), 0644); err != nil {
		fmt.Printf("%sError writing summary report to %s: %v%s\n", ColorRed, summaryFile, err, ColorReset)
	}
	fmt.Printf("%sSummary report generated: %s%s\n", ColorCyan, summaryFile, ColorReset)
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

func fileExists(filename string) bool {
	_, err := os.Stat(filename)
	return err == nil
}

func getDefaultScapContentPath() string {
	if runtime.GOOS == "windows" {
		// No universal default for Windows; user should specify.
		// An empty string will trigger the check in runOscapScan.
		return ""
	}
	// Default for Linux-like systems (adjust if your primary Linux target differs)
	return "/usr/share/xml/scap/ssg/content/ssg-fedora-ds.xml"
}

// Control represents a single security control result
type Control struct {
	ID          string
	Result      string
	Description string
	Message     string
}

// extractControlsVerbose extracts control information from XML results file
func extractControlsVerbose(xmlPath string) ([]Control, error) {
	data, err := ioutil.ReadFile(xmlPath)
	if err != nil {
		return nil, err
	}

	var result struct {
		XMLName    xml.Name `xml:"Benchmark"`
		TestResult struct {
			RuleResults []struct {
				IDRef   string `xml:"idref,attr"`
				Result  string `xml:"result"`
				Message string `xml:"message"`
			} `xml:"rule-result"`
		} `xml:"TestResult"`
	}

	if err := xml.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	var controls []Control
	for _, rr := range result.TestResult.RuleResults {
		controls = append(controls, Control{
			ID:          rr.IDRef,
			Result:      rr.Result,
			Description: "", // Could be extracted from rule definitions if needed
			Message:     rr.Message,
		})
	}

	return controls, nil
}

// printControlVerbose prints detailed control information in a formatted way
func printControlVerbose(controls []Control) {
	if len(controls) == 0 {
		fmt.Printf("%sNo controls found%s\n", ColorYellow, ColorReset)
		return
	}

	fmt.Printf("%sControl Details:%s\n", ColorBold+ColorCyan, ColorReset)

	passCount := 0
	failCount := 0
	naCount := 0

	for i, control := range controls {
		var statusColor string
		var statusSymbol string

		switch control.Result {
		case "pass":
			statusColor = ColorGreen
			statusSymbol = "✓"
			passCount++
		case "fail":
			statusColor = ColorRed
			statusSymbol = "✗"
			failCount++
		case "notapplicable":
			statusColor = ColorYellow
			statusSymbol = "○"
			naCount++
		default:
			statusColor = ColorWhite
			statusSymbol = "?"
		}

		fmt.Printf("%s%s %s%s %s%s\n",
			statusColor, statusSymbol, control.ID, ColorReset,
			ColorWhite, control.Result)

		if control.Message != "" && len(control.Message) > 0 {
			fmt.Printf("    %s%s%s\n", ColorCyan, control.Message, ColorReset)
		}

		// Add a separator every 10 controls for readability
		if (i+1)%10 == 0 && i+1 < len(controls) {
			fmt.Printf("%s%s%s\n", ColorBold, strings.Repeat("-", 50), ColorReset)
		}
	}

	fmt.Printf("\n%sSummary: %s%d passed%s, %s%d failed%s, %s%d N/A%s\n",
		ColorBold, ColorGreen, passCount, ColorReset,
		ColorRed, failCount, ColorReset,
		ColorYellow, naCount, ColorReset)
}

// convertWindowsPathToWSL converts a Windows path (e.g., C:\Users\Me\file.txt)
// to a WSL path (e.g., /mnt/c/Users/Me/file.txt).
// This is a simplified converter and might need adjustments for edge cases.
func convertWindowsPathToWSL(winPath string) string {
	if !filepath.IsAbs(winPath) {
		// If it's not absolute, WSL might resolve it relative to its CWD,
		// which might be the same as the Go program's CWD.
		// However, for clarity and robustness, absolute paths are preferred.
		// For now, return as is, but ideally, convert to absolute first.
		return winPath
	}
	vol := filepath.VolumeName(winPath) // e.g., "C:"
	if len(vol) >= 2 && vol[1] == ':' {
		// Windows drive letter (e.g., "C:")
		driveLetter := strings.ToLower(string(vol[0]))
		return "/mnt/" + driveLetter + filepath.ToSlash(winPath[len(vol):])
	}
	return winPath // Not a typical Windows drive path, return as is
}

// convertXMLtoJSON converts an OSCAP XML results file to JSON format
func convertXMLtoJSON(xmlPath, jsonPath string) error {
	xmlData, err := os.ReadFile(xmlPath)
	if err != nil {
		return fmt.Errorf("failed to read XML file: %v", err)
	}

	var result map[string]interface{}
	if err := xml.Unmarshal(xmlData, &result); err != nil {
		return fmt.Errorf("failed to parse XML: %v", err)
	}

	jsonData, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %v", err)
	}

	if err := os.WriteFile(jsonPath, jsonData, 0644); err != nil {
		return fmt.Errorf("failed to write JSON file: %v", err)
	}

	return nil
}

// parseResultCounts parses the XML results file and returns a map of result counts
func parseResultCounts(xmlPath string) map[string]int {
	data, err := os.ReadFile(xmlPath)
	if err != nil {
		return nil
	}

	var result OscalResults
	if err := xml.Unmarshal(data, &result); err != nil {
		return nil
	}

	counts := map[string]int{
		"pass":          0,
		"fail":          0,
		"notapplicable": 0,
		"total":         0,
	}

	for _, ruleResult := range result.TestResult.RuleResults {
		switch ruleResult.Result {
		case "pass":
			counts["pass"]++
		case "fail":
			counts["fail"]++
		case "notapplicable":
			counts["notapplicable"]++
		}
		counts["total"]++
	}

	return counts
}

// convertXMLtoMarkdown converts an OSCAP XML results file to Markdown format
func convertXMLtoMarkdown(xmlPath, markdownPath string, profile *OscalScan) error {
	xmlData, err := os.ReadFile(xmlPath)
	if err != nil {
		return fmt.Errorf("failed to read XML file: %v", err)
	}

	var result OscalResults
	if err := xml.Unmarshal(xmlData, &result); err != nil {
		return fmt.Errorf("failed to parse XML: %v", err)
	}

	md := fmt.Sprintf("# OSCAL Scan Results - %s Profile\n\n", profile.Profile)
	md += fmt.Sprintf("**Profile ID:** %s\n\n", profile.ProfileID)
	md += fmt.Sprintf("**Description:** %s\n\n", profile.Description)

	if profile.Reference != "" {
		md += fmt.Sprintf("**Reference:** %s\n\n", profile.Reference)
	}

	if profile.Note != "" {
		md += fmt.Sprintf("**Note:** %s\n\n", profile.Note)
	}

	md += fmt.Sprintf("**Scan Date:** %s\n\n", profile.Results.StartTime.Format("2006-01-02 15:04:05"))
	md += fmt.Sprintf("**Duration:** %.1f seconds\n\n", profile.Results.EndTime.Sub(profile.Results.StartTime).Seconds())

	md += "## Summary\n\n"
	md += "| Result | Count |\n"
	md += "|--------|-------|\n"
	md += fmt.Sprintf("| Pass | %d |\n", profile.Results.Pass)
	md += fmt.Sprintf("| Fail | %d |\n", profile.Results.Fail)
	md += fmt.Sprintf("| Not Applicable | %d |\n", profile.Results.NotApplicable)
	md += fmt.Sprintf("| **Total** | **%d** |\n\n", profile.Results.Total)

	md += "## Rule Results\n\n"
	for i, ruleResult := range result.TestResult.RuleResults {
		status := "❓"
		switch ruleResult.Result {
		case "pass":
			status = "✅"
		case "fail":
			status = "❌"
		case "notapplicable":
			status = "⚪"
		}
		md += fmt.Sprintf("%d. %s %s\n", i+1, status, ruleResult.Result)
	}

	if err := os.WriteFile(markdownPath, []byte(md), 0644); err != nil {
		return fmt.Errorf("failed to write markdown file: %v", err)
	}

	return nil
}
