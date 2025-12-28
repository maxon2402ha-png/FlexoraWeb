package middleware

import (
	"flexora-backend/internal/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Нет авторизации"})
			return
		}

		// Формат: "Bearer <token>"
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		claims := &utils.Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return utils.JwtKey, nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Неверный токен"})
			return
		}

		// Сохраняем ID пользователя в контекст запроса, чтобы использовать в контроллерах
		c.Set("userID", claims.UserID)
		c.Next()
	}
}
