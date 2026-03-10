package domain

import (
	"time"

	"gorm.io/gorm"
)

type Country struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	NameAr    string         `gorm:"not null" json:"name_ar"`
	NameEn    string         `gorm:"not null" json:"name_en"`
	Code      string         `gorm:"uniqueIndex;not null" json:"code"`
	Flag      string         `json:"flag"` // Local path to SVG
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
