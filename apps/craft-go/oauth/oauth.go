package oauth

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
)

// OAuth constants - hardcoded instead of environment variables
const (
	NestRedirectURI           = "https://jeffreysanford.us/nest/callback"
	NestAccessTokenURL        = "https://api.nest.com/oauth2/access_token"
	NestClientAccessTokenURL  = "https://api.nest.com/oauth2/client_access_token"
	NestClientRefreshTokenURL = "https://api.nest.com/oauth2/client_refresh_token"
	NestClientRevokeTokenURL  = "https://api.nest.com/oauth2/client_revoke_token"

	// These would ideally be securely stored
	ClientID     = "your-client-id"
	ClientSecret = "your-client-secret"
)

// TokenResponse represents the response from token requests
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token,omitempty"`
	Scope        string `json:"scope,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error       string `json:"error"`
	Description string `json:"error_description,omitempty"`
}

// GetAuthorizationURL returns the URL for OAuth authorization
func GetAuthorizationURL() string {
	scope := "read write"
	return fmt.Sprintf(
		"https://api.nest.com/oauth2/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=%s",
		ClientID,
		url.QueryEscape(NestRedirectURI),
		scope,
	)
}

// GetAccessToken exchanges authorization code for an access token
func GetAccessToken(code string) (*TokenResponse, error) {
	data := map[string]string{
		"client_id":     ClientID,
		"client_secret": ClientSecret,
		"grant_type":    "authorization_code",
		"code":          code,
		"redirect_uri":  NestRedirectURI,
	}

	return sendTokenRequest(NestAccessTokenURL, data)
}

// GetClientAccessToken gets a client access token
func GetClientAccessToken() (*TokenResponse, error) {
	data := map[string]string{
		"client_id":     ClientID,
		"client_secret": ClientSecret,
		"grant_type":    "client_credentials",
	}

	return sendTokenRequest(NestClientAccessTokenURL, data)
}

// RefreshClientToken refreshes a token using a refresh token
func RefreshClientToken(refreshToken string) (*TokenResponse, error) {
	data := map[string]string{
		"client_id":     ClientID,
		"client_secret": ClientSecret,
		"grant_type":    "refresh_token",
		"refresh_token": refreshToken,
	}

	return sendTokenRequest(NestClientRefreshTokenURL, data)
}

// RevokeClientToken revokes a token
func RevokeClientToken(token string) error {
	data := map[string]string{
		"client_id":     ClientID,
		"client_secret": ClientSecret,
		"token":         token,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	resp, err := http.Post(NestClientRevokeTokenURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResp ErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
			return fmt.Errorf("token revocation failed with status %d", resp.StatusCode)
		}
		return fmt.Errorf("token revocation failed: %s - %s", errResp.Error, errResp.Description)
	}

	return nil
}

// sendTokenRequest sends a token request to the specified URL
func sendTokenRequest(url string, data map[string]string) (*TokenResponse, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResp ErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
			return nil, errors.New("invalid response from server")
		}
		return nil, fmt.Errorf("%s: %s", errResp.Error, errResp.Description)
	}

	var tokenResp TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, err
	}

	return &tokenResp, nil
}
