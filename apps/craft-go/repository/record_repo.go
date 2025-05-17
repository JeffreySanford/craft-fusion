package repository

import (
	"craft-fusion/craft-go/models"
	"errors"
	"strconv"
	"sync"

	"github.com/brianvoe/gofakeit/v6"
)

var (
	records     []models.Record
	recordsLock sync.RWMutex
)

// GenerateMockRecords generates a slice of mock records and stores them in memory.
func GenerateMockRecords(limit int) []models.Record {
	recordsLock.Lock()
	defer recordsLock.Unlock()

	records = make([]models.Record, limit)
	gofakeit.Seed(0)

	for i := 0; i < limit; i++ {
		extension := gofakeit.Number(1000, 9999)
		extensionStr := strconv.Itoa(extension)
		records[i] = models.Record{
			UID:       gofakeit.UUID(),
			FirstName: gofakeit.FirstName(),
			LastName:  gofakeit.LastName(),
			Address: models.Address{
				Street:  gofakeit.StreetName(),
				City:    gofakeit.City(),
				State:   gofakeit.State(),
				Zipcode: gofakeit.Zip(),
			},
			Phone: models.Phone{
				Extension: &extensionStr,
				HasExtension: func() *bool {
					hasExt := gofakeit.Bool()
					return &hasExt
				}(),
			},
			Salary: []models.Company{
				{
					UID:          strconv.Itoa(gofakeit.Number(100000, 999999)),
					EmployeeName: gofakeit.Name(),
					AnnualSalary: gofakeit.Price(50000, 200000),
					CompanyName:  gofakeit.Company(),
					CompanyPosition: func() *string {
						position := gofakeit.JobTitle()
						return &position
					}(),
				},
			},
			TotalHouseholdIncome: gofakeit.Price(100000, 500000),
		}
	}

	return records
}

// FindRecordByUID finds a record by UID in the stored records.
func FindRecordByUID(uid string) (models.Record, error) {
	recordsLock.RLock()
	defer recordsLock.RUnlock()

	for _, record := range records {
		if record.UID == uid {
			return record, nil
		}
	}
	return models.Record{}, errors.New("record not found")
}
