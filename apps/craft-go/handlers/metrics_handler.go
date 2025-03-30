package handlers

import (
	"log"
	"math/rand"
	"net/http"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
)

// ServerMetrics represents the metrics returned by the Go server
type ServerMetrics struct {
	Name              string    `json:"name"`
	TOL               int64     `json:"tol"` // Time of Last update (timestamp)
	Status            string    `json:"status"`
	Latency           int       `json:"latency"`
	CPU               float64   `json:"cpu"`
	Memory            float64   `json:"memory"`
	Uptime            int64     `json:"uptime"`
	StartTime         time.Time `json:"-"` // Internal use only
	ActiveUsers       uint16    `json:"activeUsers"`
	RequestsPerSecond float32   `json:"requestsPerSecond"`
}

// EndpointStat represents statistics for a specific API endpoint
type EndpointStat struct {
	Hits            int `json:"hits"`
	AvgResponseTime int `json:"avgResponseTime"`
	Errors          int `json:"errors"`
}

// APIPerformance represents API performance metrics
type APIPerformance struct {
	AvgResponseTime    int                     `json:"avgResponseTime"`
	TotalRequests      int                     `json:"totalRequests"`
	SuccessfulRequests int                     `json:"successfulRequests"`
	FailedRequests     int                     `json:"failedRequests"`
	EndpointStats      map[string]EndpointStat `json:"endpointStats"`
}

// ServerMetricsResponse is the full response structure for server metrics
type ServerMetricsResponse struct {
	Name           string         `json:"name"`
	TOL            int64          `json:"tol"`
	Status         string         `json:"status"`
	Latency        int            `json:"latency"`
	ServerMetrics  ServerMetrics  `json:"serverMetrics"`
	APIPerformance APIPerformance `json:"apiPerformance"`
}

var (
	// Global server metrics instance
	serverMetrics = ServerMetrics{
		Name:      "Go Server",
		StartTime: time.Now(),
	}

	// Mock endpoint stats for demo purposes
	endpointStats = map[string]EndpointStat{
		"/api-go/records":          {Hits: 1283, AvgResponseTime: 45, Errors: 12},
		"/api-go/records/generate": {Hits: 257, AvgResponseTime: 120, Errors: 8},
		"/api-go/health":           {Hits: 438, AvgResponseTime: 15, Errors: 0},
	}
)

// GetMetricsHandler handles requests for server metrics
func GetMetricsHandler(c *gin.Context) {
	// Add logging for debugging
	log.Printf("Metrics request received from: %s", c.Request.URL.Path)

	// Update metrics
	serverMetrics.TOL = time.Now().UnixNano() / int64(time.Millisecond)
	serverMetrics.Uptime = int64(time.Since(serverMetrics.StartTime).Seconds())

	// Get memory stats
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	// Calculate memory usage percentage
	serverMetrics.Memory = float64(memStats.Alloc) / float64(memStats.Sys) * 100

	// Simulate CPU usage between 30-70%
	serverMetrics.CPU = 30 + (float64(time.Now().Unix()%10) * 4)

	// Simulate network latency between 40-90ms
	serverMetrics.Latency = 40 + int(time.Now().Unix()%5)*10

	// Determine server status based on metrics
	serverMetrics.Status = calculateServerStatus(serverMetrics.CPU, serverMetrics.Memory, float64(serverMetrics.Latency))

	// Calculate API performance
	totalRequests := 0
	failedRequests := 0
	totalResponseTime := 0

	for _, stat := range endpointStats {
		totalRequests += stat.Hits
		failedRequests += stat.Errors
		totalResponseTime += stat.Hits * stat.AvgResponseTime
	}

	avgResponseTime := 0
	if totalRequests > 0 {
		avgResponseTime = totalResponseTime / totalRequests
	}

	apiPerformance := APIPerformance{
		AvgResponseTime:    avgResponseTime,
		TotalRequests:      totalRequests,
		SuccessfulRequests: totalRequests - failedRequests,
		FailedRequests:     failedRequests,
		EndpointStats:      endpointStats,
	}

	// Create the response
	response := ServerMetricsResponse{
		Name:    serverMetrics.Name,
		TOL:     serverMetrics.TOL,
		Status:  serverMetrics.Status,
		Latency: serverMetrics.Latency,
		ServerMetrics: ServerMetrics{
			CPU:               serverMetrics.CPU,
			Memory:            serverMetrics.Memory,
			Uptime:            serverMetrics.Uptime,
			Name:              "Go Server",
			ActiveUsers:       uint16(rand.Intn(100) + 50),
			RequestsPerSecond: float32(rand.Intn(30) + 10),
		},
		APIPerformance: apiPerformance,
	}

	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET")
	c.JSON(http.StatusOK, response)
}

// GetApiStatusHandler handles requests for API status
func GetApiStatusHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":      "online",
		"timestamp":   time.Now().Format(time.RFC3339),
		"version":     "1.0.0",
		"server":      "Go",
		"environment": getEnvironment(),
	})
}

// Helper function to get environment
func getEnvironment() string {
	// This is a simple implementation, you might want to use a proper environment variable
	env := "development" // Default to development
	// Check for production flag or environment variable if available
	return env
}

// calculateServerStatus determines the server status based on metrics
func calculateServerStatus(cpu, memory, latency float64) string {
	if cpu > 90 || memory > 90 || latency > 300 {
		return "warning"
	} else if cpu > 70 || memory > 80 || latency > 200 {
		return "degraded"
	}
	return "online"
}
