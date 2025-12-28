package database

import (
	"flexora-backend/internal/models"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	var err error

	// 1. Пытаемся получить ссылку на базу из настроек сервера (Render)
	dsn := os.Getenv("DATABASE_URL")

	// 2. Если ссылки нет, значит мы запускаем локально - предупредим, но не упадем (для отладки)
	// Но для продакшена ссылка обязательна!
	if dsn == "" {
		log.Fatal("ОШИБКА: Не найдена переменная окружения DATABASE_URL")
	}

	// 3. Подключаемся к PostgreSQL
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Не удалось подключиться к базе данных:", err)
	}

	// 4. Делаем миграции
	err = DB.AutoMigrate(&models.User{})
	if err != nil {
		log.Fatal("Ошибка миграции:", err)
	}

	log.Println("Успешное подключение к PostgreSQL!")
}
