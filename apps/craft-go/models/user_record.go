package models

// UserRecord represents a user record - uses types from the shared craft-library
type UserRecord struct {
	UID                  string   `json:"UID"`
	FirstName            string   `json:"firstName"`
	LastName             string   `json:"lastName"`
	Address              Address  `json:"address"`
	Phone                Phone    `json:"phone"`
	Salary               []Salary `json:"salary"` // Using the Salary from craftlibrary.go
	TotalHouseholdIncome int      `json:"totalHouseholdIncome"`
}

// UserEntity represents a user entity.
type UserEntity struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
}
