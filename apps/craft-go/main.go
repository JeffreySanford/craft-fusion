package main

import (
	"craft-fusion/craft-go/handlers"
	"fmt"
	"log"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	// Set trusted proxies
	// router.SetTrustedProxies([]string{"127.0.0.1"})

	// Enable CORS from localhost:4200 and jeffreysanford.us
	router.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin == "http://localhost:4200" || origin == "https://jeffreysanford.us" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Enable Gzip Compression
	router.Use(gzip.Gzip(gzip.DefaultCompression))

	// Health Check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "OK"})
	})

	// User Records API
	router.GET("/records", handlers.GetRecordsHandler)
	router.GET("/records/generate", handlers.GenerateRecordsHandler) // Ensure the correct handler function name
	router.GET("/records/time", handlers.GetCreationTimeHandler)     // Register the new endpoint

	// Log all registered routes
	for _, route := range router.Routes() {
		fullURL := fmt.Sprintf("http://localhost:4000%s", route.Path)
		log.Printf("Endpoint: %s %s", route.Method, fullURL)
	}

	log.Println("Starting Go Backend on :4000")
	router.Run(":4000")
}
