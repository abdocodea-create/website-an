package handler

import (
	"backend/internal/adapters/repository"
	"backend/internal/core/domain"
	"backend/internal/core/service"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// escapeJSON escapes special characters for JSON strings
func escapeJSON(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, `"`, `\"`)
	s = strings.ReplaceAll(s, "\n", `\n`)
	s = strings.ReplaceAll(s, "\r", `\r`)
	s = strings.ReplaceAll(s, "\t", `\t`)
	return s
}

type CommentHandler struct {
	repo           *repository.CommentRepository
	notifRepo      *repository.NotificationRepository
	historyService *service.HistoryService
}

func NewCommentHandler(repo *repository.CommentRepository, notifRepo *repository.NotificationRepository, historyService *service.HistoryService) *CommentHandler {
	return &CommentHandler{
		repo:           repo,
		notifRepo:      notifRepo,
		historyService: historyService,
	}
}

// Create handles creating a new comment
func (h *CommentHandler) Create(c *gin.Context) {
	var input struct {
		Content   string `json:"content" binding:"required"`
		EpisodeID uint   `json:"episode_id"` // Optional if passing via param
		ParentID  *uint  `json:"parent_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If episode ID is in param, override
	episodeIDParam := c.Param("id")
	if episodeIDParam != "" {
		id, _ := strconv.Atoi(episodeIDParam)
		input.EpisodeID = uint(id)
	}

	userID := c.GetUint("user_id") // Assumes Auth Middleware sets this

	comment := domain.Comment{
		Content:   input.Content,
		EpisodeID: input.EpisodeID,
		UserID:    userID,
		ParentID:  input.ParentID,
	}

	if err := h.repo.Create(&comment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

	// NOTIFICATION LOGIC: Reply
	if comment.ParentID != nil {
		// Fetch parent to get owner
		parent, err := h.repo.GetByID(*comment.ParentID)
		if err == nil && parent.UserID != userID {
			// Create notification
			h.notifRepo.Create(&domain.Notification{
				UserID: parent.UserID,
				Type:   domain.NotificationTypeReply,
				Data:   []byte(`{"comment_id": ` + strconv.Itoa(int(comment.ID)) + `, "actor_id": ` + strconv.Itoa(int(userID)) + `}`),
			})
		}

		// Track Reply with metadata
		repliedToUser := "User"
		if parent != nil && parent.User != nil {
			repliedToUser = parent.User.Name
		}
		metadata := `{"content": "` + escapeJSON(comment.Content) + `", "replied_to_user": "` + escapeJSON(repliedToUser) + `", "episode_id": ` + strconv.Itoa(int(comment.EpisodeID)) + `}`
		go h.historyService.TrackWithMetadata(userID, domain.ActivityReply, &comment.EpisodeID, nil, &comment.ID, metadata, "")
	} else {
		// Track Comment with metadata
		metadata := `{"content": "` + escapeJSON(comment.Content) + `", "episode_id": ` + strconv.Itoa(int(comment.EpisodeID)) + `}`
		go h.historyService.TrackWithMetadata(userID, domain.ActivityComment, &comment.EpisodeID, nil, &comment.ID, metadata, "")
	}

	c.JSON(http.StatusCreated, comment)
}

// GetAllByEpisode fetches comments for an episode
func (h *CommentHandler) GetAllByEpisode(c *gin.Context) {
	episodeID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid episode ID"})
		return
	}

	comments, err := h.repo.GetByEpisodeID(uint(episodeID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	c.JSON(http.StatusOK, comments)
}

// ToggleLike
func (h *CommentHandler) ToggleLike(c *gin.Context) {
	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	var input struct {
		IsLike bool `json:"is_like"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")

	if err := h.repo.ToggleLike(uint(userID), uint(commentID), input.IsLike); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle like"})
		return
	}

	// NOTIFICATION LOGIC: Like
	if input.IsLike {
		// Fetch comment to get owner
		target, err := h.repo.GetByID(uint(commentID))
		if err == nil && target.UserID != userID {
			h.notifRepo.Create(&domain.Notification{
				UserID: target.UserID,
				Type:   domain.NotificationTypeLike,
				Data:   []byte(`{"comment_id": ` + strconv.Itoa(commentID) + `, "actor_id": ` + strconv.Itoa(int(userID)) + `}`),
			})
		}

		// Track Like in History with metadata
		if target != nil {
			commentIDUint := uint(commentID)
			ownerName := "User"
			if target.User != nil {
				ownerName = target.User.Name
			}
			metadata := `{"comment_content": "` + escapeJSON(target.Content) + `", "comment_owner": "` + escapeJSON(ownerName) + `", "episode_id": ` + strconv.Itoa(int(target.EpisodeID)) + `}`
			go h.historyService.TrackWithMetadata(userID, domain.ActivityLike, &target.EpisodeID, nil, &commentIDUint, metadata, "")
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Success"})
}

// Delete
func (h *CommentHandler) Delete(c *gin.Context) {
	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	// Verify ownership?
	// For MVP, just delete. Middleware checks generic auth.
	// Ideally check if userID == comment.UserID or Role == Admin.
	// Assume Repo handles it or we do a GetByID check here.

	userID := c.GetUint("user_id")
	role := c.GetString("role") // Assumes AuthMiddleware sets "role"

	// Simple ownership check
	existing, err := h.repo.GetByID(uint(commentID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	// Allow if owner OR admin
	if existing.UserID != userID && role != "admin" && role != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized"})
		return
	}

	if err := h.repo.Delete(uint(commentID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// GetAllComments for dashboard
func (h *CommentHandler) GetAllComments(c *gin.Context) {
	comments, err := h.repo.GetAllComments()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}
	c.JSON(http.StatusOK, comments)
}

// Update
func (h *CommentHandler) Update(c *gin.Context) {
	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	var input struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")
	existing, err := h.repo.GetByID(uint(commentID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	if existing.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized"})
		return
	}

	existing.Content = input.Content
	if err := h.repo.Update(existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comment"})
		return
	}

	c.JSON(http.StatusOK, existing)
}
