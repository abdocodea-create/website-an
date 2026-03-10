package seeder

import (
	"backend/internal/core/domain"
	"log"
	"os"

	"gorm.io/gorm"
)

func SeedCountries(db *gorm.DB) {
	countries := []domain.Country{
		// Arab Countries
		{NameAr: "السعودية", NameEn: "Saudi Arabia", Code: "sa", Flag: "/uploads/flag-icons/flags/4x3/sa.svg"},
		{NameAr: "مصر", NameEn: "Egypt", Code: "eg", Flag: "/uploads/flag-icons/flags/4x3/eg.svg"},
		{NameAr: "الإمارات", NameEn: "United Arab Emirates", Code: "ae", Flag: "/uploads/flag-icons/flags/4x3/ae.svg"},
		{NameAr: "قطر", NameEn: "Qatar", Code: "qa", Flag: "/uploads/flag-icons/flags/4x3/qa.svg"},
		{NameAr: "الكويت", NameEn: "Kuwait", Code: "kw", Flag: "/uploads/flag-icons/flags/4x3/kw.svg"},
		{NameAr: "البحرين", NameEn: "Bahrain", Code: "bh", Flag: "/uploads/flag-icons/flags/4x3/bh.svg"},
		{NameAr: "عمان", NameEn: "Oman", Code: "om", Flag: "/uploads/flag-icons/flags/4x3/om.svg"},
		{NameAr: "الأردن", NameEn: "Jordan", Code: "jo", Flag: "/uploads/flag-icons/flags/4x3/jo.svg"},
		{NameAr: "لبنان", NameEn: "Lebanon", Code: "lb", Flag: "/uploads/flag-icons/flags/4x3/lb.svg"},
		{NameAr: "سوريا", NameEn: "Syria", Code: "sy", Flag: "/uploads/flag-icons/flags/4x3/sy.svg"},
		{NameAr: "العراق", NameEn: "Iraq", Code: "iq", Flag: "/uploads/flag-icons/flags/4x3/iq.svg"},
		{NameAr: "فلسطين", NameEn: "Palestine", Code: "ps", Flag: "/uploads/flag-icons/flags/4x3/ps.svg"},
		{NameAr: "اليمن", NameEn: "Yemen", Code: "ye", Flag: "/uploads/flag-icons/flags/4x3/ye.svg"},
		{NameAr: "ليبيا", NameEn: "Libya", Code: "ly", Flag: "/uploads/flag-icons/flags/4x3/ly.svg"},
		{NameAr: "تونس", NameEn: "Tunisia", Code: "tn", Flag: "/uploads/flag-icons/flags/4x3/tn.svg"},
		{NameAr: "الجزائر", NameEn: "Algeria", Code: "dz", Flag: "/uploads/flag-icons/flags/4x3/dz.svg"},
		{NameAr: "المغرب", NameEn: "Morocco", Code: "ma", Flag: "/uploads/flag-icons/flags/4x3/ma.svg"},
		{NameAr: "السودان", NameEn: "Sudan", Code: "sd", Flag: "/uploads/flag-icons/flags/4x3/sd.svg"},
		{NameAr: "موريتانيا", NameEn: "Mauritania", Code: "mr", Flag: "/uploads/flag-icons/flags/4x3/mr.svg"},
		{NameAr: "الصومال", NameEn: "Somalia", Code: "so", Flag: "/uploads/flag-icons/flags/4x3/so.svg"},
		{NameAr: "جيبوتي", NameEn: "Djibouti", Code: "dj", Flag: "/uploads/flag-icons/flags/4x3/dj.svg"},
		{NameAr: "جزر القمر", NameEn: "Comoros", Code: "km", Flag: "/uploads/flag-icons/flags/4x3/km.svg"},

		// Major Foreign Countries
		{NameAr: "الولايات المتحدة", NameEn: "United States", Code: "us", Flag: "/uploads/flag-icons/flags/4x3/us.svg"},
		{NameAr: "المملكة المتحدة", NameEn: "United Kingdom", Code: "gb", Flag: "/uploads/flag-icons/flags/4x3/gb.svg"},
		{NameAr: "فرنسا", NameEn: "France", Code: "fr", Flag: "/uploads/flag-icons/flags/4x3/fr.svg"},
		{NameAr: "ألمانيا", NameEn: "Germany", Code: "de", Flag: "/uploads/flag-icons/flags/4x3/de.svg"},
		{NameAr: "اليابان", NameEn: "Japan", Code: "jp", Flag: "/uploads/flag-icons/flags/4x3/jp.svg"},
		{NameAr: "الصين", NameEn: "China", Code: "cn", Flag: "/uploads/flag-icons/flags/4x3/cn.svg"},
		{NameAr: "روسيا", NameEn: "Russia", Code: "ru", Flag: "/uploads/flag-icons/flags/4x3/ru.svg"},
		{NameAr: "إيطاليا", NameEn: "Italy", Code: "it", Flag: "/uploads/flag-icons/flags/4x3/it.svg"},
		{NameAr: "إسبانيا", NameEn: "Spain", Code: "es", Flag: "/uploads/flag-icons/flags/4x3/es.svg"},
		{NameAr: "كندا", NameEn: "Canada", Code: "ca", Flag: "/uploads/flag-icons/flags/4x3/ca.svg"},
		{NameAr: "أستراليا", NameEn: "Australia", Code: "au", Flag: "/uploads/flag-icons/flags/4x3/au.svg"},
		{NameAr: "البرازيل", NameEn: "Brazil", Code: "br", Flag: "/uploads/flag-icons/flags/4x3/br.svg"},
		{NameAr: "الهند", NameEn: "India", Code: "in", Flag: "/uploads/flag-icons/flags/4x3/in.svg"},
		{NameAr: "كوريا الجنوبية", NameEn: "South Korea", Code: "kr", Flag: "/uploads/flag-icons/flags/4x3/kr.svg"},
		{NameAr: "تركيا", NameEn: "Turkey", Code: "tr", Flag: "/uploads/flag-icons/flags/4x3/tr.svg"},
		{NameAr: "المكسيك", NameEn: "Mexico", Code: "mx", Flag: "/uploads/flag-icons/flags/4x3/mx.svg"},
		{NameAr: "الأرجنتين", NameEn: "Argentina", Code: "ar", Flag: "/uploads/flag-icons/flags/4x3/ar.svg"},
		{NameAr: "هولندا", NameEn: "Netherlands", Code: "nl", Flag: "/uploads/flag-icons/flags/4x3/nl.svg"},
		{NameAr: "بلجيكا", NameEn: "Belgium", Code: "be", Flag: "/uploads/flag-icons/flags/4x3/be.svg"},
		{NameAr: "سويسرا", NameEn: "Switzerland", Code: "ch", Flag: "/uploads/flag-icons/flags/4x3/ch.svg"},
		{NameAr: "السويد", NameEn: "Sweden", Code: "se", Flag: "/uploads/flag-icons/flags/4x3/se.svg"},
		{NameAr: "النرويج", NameEn: "Norway", Code: "no", Flag: "/uploads/flag-icons/flags/4x3/no.svg"},
		{NameAr: "الدنمارك", NameEn: "Denmark", Code: "dk", Flag: "/uploads/flag-icons/flags/4x3/dk.svg"},
		{NameAr: "فنلندا", NameEn: "Finland", Code: "fi", Flag: "/uploads/flag-icons/flags/4x3/fi.svg"},
		{NameAr: "البرتغال", NameEn: "Portugal", Code: "pt", Flag: "/uploads/flag-icons/flags/4x3/pt.svg"},
		{NameAr: "اليونان", NameEn: "Greece", Code: "gr", Flag: "/uploads/flag-icons/flags/4x3/gr.svg"},
		{NameAr: "النمسا", NameEn: "Austria", Code: "at", Flag: "/uploads/flag-icons/flags/4x3/at.svg"},
		{NameAr: "بولندا", NameEn: "Poland", Code: "pl", Flag: "/uploads/flag-icons/flags/4x3/pl.svg"},
		{NameAr: "أوكرانيا", NameEn: "Ukraine", Code: "ua", Flag: "/uploads/flag-icons/flags/4x3/ua.svg"},
		{NameAr: "إندونيسيا", NameEn: "Indonesia", Code: "id", Flag: "/uploads/flag-icons/flags/4x3/id.svg"},
		{NameAr: "تايلاند", NameEn: "Thailand", Code: "th", Flag: "/uploads/flag-icons/flags/4x3/th.svg"},
		{NameAr: "فيتنام", NameEn: "Vietnam", Code: "vn", Flag: "/uploads/flag-icons/flags/4x3/vn.svg"},
		{NameAr: "ماليزيا", NameEn: "Malaysia", Code: "my", Flag: "/uploads/flag-icons/flags/4x3/my.svg"},
		{NameAr: "باكستان", NameEn: "Pakistan", Code: "pk", Flag: "/uploads/flag-icons/flags/4x3/pk.svg"},
		{NameAr: "نيجيريا", NameEn: "Nigeria", Code: "ng", Flag: "/uploads/flag-icons/flags/4x3/ng.svg"},
		{NameAr: "جنوب أفريقيا", NameEn: "South Africa", Code: "za", Flag: "/uploads/flag-icons/flags/4x3/za.svg"},
		{NameAr: "السنغال", NameEn: "Senegal", Code: "sn", Flag: "/uploads/flag-icons/flags/4x3/sn.svg"},
		{NameAr: "الفلبين", NameEn: "Philippines", Code: "ph", Flag: "/uploads/flag-icons/flags/4x3/ph.svg"},
	}

	totalCreated := 0
	totalUpdated := 0

	for _, country := range countries {
		// Check if flag file exists
		flagPath := "." + country.Flag
		if _, err := os.Stat(flagPath); os.IsNotExist(err) {
			log.Printf("Warning: Flag file for %s not found at %s", country.NameEn, flagPath)
		}

		var existing domain.Country
		err := db.Where("code = ?", country.Code).First(&existing).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&country).Error; err != nil {
					log.Printf("Failed to seed country %s: %v", country.NameEn, err)
				} else {
					totalCreated++
				}
			}
		} else {
			// Update flag path or names if they exist but might be different
			db.Model(&existing).Updates(map[string]interface{}{
				"flag":    country.Flag,
				"name_ar": country.NameAr,
				"name_en": country.NameEn,
			})
			totalUpdated++
		}
	}
	log.Printf("Countries seeding completed. Created: %d, Updated: %d", totalCreated, totalUpdated)
}
