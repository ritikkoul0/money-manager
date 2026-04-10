package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	db *sql.DB
}

func NewAuthHandler(db *sql.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

type SyncUserRequest struct {
	Email        string `json:"email" binding:"required"`
	Name         string `json:"name"`
	GoogleID     string `json:"google_id" binding:"required"`
	Picture      string `json:"picture"`
	AuthProvider string `json:"auth_provider"`
}

type UserResponse struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	GoogleID     string    `json:"google_id"`
	Picture      string    `json:"picture"`
	AuthProvider string    `json:"auth_provider"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// SyncUser creates or updates a user based on OAuth data
func (h *AuthHandler) SyncUser(c *gin.Context) {
	var req SyncUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user exists by google_id
	var user UserResponse
	err := h.db.QueryRow(`
		SELECT id, email, name, google_id, picture, auth_provider, created_at, updated_at
		FROM users
		WHERE google_id = $1
	`, req.GoogleID).Scan(
		&user.ID, &user.Email, &user.Name, &user.GoogleID,
		&user.Picture, &user.AuthProvider, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		// User doesn't exist, create new user
		userID := uuid.New()
		now := time.Now()

		_, err = h.db.Exec(`
			INSERT INTO users (id, email, name, google_id, picture, auth_provider, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`, userID, req.Email, req.Name, req.GoogleID, req.Picture, req.AuthProvider, now, now)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		user = UserResponse{
			ID:           userID.String(),
			Email:        req.Email,
			Name:         req.Name,
			GoogleID:     req.GoogleID,
			Picture:      req.Picture,
			AuthProvider: req.AuthProvider,
			CreatedAt:    now,
			UpdatedAt:    now,
		}

		c.JSON(http.StatusCreated, user)
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// User exists, update their information
	now := time.Now()
	_, err = h.db.Exec(`
		UPDATE users
		SET email = $1, name = $2, picture = $3, updated_at = $4
		WHERE google_id = $5
	`, req.Email, req.Name, req.Picture, now, req.GoogleID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	user.Email = req.Email
	user.Name = req.Name
	user.Picture = req.Picture
	user.UpdatedAt = now

	c.JSON(http.StatusOK, user)
}

// GetUserByGoogleID retrieves a user by their Google ID
func (h *AuthHandler) GetUserByGoogleID(c *gin.Context) {
	googleID := c.Param("google_id")

	var user UserResponse
	err := h.db.QueryRow(`
		SELECT id, email, name, google_id, picture, auth_provider, created_at, updated_at
		FROM users
		WHERE google_id = $1
	`, googleID).Scan(
		&user.ID, &user.Email, &user.Name, &user.GoogleID,
		&user.Picture, &user.AuthProvider, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, user)
}
