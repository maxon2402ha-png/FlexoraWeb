package utils

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// СЕКРЕТНЫЙ КЛЮЧ (В реальности храни в .env файле!)
var JwtKey = []byte("my_super_secret_key_flexora_2025")

type Claims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

// GenerateToken создает токен, который живет 24 часа
func GenerateToken(userID uint) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JwtKey)
}
