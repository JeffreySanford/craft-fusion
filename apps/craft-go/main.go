package main

import (
	"craft-fusion/craft-go/handlers"
	"log"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	// Enable Gzip Compression
	router.Use(gzip.Gzip(gzip.DefaultCompression))

	// Health Check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "OK"})
	})

	// User Records API
	router.GET("/records", handlers.GetRecordsHandler)

	log.Println("Starting Go Backend on :4000")
	router.Run(":4000")
}
