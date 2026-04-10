package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetUserID extracts and parses the user ID from the Gin context as a UUID
func GetUserID(c *gin.Context) (uuid.UUID, error) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, gin.Error{Err: http.ErrAbortHandler, Type: gin.ErrorTypePrivate}
	}
	return uuid.Parse(userIDStr.(string))
}

// GetUserIDString extracts the user ID from the Gin context as a string
func GetUserIDString(c *gin.Context) (string, error) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		return "", gin.Error{Err: http.ErrAbortHandler, Type: gin.ErrorTypePrivate}
	}
	return userIDStr.(string), nil
}
