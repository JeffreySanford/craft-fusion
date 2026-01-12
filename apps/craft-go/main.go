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
	// Set Gin to release mode if not in development
	if os.Getenv("GIN_MODE") != "debug" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// Resolve server port from environment (default 4000)
	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	// Middleware: Gzip Compression
	router.Use(gzip.Gzip(gzip.DefaultCompression))

	// Middleware: CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:4200", "https://jeffreysanford.us", "https://www.jeffreysanford.us", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "Content-Length", "Accept-Encoding", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           24 * time.Hour,
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
	docs.SwaggerInfo.Host = fmt.Sprintf("localhost:%s", port)
	// Reviewer-friendly UI: collapse models/docs, minimize interactivity
	swaggerHandler := ginSwagger.WrapHandler(
		swaggerFiles.Handler,
		ginSwagger.DocExpansion("none"),
		ginSwagger.DefaultModelsExpandDepth(-1),
	)
	// Provide two paths for convenience
	// Optional: redirect bare /swagger to index with UI options to minimize interactivity
	router.GET("/swagger", func(c *gin.Context) {
		// supportedSubmitMethods=[] hides "Try it out" in Swagger UI
		c.Redirect(302, "/swagger/index.html?deepLinking=true&displayRequestDuration=true&docExpansion=none&defaultModelsExpandDepth=-1&supportedSubmitMethods=%5B%5D")
	})
	router.GET("/swagger/*any", swaggerHandler)
	router.GET("/api-go/swagger/*any", swaggerHandler)

	// Log all registered routes with the resolved port
	for _, route := range router.Routes() {
		fullURL := fmt.Sprintf("http://localhost:%s%s", port, route.Path)
		log.Printf("Endpoint: %s %s", route.Method, fullURL)
	}

	log.Printf("Starting Go Backend on :%s", port)

	// Server Configuration
	srv := &http.Server{
		Addr:         ":" + port,
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
