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

type ServerHandler struct {
	svc *service.ServerService
}

func NewServerHandler(svc *service.ServerService) *ServerHandler {
	return &ServerHandler{svc: svc}
}

func (h *ServerHandler) Create(c *gin.Context) {
	nameAr := c.PostForm("name_ar")
	nameEn := c.PostForm("name_en")
	serverType := c.PostForm("type")

	if nameAr == "" || nameEn == "" || serverType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name (Ar/En) and Type are required"})
		return
	}

	var imagePath string
	file, err := c.FormFile("image")
	if err == nil {
		// Save uploaded image
		uploadDir := "./uploads/servers"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			os.MkdirAll(uploadDir, 0755)
		}
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strconv.FormatInt(int64(len(nameEn)), 10), filepath.Ext(file.Filename))
		imagePath = filepath.ToSlash(filepath.Join("/uploads/servers", filename))
		if err := c.SaveUploadedFile(file, "."+imagePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save server image"})
			return
		}
	}

	server := domain.Server{
		NameAr: nameAr,
		NameEn: nameEn,
		Type:   serverType,
		Image:  imagePath,
	}

	if err := h.svc.Create(&server); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, server)
}

func (h *ServerHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	server, err := h.svc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	c.JSON(http.StatusOK, server)
}

func (h *ServerHandler) GetAll(c *gin.Context) {
	search := c.Query("search")
	servers, err := h.svc.GetAll(search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, servers)
}

func (h *ServerHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	server, err := h.svc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	nameAr := c.PostForm("name_ar")
	nameEn := c.PostForm("name_en")
	serverType := c.PostForm("type")

	if nameAr != "" {
		server.NameAr = nameAr
	}
	if nameEn != "" {
		server.NameEn = nameEn
	}
	if serverType != "" {
		server.Type = serverType
	}

	file, err := c.FormFile("image")
	if err == nil {
		// Save uploaded image
		uploadDir := "./uploads/servers"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			os.MkdirAll(uploadDir, 0755)
		}
		filename := fmt.Sprintf("%d_%d%s", time.Now().Unix(), id, filepath.Ext(file.Filename))
		imagePath := filepath.ToSlash(filepath.Join("/uploads/servers", filename))
		if err := c.SaveUploadedFile(file, "."+imagePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save server image"})
			return
		}
		server.Image = imagePath
	}

	if err := h.svc.Update(server); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, server)
}

func (h *ServerHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.svc.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Server deleted successfully"})
}
