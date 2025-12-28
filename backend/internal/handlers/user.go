package handlers

import (
	"flexora-backend/internal/database"
	"flexora-backend/internal/models"
	"fmt"
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

// Получить профиль
func GetProfile(c *gin.Context) {
	userID, _ := c.Get("userID")
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// Обновить текстовые данные (Логин, Пароль)
func UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("userID")
	var input struct {
		Login    string `json:"login"`
		Password string `json:"password"`
		Email    string `json:"email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные данные"})
		return
	}

	var user models.User
	database.DB.First(&user, userID)

	// Обновляем только то, что пришло
	if input.Login != "" {
		user.Login = input.Login
	}
	if input.Password != "" {
		user.Password = input.Password
	} // В реале тут нужен хеш!
	if input.Email != "" {
		user.Email = input.Email
	}

	database.DB.Save(&user)
	c.JSON(http.StatusOK, gin.H{"message": "Данные обновлены", "user": user})
}

// Загрузка аватара
func UploadAvatar(c *gin.Context) {
	userID, _ := c.Get("userID")

	// Получаем файл из формы
	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Файл не найден"})
		return
	}

	// Генерируем путь: uploads/avatar_1.png
	filename := fmt.Sprintf("avatar_%v%s", userID, filepath.Ext(file.Filename))
	path := "uploads/" + filename

	// Сохраняем на диск
	if err := c.SaveUploadedFile(file, path); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения файла"})
		return
	}

	// Обновляем ссылку в БД
	// Обрати внимание: мы добавляем адрес сервера к ссылке
	fullURL := "http://localhost:8080/" + path
	database.DB.Model(&models.User{}).Where("id = ?", userID).Update("avatar_url", fullURL)

	c.JSON(http.StatusOK, gin.H{"url": fullURL})
}
