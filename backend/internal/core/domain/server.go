package domain

import (
	"time"

	"gorm.io/gorm"
)

type Server struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	NameAr    string         `gorm:"not null" json:"name_ar"`
	NameEn    string         `gorm:"not null" json:"name_en"`
	Type      string         `gorm:"not null" json:"type"`
	Image     string         `json:"image"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
