package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"craft-fusion/craft-go/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func performRequest(handler gin.HandlerFunc, method, routePath, requestPath string) *httptest.ResponseRecorder {
	router := gin.New()
	router.Handle(method, routePath, handler)
	request := httptest.NewRequest(method, requestPath, nil)
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	return response
}

func TestGetRecordsHandlerReturnsMockDataset(t *testing.T) {
	response := performRequest(GetRecordsHandler, http.MethodGet, "/records", "/records?limit=3")

	require.Equal(t, http.StatusOK, response.Code)
	var body struct {
		Records []models.Record `json:"records"`
	}
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &body))
	require.Len(t, body.Records, 3)
	assert.NotEmpty(t, body.Records[0].UID)
	assert.NotEmpty(t, body.Records[0].FirstName)
}

func TestGetRecordsHandlerValidatesLimit(t *testing.T) {
	tests := []string{"/records?limit=invalid", "/records?limit=0", "/records?limit=1000001"}

	for _, path := range tests {
		t.Run(path, func(t *testing.T) {
			response := performRequest(GetRecordsHandler, http.MethodGet, "/records", path)
			assert.Equal(t, http.StatusBadRequest, response.Code)
			assert.Contains(t, response.Body.String(), "error")
		})
	}
}

func TestGetRecordByUIDHandler(t *testing.T) {
	listResponse := performRequest(GetRecordsHandler, http.MethodGet, "/records", "/records?limit=1")
	var listBody struct {
		Records []models.Record `json:"records"`
	}
	require.NoError(t, json.Unmarshal(listResponse.Body.Bytes(), &listBody))
	require.Len(t, listBody.Records, 1)

	response := performRequest(GetRecordByUIDHandler, http.MethodGet, "/records/:UID", "/records/"+listBody.Records[0].UID)
	assert.Equal(t, http.StatusOK, response.Code)
	assert.Contains(t, response.Body.String(), listBody.Records[0].UID)

	missing := performRequest(GetRecordByUIDHandler, http.MethodGet, "/records/:UID", "/records/missing")
	assert.Equal(t, http.StatusNotFound, missing.Code)
}

func TestGenerateRecordHandlers(t *testing.T) {
	response := performRequest(GenerateRecordsHandler, http.MethodGet, "/records/generate", "/records/generate?count=2")
	assert.Equal(t, http.StatusOK, response.Code)
	var records []models.UserRecord
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &records))
	assert.Len(t, records, 2)

	invalid := performRequest(GenerateRecordsHandler, http.MethodGet, "/records/generate", "/records/generate?count=invalid")
	assert.Equal(t, http.StatusBadRequest, invalid.Code)

	newRecords := performRequest(GenerateNewRecordsHandler, http.MethodGet, "/records/new", "/records/new?count=2")
	assert.Equal(t, http.StatusOK, newRecords.Code)
}

func TestHealthAndCompatibilityHandlers(t *testing.T) {
	health := performRequest(HealthHandler, http.MethodGet, "/health", "/health")
	assert.Equal(t, http.StatusOK, health.Code)
	assert.JSONEq(t, `{"status":"OK"}`, health.Body.String())

	notImplemented := performRequest(NotImplementedHandler, http.MethodGet, "/records/generate", "/records/generate")
	assert.Equal(t, http.StatusNotImplemented, notImplemented.Code)
	assert.Contains(t, notImplemented.Body.String(), "not implemented")
}
