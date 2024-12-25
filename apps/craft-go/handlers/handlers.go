package handlers

import (
	"log"
	"net/http"
	"strconv"
	"sync/atomic"
	"time"

	"craft-fusion/craft-go/models"

	"github.com/brianvoe/gofakeit/v6"
	"github.com/gin-gonic/gin"
)

var recordGenerationTime int64

func init() {
	// Initialize the record generation time
	recordGenerationTime = time.Now().Unix()
}

// GenerateRecordsHandler handles the request to generate multiple records
func GenerateRecordsHandler(c *gin.Context) {
	// Parse the count parameter
	count := c.DefaultQuery("count", "10")
	recordCount, err := strconv.Atoi(count)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid count parameter"})
		return
	}

	// Start the timer
	startTime := time.Now()

	// Generate the records
	records := generateRecords(recordCount)

	// End the timer
	endTime := time.Now()

	// Calculate the elapsed time
	elapsedTime := endTime.Sub(startTime).Milliseconds()
	atomic.StoreInt64(&recordGenerationTime, elapsedTime)

	// Log the number of records generated and the elapsed time
	log.Printf("%d records generated in: %d ms", recordCount, elapsedTime)

	// Return the generated records
	c.JSON(http.StatusOK, records)
}

// GetCreationTimeHandler handles the request to get the record generation time
func GetCreationTimeHandler(c *gin.Context) {
	elapsedTime := atomic.LoadInt64(&recordGenerationTime)
	c.JSON(http.StatusOK, gin.H{"generationTime": elapsedTime})
}

// Mock function to generate records
func generateRecords(count int) []models.UserRecord {
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
