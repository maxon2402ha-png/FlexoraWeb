package database

import (
	"log"

	"github.com/glebarez/sqlite" // <--- МЫ ИСПОЛЬЗУЕМ ЭТОТ НОВЫЙ ДРАЙВЕР
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	var err error
	// Подключаемся, используя pure-go драйвер
	DB, err = gorm.Open(sqlite.Open("flexora.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Не удалось подключиться к базе данных:", err)
	}

	log.Println("Успешное подключение к БД!")
}
