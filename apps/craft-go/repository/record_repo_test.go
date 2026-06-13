package repository

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateMockRecordsReturnsRequestedMaterialTableDataset(t *testing.T) {
	generated := GenerateMockRecords(3)

	require.Len(t, generated, 3)
	for _, record := range generated {
		assert.NotEmpty(t, record.UID)
		assert.NotEmpty(t, record.FirstName)
		assert.NotEmpty(t, record.LastName)
		assert.NotEmpty(t, record.Address.City)
		assert.NotEmpty(t, record.Address.State)
		assert.NotEmpty(t, record.Address.Zipcode)
		require.Len(t, record.Salary, 1)
		assert.Greater(t, record.Salary[0].AnnualSalary, float64(0))
	}
}

func TestGenerateMockRecordsReplacesStoredDataset(t *testing.T) {
	GenerateMockRecords(3)
	replacement := GenerateMockRecords(1)

	require.Len(t, replacement, 1)
	_, err := FindRecordByUID(replacement[0].UID)
	require.NoError(t, err)
}

func TestFindRecordByUID(t *testing.T) {
	generated := GenerateMockRecords(2)

	found, err := FindRecordByUID(generated[0].UID)
	require.NoError(t, err)
	assert.Equal(t, generated[0], found)

	_, err = FindRecordByUID("missing-record")
	assert.EqualError(t, err, "record not found")
}
