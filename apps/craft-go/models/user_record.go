package models

// how can I export these?

// UserRecord represents a user record
type UserRecord struct {
	UID                  string   `json:"UID"`
	FirstName            string   `json:"firstName"`
	LastName             string   `json:"lastName"`
	Address              Address  `json:"address"`
	Phone                Phone    `json:"phone"`
	Salary               []Salary `json:"salary"`
	TotalHouseholdIncome int      `json:"totalHouseholdIncome"`
}

// Salary represents a salary record
type Salary struct {
	Amount   float64 `json:"amount"`
	Currency string  `json:"currency"`
	Year     int     `json:"year"`
}

// Address represents an address
type Address struct {
	Street  string `json:"street"`
	City    string `json:"city"`
	State   string `json:"state"`
	Zipcode string `json:"zipcode"`
}

// Company represents a company entity.
type Company struct {
	Name   string  `json:"name"`
	Salary float64 `json:"salary"`
	Title  string  `json:"title"`
}

// Phone represents a user's phone details.

type Phone struct {
	Number       string  `json:"number"`
	HasExtension bool    `json:"hasExtension"`
	Extension    *string `json:"extension"`
	AreaCode     string  `json:"areaCode"`
}

// UserEntity represents a user entity.
type UserEntity struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
}

// Record represents a record entity.
type Record struct {
	UID                  string    `json:"UID"`
	FirstName            string    `json:"firstName"`
	LastName             string    `json:"lastName"`
	Address              Address   `json:"address"`
	Phone                Phone     `json:"phone"`
	Salary               []Company `json:"salary"`
	TotalHouseholdIncome float64   `json:"totalHouseholdIncome"`
}
