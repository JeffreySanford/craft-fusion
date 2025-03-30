package handlers

import (
	"craft-fusion/craft-go/oauth"
	"net/http"

	"github.com/gin-gonic/gin"
)

// NestAuthorizeHandler redirects to the Nest authorization page
func NestAuthorizeHandler(c *gin.Context) {
	authURL := oauth.GetAuthorizationURL()
	c.Redirect(http.StatusFound, authURL)
}

// NestCallbackHandler handles the OAuth callback
func NestCallbackHandler(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No authorization code provided",
		})
		return
	}

	token, err := oauth.GetAccessToken(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to exchange code for token: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, token)
}

// NestTokenHandler gets a client access token
func NestTokenHandler(c *gin.Context) {
	token, err := oauth.GetClientAccessToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get client token: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, token)
}

// NestRefreshHandler refreshes a token
func NestRefreshHandler(c *gin.Context) {
	var request struct {
		RefreshToken string `json:"refresh_token"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request",
		})
		return
	}

	if request.RefreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No refresh token provided",
		})
		return
	}

	token, err := oauth.RefreshClientToken(request.RefreshToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to refresh token: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, token)
}

// NestRevokeHandler revokes a token
func NestRevokeHandler(c *gin.Context) {
	var request struct {
		Token string `json:"token"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request",
		})
		return
	}

	if request.Token == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No token provided",
		})
		return
	}

	err := oauth.RevokeClientToken(request.Token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to revoke token: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Token successfully revoked",
	})
}
