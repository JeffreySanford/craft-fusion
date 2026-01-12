// Package models provides shared types for Go services in the Craft Fusion monorepo.
package models

// User represents a user in the system
type User struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// Address represents a physical address
type Address struct {
	Street  string `json:"street"`
	City    string `json:"city"`
	State   string `json:"state"`
	Zipcode string `json:"zipcode"`
}

// Phone represents contact phone information
type Phone struct {
	UID          string  `json:"UID"`
	Number       string  `json:"number"`
	Type         string  `json:"type"`
	CountryCode  *string `json:"countryCode,omitempty"`
	AreaCode     *string `json:"areaCode,omitempty"`
	Extension    *string `json:"extension,omitempty"`
	HasExtension *bool   `json:"hasExtension,omitempty"`
}

// Company represents employment information
type Company struct {
	UID             string  `json:"UID"`
	EmployeeName    string  `json:"employeeName"`
	AnnualSalary    float64 `json:"annualSalary"`
	CompanyName     string  `json:"companyName"`
	CompanyPosition *string `json:"companyPosition,omitempty"`
}

// Salary represents a salary record
type Salary struct {
	Amount   float64 `json:"amount"`
	Currency string  `json:"currency,omitempty"`
	Year     int     `json:"year"`
}

// Record represents a complete record in the system
type Record struct {
	UID                  string    `json:"UID"`
	Name                 string    `json:"name"`
	Avatar               any       `json:"avatar"`
	Flicker              any       `json:"flicker"`
	FirstName            string    `json:"firstName"`
	LastName             string    `json:"lastName"`
	Address              Address   `json:"address"`
	City                 string    `json:"city"`
	State                string    `json:"state"`
	Zip                  string    `json:"zip"`
	Phone                Phone     `json:"phone"`
	Salary               []Company `json:"salary"`
	Email                string    `json:"email"`
	BirthDate            string    `json:"birthDate"`
	TotalHouseholdIncome float64   `json:"totalHouseholdIncome"`
	RegistrationDate     string    `json:"registrationDate"`
}
