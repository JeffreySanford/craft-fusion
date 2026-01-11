package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestGetRecordsHandler(t *testing.T) {
	// Set up the Gin router
	router := gin.Default()
	router.GET("/records", GetRecordsHandler)

	// Create a request to pass to the handler
	req, _ := http.NewRequest("GET", "/records", nil)
	w := httptest.NewRecorder()

	// Perform the request
	router.ServeHTTP(w, req)

	// Check the response
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "expected content")
}
