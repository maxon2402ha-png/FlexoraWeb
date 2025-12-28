package models

import "gorm.io/gorm"

// User - это структура таблицы в базе данных
type User struct {
	gorm.Model
	Login      string `json:"login"`                         // Логин (может быть имя из соцсети)
	Password   string `json:"-"`                             // Пароль (скрыт при возврате JSON, знак минус делает это)
	Email      string `json:"email" gorm:"unique"`           // Email (уникальный)
	GoogleID   string `json:"google_id"`                     // Уникальный ID от Google
	TelegramID int64  `json:"telegram_id"`                   // Уникальный ID от Telegram
	AvatarURL  string `json:"avatar_url"`                    // Ссылка на фото профиля
	IsAdmin    bool   `json:"is_admin" gorm:"default:false"` // Права админа
}
