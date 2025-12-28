package handlers

import (
	"context"
	"encoding/json"
	"flexora-backend/internal/database"
	"flexora-backend/internal/models"
	"flexora-backend/internal/utils"
	"fmt" // <--- ДОБАВЛЕНО ДЛЯ ОТЛАДКИ
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// НАСТРОЙКИ GOOGLE
var googleOauthConfig = &oauth2.Config{
	RedirectURL: "http://localhost:8080/auth/google/callback",
	// Твой Client ID
	ClientID: "181462232844-7euo7s36qc1toa59nmm5q2h8gvgnjr5d.apps.googleusercontent.com",
	// ВАЖНО: Вставь сюда Client Secret из консоли Google (начинается на GOCSPX-...)
	ClientSecret: "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",
	Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
	Endpoint:     google.Endpoint,
}

// 1. GoogleLogin - Перенаправляет пользователя на страницу входа Google
func GoogleLogin(c *gin.Context) {
	url := googleOauthConfig.AuthCodeURL("randomstate")
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// 2. GoogleCallback - Сюда Google возвращает пользователя после входа
func GoogleCallback(c *gin.Context) {
	code := c.Query("code") // Получаем код от Google

	// Меняем код на токен доступа
	token, err := googleOauthConfig.Exchange(context.Background(), code)
	if err != nil {
		// ВЫВОДИМ ОШИБКУ В ТЕРМИНАЛ, ЧТОБЫ ПОНЯТЬ ПРИЧИНУ
		fmt.Println("ОШИБКА GOOGLE EXCHANGE:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка обмена кода"})
		return
	}

	// Получаем данные о пользователе от Google
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		fmt.Println("ОШИБКА ПОЛУЧЕНИЯ ДАННЫХ:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка получения данных"})
		return
	}
	defer resp.Body.Close()

	// Структура ответа от Google
	var googleUser struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	json.NewDecoder(resp.Body).Decode(&googleUser)

	// Ищем или создаем пользователя в БД
	var user models.User
	if err := database.DB.Where("email = ?", googleUser.Email).First(&user).Error; err != nil {
		// Если пользователя нет - создаем
		user = models.User{
			Email:     googleUser.Email,
			Login:     googleUser.Name,
			GoogleID:  googleUser.ID,
			AvatarURL: googleUser.Picture,
		}
		database.DB.Create(&user)
	}

	// Генерируем наш JWT токен
	jwtToken, _ := utils.GenerateToken(user.ID)

	// Редирект на фронтенд с токеном!
	c.Redirect(http.StatusFound, "http://localhost:5173?token="+jwtToken)
}
