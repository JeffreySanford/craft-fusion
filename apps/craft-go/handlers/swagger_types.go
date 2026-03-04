package handlers

import "craft-fusion/craft-go/models"

// ErrorResponse describes a generic API error payload.
type ErrorResponse struct {
	Error string `json:"error" example:"Invalid limit parameter"`
}

// HealthResponse describes the API health payload.
type HealthResponse struct {
	Status string `json:"status" example:"OK"`
}

// RecordsResponse describes the record list payload.
type RecordsResponse struct {
	Records []models.UserRecord `json:"records"`
}

// GenerationTimeResponse describes record generation timing in milliseconds.
type GenerationTimeResponse struct {
	GenerationTime int64 `json:"generationTime" example:"42"`
}
