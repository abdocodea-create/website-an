package repository

import (
	"backend/internal/core/domain"
	"errors"

	"gorm.io/gorm"
)

type CommentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

// Create adds a new comment
func (r *CommentRepository) Create(comment *domain.Comment) error {
	return r.db.Create(comment).Error
}

// GetByID fetches a comment by ID
func (r *CommentRepository) GetByID(id uint) (*domain.Comment, error) {
	var comment domain.Comment
	if err := r.db.Preload("User").First(&comment, id).Error; err != nil {
		return nil, err
	}
	return &comment, nil
}

// GetByEpisodeID fetches comments for an episode, preload user and replies
// Using a simple strategy: fetch top-level comments and their immediate children.
// For deep nesting, a recursive strategy or fetching all and building tree in code is better.
// Here we assume 1-level nesting for simplicity as per common UI patterns, or rely on Preload for a few levels.
func (r *CommentRepository) GetByEpisodeID(episodeID uint) ([]domain.Comment, error) {
	var comments []domain.Comment
	// Fetch top-level comments (ParentID is null)
	// Order by CreatedAt desc
	err := r.db.Preload("User").
		Preload("Children", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at asc").Preload("User") // Replies ordered chronologically
		}).
		Preload("Children.Children"). // Optional: if we want 2 levels deep
		Where("episode_id = ? AND parent_id IS NULL", episodeID).
		Order("created_at desc").
		Find(&comments).Error

	return comments, err
}

// GetAllComments fetches all comments for dashboard
func (r *CommentRepository) GetAllComments() ([]domain.Comment, error) {
	var comments []domain.Comment
	err := r.db.Preload("User").
		Preload("Episode").
		Preload("Episode.Anime"). // To show Anime name if needed
		Preload("Parent").
		Preload("Parent.User").
		Order("created_at desc").
		Find(&comments).Error
	return comments, err
}

// Update modifies comment content
func (r *CommentRepository) Update(comment *domain.Comment) error {
	return r.db.Save(comment).Error
}

// Delete removes a comment
func (r *CommentRepository) Delete(id uint) error {
	return r.db.Delete(&domain.Comment{}, id).Error
}

// ToggleLike handles like/dislike logic
func (r *CommentRepository) ToggleLike(userID, commentID uint, isLike bool) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var like domain.CommentLike
		err := tx.Where("user_id = ? AND comment_id = ?", userID, commentID).First(&like).Error

		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new interaction
			newLike := domain.CommentLike{UserID: userID, CommentID: commentID, IsLike: isLike}
			if err := tx.Create(&newLike).Error; err != nil {
				return err
			}
			// Update counts
			col := "likes"
			if !isLike {
				col = "dislikes"
			}
			return tx.Model(&domain.Comment{}).Where("id = ?", commentID).UpdateColumn(col, gorm.Expr(col+"+ ?", 1)).Error
		} else if err != nil {
			return err
		}

		// Interaction exists
		if like.IsLike == isLike {
			// User clicked same button -> Remove interaction (Toggle off)
			if err := tx.Delete(&like).Error; err != nil {
				return err
			}
			col := "likes"
			if !isLike {
				col = "dislikes"
			}
			return tx.Model(&domain.Comment{}).Where("id = ?", commentID).UpdateColumn(col, gorm.Expr(col+"- ?", 1)).Error
		} else {
			// User changed from Like to Dislike or vice versa
			like.IsLike = isLike
			if err := tx.Save(&like).Error; err != nil {
				return err
			}
			// Adjust counts: -1 from old, +1 to new
			oldCol := "dislikes"
			newCol := "likes"
			if !isLike {
				oldCol = "likes"
				newCol = "dislikes"
			}
			if err := tx.Model(&domain.Comment{}).Where("id = ?", commentID).
				Update(oldCol, gorm.Expr(oldCol+"- ?", 1)).
				Update(newCol, gorm.Expr(newCol+"+ ?", 1)).Error; err != nil {
				return err
			}
		}

		return nil
	})
}
