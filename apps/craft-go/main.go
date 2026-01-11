package main

import (
	"craft-fusion/craft-go/handlers"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"     // swagger embed files
	ginSwagger "github.com/swaggo/gin-swagger" // gin-swagger middleware

	docs "craft-fusion/craft-go/docs"

	"github.com/gin-contrib/cors"
)

// @title Craft Fusion API
// @version 1.0
// @description This is a sample server for Craft Fusion.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:4000
// @BasePath /
func main() {
	router := gin.Default()

	// Resolve server port from environment (default 4000)
	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	// Resolve bind address from environment (BIND_ADDR).
	// Default to loopback for development to avoid Windows firewall prompts.
	bindHost := os.Getenv("BIND_ADDR")
	if bindHost == "" {
		bindHost = "127.0.0.1"
	}

	// Middleware: CORS
	router.Use(func(c *gin.Context) {
		allowedOrigins := map[string]bool{
			"http://localhost:4200":         true,
			"https://jeffreysanford.us":     true,
			"https://www.jeffreysanford.us": true,
		}
		origin := c.Request.Header.Get("Origin")
		if allowedOrigins[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			log.Printf("CORS: Unauthorized origin %s", origin)
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400") // Cache preflight response for 24 hours

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Middleware: Gzip Compression
	router.Use(gzip.Gzip(gzip.DefaultCompression))

	// Middleware: CORS with gin-contrib/cors
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://jeffreysanford.us", "http://localhost:3000", "http://localhost:4200"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))
	// Health Check
	router.GET("/api-go/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "OK"})
	})

	// Add /health endpoint for deployment health checks
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "OK"})
	})

	// User Records API
	router.GET("/api-go/records", handlers.GetRecordsHandler)
	router.GET("/api-go/records/generate", handlers.GenerateRecordsHandler)
	router.GET("/api-go/records/time", handlers.GetCreationTimeHandler)
	router.GET("/api-go/records/:UID", handlers.GetRecordByUIDHandler)

	// --- Add these for frontend compatibility ---
	// If this Go server is ever hit for /api/records/generate, return 501 Not Implemented
	router.GET("/api/records/generate", handlers.NotImplementedHandler)
	router.GET("/api/records/time", handlers.GetCreationTimeHandler)
	// Add /api/records and /api/records/:UID for Angular compatibility
	router.GET("/api/records", handlers.GetRecordsHandler)
	router.GET("/api/records/:UID", handlers.GetRecordByUIDHandler)
	// -------------------------------------------

	// Swagger
	// Dynamically set the host to the current port to avoid mismatches in dev
	// If the server is bound to 0.0.0.0 use localhost for Swagger UI links
	swaggerHost := bindHost
	if swaggerHost == "0.0.0.0" || swaggerHost == "" {
		swaggerHost = "localhost"
	}
	docs.SwaggerInfo.Host = fmt.Sprintf("%s:%s", swaggerHost, port)
	// Reviewer-friendly UI: collapse models/docs, minimize interactivity
	swaggerHandler := ginSwagger.WrapHandler(
		swaggerFiles.Handler,
		ginSwagger.DocExpansion("none"),
		ginSwagger.DefaultModelsExpandDepth(-1),
	)
	swaggerIndexQuery := "deepLinking=true&displayRequestDuration=true&docExpansion=none&defaultModelsExpandDepth=-1&supportedSubmitMethods=%5B%5D"
	// Provide two paths for convenience
	// Optional: redirect bare /swagger to index with UI options to minimize interactivity
	router.GET("/swagger", func(c *gin.Context) {
		// supportedSubmitMethods=[] hides "Try it out" in Swagger UI
		c.Redirect(302, "/swagger/index.html?"+swaggerIndexQuery)
	})
	router.GET("/api-go/swagger", func(c *gin.Context) {
		c.Redirect(302, "/api-go/swagger/index.html?"+swaggerIndexQuery)
	})
	router.GET("/swagger/*any", func(c *gin.Context) {
		if c.Param("any") == "" || c.Param("any") == "/" {
			c.Redirect(302, "/swagger/index.html?"+swaggerIndexQuery)
			return
		}
		swaggerHandler(c)
	})
	router.GET("/api-go/swagger/*any", func(c *gin.Context) {
		if c.Param("any") == "" || c.Param("any") == "/" {
			c.Redirect(302, "/api-go/swagger/index.html?"+swaggerIndexQuery)
			return
		}
		swaggerHandler(c)
	})

	// Log all registered routes with the resolved port
	for _, route := range router.Routes() {
		fullURL := fmt.Sprintf("http://localhost:%s%s", port, route.Path)
		log.Printf("Endpoint: %s %s", route.Method, fullURL)
	}

	log.Printf("Starting Go Backend on %s:%s", bindHost, port)

	// Server Configuration
	srv := &http.Server{
		Addr:         bindHost + ":" + port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	// Start the Server
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("listen: %s\n", err)
	}
}
