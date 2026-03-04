package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthHandler returns service health status.
// @Summary Health check
// @Description Returns the health status for the Go backend.
// @Tags Health
// @Produce json
// @Success 200 {object} HealthResponse
// @Router /api-go/health [get]
// @Router /health [get]
func HealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{Status: "OK"})
}
