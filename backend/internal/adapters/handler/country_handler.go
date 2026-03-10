package handler

import (
	"backend/internal/core/domain"
	"backend/internal/core/service"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type CountryHandler struct {
	svc *service.CountryService
}

func NewCountryHandler(svc *service.CountryService) *CountryHandler {
	return &CountryHandler{svc: svc}
}

func (h *CountryHandler) Create(c *gin.Context) {
	nameAr := c.PostForm("name_ar")
	nameEn := c.PostForm("name_en")
	code := c.PostForm("code")

	if nameAr == "" || nameEn == "" || code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name (Ar/En) and Code are required"})
		return
	}

	var flagPath string
	file, err := c.FormFile("flag")
	if err == nil {
		// Save uploaded flag
		uploadDir := "./uploads/flags"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			os.MkdirAll(uploadDir, 0755)
		}
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strconv.FormatInt(int64(len(nameEn)), 10), filepath.Ext(file.Filename))
		flagPath = filepath.ToSlash(filepath.Join("/uploads/flags", filename))
		if err := c.SaveUploadedFile(file, "."+flagPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save flag icon"})
			return
		}
	}

	country := domain.Country{
		NameAr: nameAr,
		NameEn: nameEn,
		Code:   code,
		Flag:   flagPath,
	}

	if err := h.svc.Create(&country); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, country)
}

func (h *CountryHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	country, err := h.svc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Country not found"})
		return
	}

	c.JSON(http.StatusOK, country)
}

func (h *CountryHandler) GetAll(c *gin.Context) {
	search := c.Query("search")
	countries, err := h.svc.GetAll(search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, countries)
}

func (h *CountryHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	country, err := h.svc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Country not found"})
		return
	}

	nameAr := c.PostForm("name_ar")
	nameEn := c.PostForm("name_en")
	code := c.PostForm("code")

	if nameAr != "" {
		country.NameAr = nameAr
	}
	if nameEn != "" {
		country.NameEn = nameEn
	}
	if code != "" {
		country.Code = code
	}

	file, err := c.FormFile("flag")
	if err == nil {
		// Save uploaded flag
		uploadDir := "./uploads/flags"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			os.MkdirAll(uploadDir, 0755)
		}
		filename := fmt.Sprintf("%d_%d%s", time.Now().Unix(), id, filepath.Ext(file.Filename))
		flagPath := filepath.ToSlash(filepath.Join("/uploads/flags", filename))
		if err := c.SaveUploadedFile(file, "."+flagPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save flag icon"})
			return
		}
		country.Flag = flagPath
	}

	if err := h.svc.Update(country); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, country)
}

func (h *CountryHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.svc.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Country deleted successfully"})
}
