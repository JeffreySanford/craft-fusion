package handlers

import (
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GenerateRecordsHandler handles the generation of new records
func GenerateRecordsHandler(c *gin.Context) {
	countStr := c.Query("count")
	count, err := strconv.Atoi(countStr)
	if err != nil || count <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid count parameter"})
		return
	}

	// Logic to generate records
	records := generateRecords(count)

	c.JSON(http.StatusOK, records)
}

// Mock function to generate records
func generateRecords(count int) []Record {
	rand.Seed(time.Now().UnixNano())
	records := make([]Record, count)
	for i := 0; i < count; i++ {
		records[i] = Record{
			UID:       strconv.Itoa(rand.Intn(1000000000)),
			FirstName: "FirstName" + strconv.Itoa(i+1),
			LastName:  "LastName" + strconv.Itoa(i+1),
			Address: Address{
				Street:  "Street" + strconv.Itoa(i+1),
				City:    "City" + strconv.Itoa(i+1),
				State:   "State" + strconv.Itoa(i+1),
				Zipcode: "Zipcode" + strconv.Itoa(i+1),
			},
			Phone: Phone{
				Number:       "(123) 456-7890",
				AreaCode:     "123",
				HasExtension: true,
				Extension:    "1234",
			},
			Salary: []Salary{
				{Amount: rand.Intn(100000), Year: 2021},
				{Amount: rand.Intn(100000), Year: 2022},
				{Amount: rand.Intn(100000), Year: 2023},
			},
			TotalHouseholdIncome: rand.Intn(100000000),
		}
	}
	return records
}

// Record represents a user record
type Record struct {
	UID                  string   `json:"UID"`
	FirstName            string   `json:"firstName"`
	LastName             string   `json:"lastName"`
	Address              Address  `json:"address"`
	Phone                Phone    `json:"phone"`
	Salary               []Salary `json:"salary"`
	TotalHouseholdIncome int      `json:"totalHouseholdIncome"`
}

// Address represents a user's address
type Address struct {
	Street  string `json:"street"`
	City    string `json:"city"`
	State   string `json:"state"`
	Zipcode string `json:"zipcode"`
}

// Phone represents a user's phone information
type Phone struct {
	Number       string `json:"number"`
	AreaCode     string `json:"areaCode"`
	HasExtension bool   `json:"hasExtension"`
	Extension    string `json:"extension"`
}

// Salary represents a user's salary information
type Salary struct {
	Amount int `json:"amount"`
	Year   int `json:"year"`
}
