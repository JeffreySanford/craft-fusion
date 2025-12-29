package handlers

import (
	"craft-fusion/craft-go/models"
	"net/http"
	"strconv"

	"github.com/brianvoe/gofakeit/v6"
	"github.com/gin-gonic/gin"
)

// GenerateNewRecordsHandler handles the generation of new records
func GenerateNewRecordsHandler(c *gin.Context) {
	countStr := c.Query("count")
	count, err := strconv.Atoi(countStr)
	if err != nil || count <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid count parameter"})
		return
	}

	// Logic to generate records
	records := createRecords(count)

	c.JSON(http.StatusOK, records)
}

// Mock function to generate records
func createRecords(count int) []models.UserRecord {
	gofakeit.Seed(0)
	records := make([]models.UserRecord, count)
	for i := 0; i < count; i++ {
		records[i] = models.UserRecord{
			UID:       strconv.Itoa(gofakeit.Number(100000000, 999999999)),
			FirstName: gofakeit.FirstName(),
			LastName:  gofakeit.LastName(),
			Address: models.Address{
				Street:  gofakeit.Street(),
				City:    gofakeit.City(),
				State:   gofakeit.State(),
				Zipcode: gofakeit.Zip(),
			},
			Phone: models.Phone{
				Number:       gofakeit.Phone(),
				AreaCode:     strconv.Itoa(gofakeit.Number(200, 999)),
				HasExtension: gofakeit.Bool(),
				Extension:    func() *string { ext := strconv.Itoa(gofakeit.Number(1000, 9999)); return &ext }(),
			},
			Salary: []models.Salary{
				{Amount: float64(gofakeit.Number(50000, 100000)), Year: 2021},
				{Amount: float64(gofakeit.Number(60000, 120000)), Year: 2022},
				{Amount: float64(gofakeit.Number(70000, 140000)), Year: 2023},
			},
			TotalHouseholdIncome: gofakeit.Number(1000000, 100000000),
		}
	}
	return records
}
