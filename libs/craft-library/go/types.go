// Package craftlibrary provides shared types for Go services in the Craft Fusion monorepo.
package craftlibrary

type User struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// Add more shared Go structs here
