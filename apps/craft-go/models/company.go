package models

// Company represents a company entity.
type Company struct {
	Name   string  `json:"name"`
	Salary float64 `json:"salary"`
	Title  string  `json:"title"`
}
