package main

import (
	"craft-fusion/craft-go/handlers"
	"log"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	// Set trusted proxies
	router.SetTrustedProxies([]string{"127.0.0.1"})

	//enable CORS from localhost:4200 and jeffreysanford.us
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:4200, https://jeffreysanford.us")
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

	log.Println("Starting Go Backend on :4000")
	router.Run(":4000")
}
