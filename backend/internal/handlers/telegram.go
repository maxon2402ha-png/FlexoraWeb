package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"flexora-backend/internal/database"
	"flexora-backend/internal/models"
	"flexora-backend/internal/utils"
	"fmt"
	"net/http"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
)

// Токен твоего бота от BotFather
const BotToken = "ТВОЙ_TELEGRAM_BOT_TOKEN"

type TelegramAuthPayload struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	Username  string `json:"username"`
	PhotoURL  string `json:"photo_url"`
	AuthDate  int64  `json:"auth_date"`
	Hash      string `json:"hash"`
}

func TelegramLogin(c *gin.Context) {
	var payload TelegramAuthPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные данные"})
		return
	}

	// 1. Проверка подписи (Важно для безопасности!)
	if !CheckTelegramSignature(payload, BotToken) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверная подпись данных"})
		return
	}

	// 2. Ищем или создаем пользователя
	var user models.User
	if err := database.DB.Where("telegram_id = ?", payload.ID).First(&user).Error; err != nil {
		user = models.User{
			TelegramID: payload.ID,
			Login:      payload.FirstName, // Или Username
			AvatarURL:  payload.PhotoURL,
		}
		database.DB.Create(&user)
	}

	// 3. Выдаем токен
	token, _ := utils.GenerateToken(user.ID)
	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}

// Вспомогательная функция проверки хеша Telegram
func CheckTelegramSignature(p TelegramAuthPayload, token string) bool {
	// Telegram требует отсортировать параметры (кроме hash)
	dataCheckArr := []string{
		fmt.Sprintf("auth_date=%d", p.AuthDate),
		fmt.Sprintf("first_name=%s", p.FirstName),
		fmt.Sprintf("id=%d", p.ID),
		fmt.Sprintf("photo_url=%s", p.PhotoURL),
		fmt.Sprintf("username=%s", p.Username),
	}
	// Убираем пустые поля, если их нет
	var cleanArr []string
	for _, v := range dataCheckArr {
		if !strings.Contains(v, "=&") && !strings.HasSuffix(v, "=") {
			cleanArr = append(cleanArr, v)
		}
	}
	sort.Strings(cleanArr)
	dataCheckString := strings.Join(cleanArr, "\n")

	// Хешируем токен бота
	secretKey := sha256.Sum256([]byte(token))

	// Хешируем строку данных
	h := hmac.New(sha256.New, secretKey[:])
	h.Write([]byte(dataCheckString))
	calculatedHash := hex.EncodeToString(h.Sum(nil))

	return calculatedHash == p.Hash
}
