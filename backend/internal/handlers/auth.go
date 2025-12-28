package handlers

import (
	"flexora-backend/internal/database"
	"flexora-backend/internal/models"
	"flexora-backend/internal/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Специальная структура для ВХОДЯЩИХ данных
// Она позволяет читать пароль, даже если в модели User он скрыт
type AuthInput struct {
	Login    string `json:"login"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// REGISTER (РЕГИСТРАЦИЯ)
func Register(c *gin.Context) {
	var input AuthInput

	// 1. Читаем JSON
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные данные"})
		return
	}

	// 2. Валидация
	if input.Email == "" || input.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email и пароль обязательны"})
		return
	}

	// 3. Генерируем логин из почты, если он не пришел (alex@gmail.com -> alex)
	if input.Login == "" {
		parts := strings.Split(input.Email, "@")
		if len(parts) > 0 {
			input.Login = parts[0]
		} else {
			input.Login = "User"
		}
	}

	// 4. Хешируем пароль (Защита)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка хеширования пароля"})
		return
	}

	// 5. Создаем пользователя
	user := models.User{
		Login:    input.Login,
		Email:    input.Email,
		Password: string(hashedPassword), // Сохраняем хеш, а не чистый пароль
	}

	// 6. Сохраняем в БД
	result := database.DB.Create(&user)
	if result.Error != nil {
		// Проверка на дубликат email
		if strings.Contains(result.Error.Error(), "UNIQUE constraint failed") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Такой email уже зарегистрирован"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать пользователя"})
		return
	}

	// 7. Сразу генерируем токен, чтобы пользователю не пришлось входить
	token, _ := utils.GenerateToken(user.ID)
	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}

// LOGIN (ВХОД)
func Login(c *gin.Context) {
	var input AuthInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные данные"})
		return
	}

	var user models.User
	var err error

	// Ищем пользователя по Логину ИЛИ Email
	if input.Email != "" {
		err = database.DB.Where("email = ?", input.Email).First(&user).Error
	} else {
		err = database.DB.Where("login = ?", input.Login).First(&user).Error
	}

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не найден"})
		return
	}

	// Проверяем пароль (сравниваем хеш из БД с введенным паролем)
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный пароль"})
		return
	}

	// Генерируем токен
	token, _ := utils.GenerateToken(user.ID)
	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}
