package repository

import (
	"craft-fusion/craft-go/models"
	"math/rand"
	"strconv"

	"github.com/brianvoe/gofakeit/v6"
)

// GenerateMockRecords generates a slice of mock records.
func GenerateMockRecords(limit int) []models.Record {
	records := make([]models.Record, limit)

	for i := 0; i < limit; i++ {
		extension := strconv.Itoa(rand.Intn(9999))

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
				Number:       gofakeit.Phone(),
				HasExtension: rand.Intn(2) == 1,
				Extension:    &extension,
			},
			Salary: []models.Company{
				{
					Name:   gofakeit.Company(),
					Salary: gofakeit.Price(50000, 200000),
					Title:  gofakeit.JobTitle(),
				},
			},
			TotalHouseholdIncome: gofakeit.Price(100000, 500000),
		}
	}

	return records
}
