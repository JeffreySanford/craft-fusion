package services

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetRecordsAndGetRecordByUID(t *testing.T) {
	records := GetRecords(4)
	require.Len(t, records, 4)

	record, err := GetRecordByUID(records[2].UID)
	require.NoError(t, err)
	assert.Equal(t, records[2], record)
}

func TestGetRecordByUIDReturnsErrorForUnknownRecord(t *testing.T) {
	GetRecords(1)

	_, err := GetRecordByUID("unknown")
	assert.EqualError(t, err, "record not found")
}
