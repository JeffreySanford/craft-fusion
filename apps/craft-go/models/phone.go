package models

// Phone represents a user's phone details.
type Phone struct {
	Number       string  `json:"number"`
	HasExtension bool    `json:"hasExtension"`
	Extension    *string `json:"extension"`
}
