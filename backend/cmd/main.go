package main

import (
	"flexora-backend/internal/database"
	"flexora-backend/internal/handlers"
	"flexora-backend/internal/middleware" // Импортируем middleware
	"flexora-backend/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	database.Connect()
	database.DB.AutoMigrate(&models.User{})

	r := gin.Default()

	// Настройка CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"} // Разрешаем Authorization
	r.Use(cors.New(config))

	// РАЗДАЧА СТАТИКИ (Чтобы картинки открывались по ссылке)
	r.Static("/uploads", "./uploads")

	// Публичные маршруты
	r.POST("/api/register", handlers.Register)
	r.POST("/api/login", handlers.Login)
	r.GET("/auth/google/login", handlers.GoogleLogin)
	r.GET("/auth/google/callback", handlers.GoogleCallback)

	// ЗАЩИЩЕННЫЕ МАРШРУТЫ (Только с токеном)
	protected := r.Group("/api")
	protected.Use(middleware.AuthRequired())
	{
		protected.GET("/me", handlers.GetProfile)        // Получить данные профиля
		protected.PUT("/me", handlers.UpdateProfile)     // Обновить данные
		protected.POST("/avatar", handlers.UploadAvatar) // Загрузить аватар
	}

	r.Run(":8080")
}
