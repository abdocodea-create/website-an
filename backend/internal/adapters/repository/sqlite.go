package repository

import (
	"backend/internal/core/domain"
	"backend/internal/core/port"
	"context"
	"fmt"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type SQLiteRepository struct {
	db *gorm.DB
}

// Ensure implementation
var _ port.UserRepository = &SQLiteRepository{}
var _ port.RoleRepository = &SQLiteRepository{}
var _ port.PermissionRepository = &SQLiteRepository{}
var _ port.ModelRepository = &SQLiteRepository{}
var _ port.CategoryRepository = &SQLiteRepository{}
var _ port.TypeRepository = &SQLiteRepository{}
var _ port.SeasonRepository = &SQLiteRepository{}
var _ port.StudioRepository = &SQLiteRepository{}
var _ port.LanguageRepository = &SQLiteRepository{}
var _ port.AnimeRepository = &SQLiteRepository{}

func (r *SQLiteRepository) DB() *gorm.DB {
	return r.db
}

func NewSQLiteRepository(dbUrl string) (*SQLiteRepository, error) {
	db, err := gorm.Open(sqlite.Open(dbUrl), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto Migrate
	err = db.AutoMigrate(
		&domain.User{}, &domain.Role{}, &domain.Permission{},
		&domain.Model{}, &domain.Category{}, &domain.Type{},
		&domain.Season{}, &domain.Studio{}, &domain.Language{},
		&domain.Anime{}, &domain.Episode{}, &domain.EpisodeServer{}, &domain.EpisodeLike{},
		&domain.Comment{}, &domain.CommentLike{}, &domain.Notification{},
		&domain.WatchLater{}, &domain.History{},
	)

	if err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	return &SQLiteRepository{db: db}, nil
}

// Ensure implementation
var _ port.UserRepository = &SQLiteRepository{}
var _ port.RoleRepository = &SQLiteRepository{}
var _ port.PermissionRepository = &SQLiteRepository{}

// --- User Repository ---

func (r *SQLiteRepository) CreateUser(user *domain.User) error {
	return r.db.Create(user).Error
}

func (r *SQLiteRepository) GetByEmail(email string) (*domain.User, error) {
	var user domain.User
	if err := r.db.Preload("Role").Preload("Role.Permissions").Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *SQLiteRepository) GetUserByID(id uint) (*domain.User, error) {
	var user domain.User
	if err := r.db.Preload("Role").Preload("Role.Permissions").First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *SQLiteRepository) GetAllUsers() ([]domain.User, error) {
	var users []domain.User
	if err := r.db.Preload("Role").Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *SQLiteRepository) UpdateUser(user *domain.User) error {
	return r.db.Save(user).Error
}

func (r *SQLiteRepository) DeleteUser(id uint) error {
	return r.db.Delete(&domain.User{}, id).Error
}

// --- Role Repository ---

func (r *SQLiteRepository) GetByName(name string) (*domain.Role, error) {
	var role domain.Role
	if err := r.db.Preload("Permissions").Where("name = ?", name).First(&role).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *SQLiteRepository) GetRoleByID(id uint) (*domain.Role, error) {
	var role domain.Role
	if err := r.db.Preload("Permissions").First(&role, id).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *SQLiteRepository) GetAllRoles() ([]domain.Role, error) {
	var roles []domain.Role
	if err := r.db.Preload("Permissions").Find(&roles).Error; err != nil {
		return nil, err
	}
	return roles, nil
}

func (r *SQLiteRepository) CreateRole(role *domain.Role) error {
	return r.db.Create(role).Error
}

func (r *SQLiteRepository) UpdateRole(role *domain.Role) error {
	// Explicitly update associations if Permissions slice is populated
	if err := r.db.Model(role).Association("Permissions").Replace(role.Permissions); err != nil {
		return err
	}
	// Update other fields
	return r.db.Save(role).Error
}

func (r *SQLiteRepository) DeleteRole(id uint) error {
	return r.db.Delete(&domain.Role{}, id).Error
}

// --- Permission Repository ---

func (r *SQLiteRepository) GetPermissionByID(id uint) (*domain.Permission, error) {
	var perm domain.Permission
	if err := r.db.First(&perm, id).Error; err != nil {
		return nil, err
	}
	return &perm, nil
}

func (r *SQLiteRepository) GetAllPermissions() ([]domain.Permission, error) {
	var perms []domain.Permission
	if err := r.db.Find(&perms).Error; err != nil {
		return nil, err
	}
	return perms, nil
}

func (r *SQLiteRepository) CreatePermission(perm *domain.Permission) error {
	return r.db.Create(perm).Error
}

func (r *SQLiteRepository) UpdatePermission(perm *domain.Permission) error {
	return r.db.Save(perm).Error
}

func (r *SQLiteRepository) DeletePermission(id uint) error {
	return r.db.Delete(&domain.Permission{}, id).Error
}

// --- Search Implementations ---

func (r *SQLiteRepository) SearchUsers(query string) ([]domain.User, error) {
	var users []domain.User
	likeQuery := "%" + query + "%"
	if err := r.db.Preload("Role").Where("name LIKE ? OR email LIKE ?", likeQuery, likeQuery).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *SQLiteRepository) SearchRoles(query string) ([]domain.Role, error) {
	var roles []domain.Role
	likeQuery := "%" + query + "%"
	if err := r.db.Preload("Permissions").Where("name LIKE ?", likeQuery).Find(&roles).Error; err != nil {
		return nil, err
	}
	return roles, nil
}

func (r *SQLiteRepository) SearchPermissions(query string) ([]domain.Permission, error) {
	var perms []domain.Permission
	err := r.db.Where("key LIKE ? OR description LIKE ?", "%"+query+"%", "%"+query+"%").Find(&perms).Error
	return perms, err
}

// Model Repository Implementation

func (r *SQLiteRepository) CreateModel(model *domain.Model) error {
	return r.db.Create(model).Error
}

func (r *SQLiteRepository) GetAllModels() ([]domain.Model, error) {
	var models []domain.Model
	err := r.db.Find(&models).Error
	return models, err
}

func (r *SQLiteRepository) GetModelByID(id uint) (*domain.Model, error) {
	var model domain.Model
	err := r.db.First(&model, id).Error
	if err != nil {
		return nil, err
	}
	return &model, nil
}

func (r *SQLiteRepository) UpdateModel(model *domain.Model) error {
	return r.db.Save(model).Error
}

func (r *SQLiteRepository) DeleteModel(id uint) error {
	return r.db.Delete(&domain.Model{}, id).Error
}

// Category Repository Implementation

func (r *SQLiteRepository) CreateCategory(category *domain.Category) error {
	return r.db.Create(category).Error
}

func (r *SQLiteRepository) GetAllCategories() ([]domain.Category, error) {
	var categories []domain.Category
	err := r.db.Find(&categories).Error
	return categories, err
}

func (r *SQLiteRepository) GetCategoryByID(id uint) (*domain.Category, error) {
	var category domain.Category
	err := r.db.First(&category, id).Error
	return &category, err
}

func (r *SQLiteRepository) UpdateCategory(category *domain.Category) error {
	return r.db.Save(category).Error
}

func (r *SQLiteRepository) DeleteCategory(id uint) error {
	return r.db.Delete(&domain.Category{}, id).Error
}

// --- Type Repository ---

func (r *SQLiteRepository) CreateType(t *domain.Type) error {
	return r.db.Create(t).Error
}

func (r *SQLiteRepository) GetTypeByID(id uint) (*domain.Type, error) {
	var t domain.Type
	err := r.db.First(&t, id).Error
	return &t, err
}

func (r *SQLiteRepository) GetAllTypes() ([]domain.Type, error) {
	var types []domain.Type
	err := r.db.Find(&types).Error
	return types, err
}

func (r *SQLiteRepository) UpdateType(t *domain.Type) error {
	return r.db.Save(t).Error
}

func (r *SQLiteRepository) DeleteType(id uint) error {
	return r.db.Delete(&domain.Type{}, id).Error
}

// --- Season Repository ---

func (r *SQLiteRepository) CreateSeason(s *domain.Season) error {
	return r.db.Create(s).Error
}

func (r *SQLiteRepository) GetSeasonByID(id uint) (*domain.Season, error) {
	var s domain.Season
	err := r.db.First(&s, id).Error
	return &s, err
}

func (r *SQLiteRepository) GetAllSeasons() ([]domain.Season, error) {
	var seasons []domain.Season
	err := r.db.Find(&seasons).Error
	return seasons, err
}

func (r *SQLiteRepository) UpdateSeason(s *domain.Season) error {
	return r.db.Save(s).Error
}

func (r *SQLiteRepository) DeleteSeason(id uint) error {
	return r.db.Delete(&domain.Season{}, id).Error
}

// --- Studio Repository ---

func (r *SQLiteRepository) CreateStudio(s *domain.Studio) error {
	return r.db.Create(s).Error
}

func (r *SQLiteRepository) GetStudioByID(id uint) (*domain.Studio, error) {
	var s domain.Studio
	err := r.db.First(&s, id).Error
	return &s, err
}

func (r *SQLiteRepository) GetAllStudios() ([]domain.Studio, error) {
	var studios []domain.Studio
	err := r.db.Find(&studios).Error
	return studios, err
}

func (r *SQLiteRepository) UpdateStudio(s *domain.Studio) error {
	return r.db.Save(s).Error
}

func (r *SQLiteRepository) DeleteStudio(id uint) error {
	return r.db.Delete(&domain.Studio{}, id).Error
}

// --- Language Repository ---

func (r *SQLiteRepository) CreateLanguage(l *domain.Language) error {
	return r.db.Create(l).Error
}

func (r *SQLiteRepository) GetLanguageByID(id uint) (*domain.Language, error) {
	var l domain.Language
	err := r.db.First(&l, id).Error
	return &l, err
}

func (r *SQLiteRepository) GetAllLanguages() ([]domain.Language, error) {
	var languages []domain.Language
	err := r.db.Find(&languages).Error
	return languages, err
}

func (r *SQLiteRepository) UpdateLanguage(l *domain.Language) error {
	return r.db.Save(l).Error
}

func (r *SQLiteRepository) DeleteLanguage(id uint) error {
	return r.db.Delete(&domain.Language{}, id).Error
}

// --- Anime Repository ---

func (r *SQLiteRepository) CreateAnime(anime *domain.Anime) error {
	return r.db.Create(anime).Error
}

func (r *SQLiteRepository) GetAnimeByID(id uint) (*domain.Anime, error) {
	var anime domain.Anime
	err := r.db.Preload("Categories").Preload("Season").Preload("Studio").Preload("LanguageRel").First(&anime, id).Error
	return &anime, err
}

func (r *SQLiteRepository) GetAllAnimes() ([]domain.Anime, error) {
	var animes []domain.Anime
	err := r.db.Preload("Categories").Preload("Season").Preload("Studio").Preload("LanguageRel").Find(&animes).Error
	return animes, err
}

func (r *SQLiteRepository) UpdateAnime(anime *domain.Anime) error {
	return r.db.Save(anime).Error
}

func (r *SQLiteRepository) DeleteAnime(id uint) error {
	return r.db.Delete(&domain.Anime{}, id).Error
}

func (r *SQLiteRepository) GetLatestAnimes(limit int) ([]domain.Anime, error) {
	var animes []domain.Anime
	err := r.db.Preload("Categories").Preload("Season").Preload("Studio").Preload("LanguageRel").Order("created_at desc").Limit(limit).Find(&animes).Error
	return animes, err
}

func (r *SQLiteRepository) GetAnimesByType(animeType string, limit int) ([]domain.Anime, error) {
	var animes []domain.Anime
	query := r.db.Preload("Categories").Preload("Season").Preload("Studio").Preload("LanguageRel").Where("type = ?", animeType).Order("created_at desc")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&animes).Error
	return animes, err
}

func (r *SQLiteRepository) SearchAnimes(query string) ([]domain.Anime, error) {
	var animes []domain.Anime
	searchPattern := "%" + query + "%"

	err := r.db.Preload("Categories").Preload("Season").Preload("Studio").Preload("LanguageRel").
		Where("title LIKE ? OR title_en LIKE ?", searchPattern, searchPattern).
		Order("created_at desc").
		Limit(50).
		Find(&animes).Error

	return animes, err
}

func (r *SQLiteRepository) GetGlobalStats(ctx context.Context) (map[string]int64, error) {
	var stats = make(map[string]int64)

	var totalViews int64
	// Handle NULL sum
	if err := r.db.WithContext(ctx).Model(&domain.Episode{}).Select("COALESCE(SUM(views_count), 0)").Scan(&totalViews).Error; err != nil {
		return nil, err
	}
	stats["total_views"] = totalViews

	var totalAnimes int64
	if err := r.db.WithContext(ctx).Model(&domain.Anime{}).Count(&totalAnimes).Error; err != nil {
		return nil, err
	}
	stats["total_animes"] = totalAnimes

	var totalEpisodes int64
	if err := r.db.WithContext(ctx).Model(&domain.Episode{}).Count(&totalEpisodes).Error; err != nil {
		return nil, err
	}
	stats["total_episodes"] = totalEpisodes

	var totalReports int64
	if err := r.db.WithContext(ctx).Model(&domain.Report{}).Count(&totalReports).Error; err != nil {
		return nil, err
	}
	stats["total_reports"] = totalReports

	var totalUsers int64
	if err := r.db.WithContext(ctx).Model(&domain.User{}).Count(&totalUsers).Error; err != nil {
		return nil, err
	}
	stats["total_users"] = totalUsers

	return stats, nil
}

func (r *SQLiteRepository) GetTopEpisodes(ctx context.Context, limit int) ([]domain.Episode, error) {
	var episodes []domain.Episode
	err := r.db.WithContext(ctx).Preload("Anime").Order("views_count desc").Limit(limit).Find(&episodes).Error
	return episodes, err
}

func (r *SQLiteRepository) GetTopAnimes(ctx context.Context, limit int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	// Complex query to sum episode views per anime
	// Returning map so we don't mess with domain struct
	rows, err := r.db.WithContext(ctx).Table("animes").
		Select("animes.id, animes.title, animes.title_en, animes.image, animes.cover, COALESCE(SUM(episodes.views_count), 0) as total_views").
		Joins("LEFT JOIN episodes ON episodes.anime_id = animes.id").
		Group("animes.id").
		Order("total_views desc").
		Limit(limit).
		Rows()

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id uint
		var title, titleEn, image, cover string
		var totalViews int64
		if err := rows.Scan(&id, &title, &titleEn, &image, &cover, &totalViews); err != nil {
			continue
		}
		results = append(results, map[string]interface{}{
			"id":          id,
			"title":       title,
			"title_en":    titleEn,
			"image":       image,
			"cover":       cover,
			"total_views": totalViews,
		})
	}

	return results, nil
}
