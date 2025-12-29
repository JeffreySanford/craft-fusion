package services

import (
	"craft-fusion/craft-go/models"
	"craft-fusion/craft-go/repository"
)

// GetRecords retrieves mock records.
func GetRecords(limit int) []models.Record {
	return repository.GenerateMockRecords(limit)
}

// GetRecordByUID retrieves a mock record by UID.
func GetRecordByUID(uid string) (models.Record, error) {
	return repository.FindRecordByUID(uid)
}
