package models

// Record represents a user's record.
type Record struct {
	UID                  string    `json:"uid"`
	FirstName            string    `json:"firstName"`
	LastName             string    `json:"lastName"`
	Address              Address   `json:"address"`
	Phone                Phone     `json:"phone"`
	Salary               []Company `json:"salary"`
	TotalHouseholdIncome float64   `json:"totalHouseholdIncome"`
}
