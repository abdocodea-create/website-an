package repository

import (
	"backend/internal/core/domain"

	"gorm.io/gorm"
)

type EpisodeRepository interface {
	Create(episode *domain.Episode) error
	GetByID(id uint) (*domain.Episode, error)
	GetAll() ([]domain.Episode, error)
	Update(episode *domain.Episode) error
	Delete(id uint) error
	GetByAnimeID(animeID uint) ([]domain.Episode, error)
	GetLatestEpisodes(limit int) ([]domain.Episode, error)
}

func (r *SQLiteRepository) CreateEpisode(episode *domain.Episode) error {
	return r.db.Create(episode).Error
}

func (r *SQLiteRepository) GetEpisodeByID(id uint) (*domain.Episode, error) {
	var episode domain.Episode
	err := r.db.Preload("Anime").Preload("Servers").First(&episode, id).Error
	return &episode, err
}

func (r *SQLiteRepository) GetAllEpisodes() ([]domain.Episode, error) {
	var episodes []domain.Episode
	err := r.db.Preload("Anime").Preload("Servers").Find(&episodes).Error
	return episodes, err
}

func (r *SQLiteRepository) UpdateEpisode(episode *domain.Episode) error {
	// Explicitly update Servers association
	if err := r.db.Model(episode).Association("Servers").Replace(episode.Servers); err != nil {
		return err
	}
	return r.db.Save(episode).Error
}

func (r *SQLiteRepository) DeleteEpisode(id uint) error {
	return r.db.Delete(&domain.Episode{}, id).Error
}

func (r *SQLiteRepository) GetEpisodesByAnimeID(animeID uint) ([]domain.Episode, error) {
	var episodes []domain.Episode
	err := r.db.Preload("Servers").Where("anime_id = ?", animeID).Find(&episodes).Error
	return episodes, err
}

func (r *SQLiteRepository) GetLatestEpisodes(limit int) ([]domain.Episode, error) {
	var episodes []domain.Episode
	// Preload Anime and Servers
	err := r.db.Preload("Anime").Preload("Servers").Order("created_at desc").Limit(limit).Find(&episodes).Error
	return episodes, err
}

func (r *SQLiteRepository) SearchEpisodes(query string) ([]domain.Episode, error) {
	var episodes []domain.Episode
	searchPattern := "%" + query + "%"

	err := r.db.Preload("Anime").Preload("Servers").
		Joins("LEFT JOIN animes ON episodes.anime_id = animes.id").
		Where("episodes.title LIKE ? OR episodes.title_en LIKE ? OR animes.title LIKE ? OR animes.title_en LIKE ? OR CAST(episodes.episode_number AS TEXT) LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern, searchPattern).
		Order("episodes.created_at desc").
		Limit(50).
		Find(&episodes).Error

	return episodes, err
}

// IncrementEpisodeViews increments the views count for an episode
func (r *SQLiteRepository) IncrementEpisodeViews(episodeID uint) error {
	return r.db.Model(&domain.Episode{}).
		Where("id = ?", episodeID).
		UpdateColumn("views_count", gorm.Expr("views_count + 1")).Error
}
