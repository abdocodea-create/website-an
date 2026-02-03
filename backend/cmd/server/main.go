package main

import (
	"backend/config"
	"backend/internal/adapters/handler"
	"backend/internal/adapters/repository"
	"backend/internal/core/service"
	"backend/internal/middleware"
	"backend/internal/migration"
	"backend/internal/seeder"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Check if DB file exists to determine if we need to seed
	// We check BEFORE connecting because connecting might create the file (empty).
	_, err = os.Stat(cfg.DBUrl)
	isNewDB := os.IsNotExist(err)

	repo, err := repository.NewSQLiteRepository(cfg.DBUrl)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-seed if it was a new DB
	if isNewDB {
		log.Println("New database detected. Running auto-seeding...")
		seeder.SeedAll(repo.DB())
	}

	// ALWAYS run localhost cleanup migration (safe to run multiple times)
	log.Println("Running localhost URL cleanup migration...")
	if err := migration.CleanLocalhostURLs(repo.DB()); err != nil {
		log.Printf("Warning: Failed to clean localhost URLs: %v", err)
	}

	// Create reports table migration (safe to run multiple times)
	log.Println("Running reports table migration...")
	if err := migration.CreateReportsTable(repo.DB()); err != nil {
		log.Printf("Warning: Failed to create reports table: %v", err)
	}

	// Services
	authService := service.NewAuthService(repo, repo, cfg)
	userService := service.NewUserService(repo, repo)
	roleService := service.NewRoleService(repo, repo)
	permService := service.NewPermissionService(repo)
	typeService := service.NewTypeService(repo)
	seasonService := service.NewSeasonService(repo)
	studioService := service.NewStudioService(repo)
	languageService := service.NewLanguageService(repo)
	animeService := service.NewAnimeService(repo)
	episodeService := service.NewEpisodeService(repo)
	modelService := service.NewModelService(repo)
	categoryService := service.NewCategoryService(repo)

	exportService := service.NewExportService(cfg.BlenderPath, cfg.ExportDir, cfg.ExportTimeout)
	watchLaterService := service.NewWatchLaterService(repo)
	historyService := service.NewHistoryService(repo)

	// Handlers
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	roleHandler := handler.NewRoleHandler(roleService)
	permHandler := handler.NewPermissionHandler(permService)
	typeHandler := handler.NewTypeHandler(typeService)
	seasonHandler := handler.NewSeasonHandler(seasonService)
	studioHandler := handler.NewStudioHandler(studioService)
	languageHandler := handler.NewLanguageHandler(languageService)
	animeHandler := handler.NewAnimeHandler(animeService)
	// Create repositories first
	commentRepo := repository.NewCommentRepository(repo.DB())
	notifRepo := repository.NewNotificationRepository(repo.DB())
	episodeLikeRepo := repository.NewEpisodeLikeRepository(repo.DB())
	reportRepo := repository.NewReportRepository(repo.DB())

	// Then create handlers that depend on them
	episodeHandler := handler.NewEpisodeHandler(episodeService, repo, episodeLikeRepo)
	modelHandler := handler.NewModelHandler(modelService)
	categoryHandler := handler.NewCategoryHandler(categoryService)

	exportHandler := handler.NewExportHandler(exportService)
	uploadHandler := handler.NewUploadHandler()
	searchHandler := handler.NewSearchHandler(repo, repo, repo)
	watchLaterHandler := handler.NewWatchLaterHandler(watchLaterService)
	historyHandler := handler.NewHistoryHandler(historyService)

	// Comments & Notifications Handlers
	commentHandler := handler.NewCommentHandler(commentRepo, notifRepo, historyService)
	notifHandler := handler.NewNotificationHandler(notifRepo)
	reportHandler := handler.NewReportHandler(reportRepo)
	analyticsHandler := handler.NewAnalyticsHandler(repo)

	r := gin.Default()
	r.MaxMultipartMemory = 1024 << 20 // 1GB

	// CORS Setup - PERMISSIVE MODE (Fix for network access)
	r.Use(cors.New(cors.Config{
		// AllowAllOrigins: true, // CANNOT use '*' with AllowCredentials: true
		AllowOriginFunc:  func(origin string) bool { return true }, // Echoes the exact origin back
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	/*
		// Specific CORS (Commented out for now)
		rawOrigins := strings.Split(cfg.AllowOrigins, ",")
		var allowOrigins []string
		for _, o := range rawOrigins {
			allowOrigins = append(allowOrigins, strings.TrimSpace(o))
		}
		log.Printf("CORS: Allowing origins: %v", allowOrigins)

		r.Use(cors.New(cors.Config{
			AllowOrigins:     allowOrigins,
			AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
			ExposeHeaders:    []string{"Content-Length"},
			AllowCredentials: true,
		}))
	*/

	r.Static("/uploads", "./uploads")
	r.Static("/assets", "./dist/assets")
	r.Static("/custom-emojis", "./emoji")
	r.StaticFile("/favicon.ico", "./dist/favicon.ico")

	// SPA Handler: Serve index.html for unknown routes (except /api)
	r.NoRoute(func(c *gin.Context) {
		if !strings.HasPrefix(c.Request.URL.Path, "/api") {
			c.File("./dist/index.html")
		} else {
			c.JSON(404, gin.H{"error": "API route not found"})
		}
	})

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
		}

		// Health Check
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})

		// Version Check (for deployment verification)
		versionHandler := handler.NewVersionHandler()
		api.GET("/version", versionHandler.GetVersion)

		// --- Public Routes (No Auth Required) ---
		public := api.Group("/")
		{
			// General Search
			public.GET("/search", searchHandler.Search)

			// Anime Public (Read-Only)
			animes := public.Group("/animes")
			{
				animes.GET("", animeHandler.GetAll)
				animes.GET("/latest", animeHandler.GetLatest)
				animes.GET("/type/:type", animeHandler.GetByType)
				animes.GET("/search", animeHandler.Search)
				animes.GET("/:id", animeHandler.GetByID)
			}

			// Episode Public (Read-Only)
			episodes := public.Group("/episodes")
			{
				episodes.GET("", episodeHandler.GetAll)
				episodes.GET("/latest", episodeHandler.GetLatest)
				episodes.GET("/search", episodeHandler.Search)
				episodes.GET("/:id", episodeHandler.GetByID)
			}

			// Models Public
			models := public.Group("/models")
			models.GET("", modelHandler.GetAll)
			models.GET("/:id/download", modelHandler.Download)

			// Other Public Read-Only
			public.Group("/categories").GET("", categoryHandler.GetAll)
			public.Group("/types").GET("", typeHandler.GetAll)
			public.Group("/seasons").GET("", seasonHandler.GetAll)
			public.Group("/studios").GET("", studioHandler.GetAll)
			public.Group("/languages").GET("", languageHandler.GetAll)

			// Public export download
			public.POST("/export/sprint", exportHandler.GenerateSprint)
			public.GET("/export/download/:filename", exportHandler.Download)

			// Public Comments (Read-only)
			public.GET("/episodes/:id/comments", commentHandler.GetAllByEpisode)

			// Report Issue
			public.POST("/reports", reportHandler.CreateReport)
		}

		// --- Protected Routes (Auth Required) ---
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			protected.GET("/me", func(c *gin.Context) {
				userID, _ := c.Get("userID")
				role, _ := c.Get("role")
				c.JSON(200, gin.H{"id": userID, "role": role})
			})

			// User Profile Update
			protected.POST("/user/profile/update", userHandler.UpdateProfile)

			// Dashboard Routes
			dashboard := protected.Group("/dashboard")
			{
				dashboard.GET("/reports", reportHandler.GetAllReports)
				dashboard.GET("/comments", commentHandler.GetAllComments)
				dashboard.GET("/analytics/stats", analyticsHandler.GetGlobalStats)
				dashboard.GET("/analytics/top", analyticsHandler.GetTopContent)
			}

			// Admin/Protected Routes
			protected.Group("/users").GET("", userHandler.GetAll).POST("", userHandler.Create).PUT("/:id", userHandler.Update).DELETE("/:id", userHandler.Delete)
			protected.Group("/roles").GET("", roleHandler.GetAll).POST("", roleHandler.Create).PUT("/:id", roleHandler.Update).DELETE("/:id", roleHandler.Delete)
			protected.Group("/permissions").GET("", permHandler.GetAll).POST("", permHandler.Create).PUT("/:id", permHandler.Update).DELETE("/:id", permHandler.Delete)
			// protected.GET("/search", searchHandler.Search) // Search is public now

			// Write/Delete Operations for Models
			models := protected.Group("/models")
			models.POST("", modelHandler.Upload).PUT("/:id", modelHandler.Update).DELETE("/:id", modelHandler.Delete)

			protected.POST("/upload", uploadHandler.UploadFile)

			// Write Operations for Metadata
			protected.Group("/categories").POST("", categoryHandler.Create).PUT("/:id", categoryHandler.Update).DELETE("/:id", categoryHandler.Delete)
			protected.Group("/types").POST("", typeHandler.Create).PUT("/:id", typeHandler.Update).DELETE("/:id", typeHandler.Delete)
			protected.Group("/seasons").POST("", seasonHandler.Create).PUT("/:id", seasonHandler.Update).DELETE("/:id", seasonHandler.Delete)
			protected.Group("/studios").POST("", studioHandler.Create).PUT("/:id", studioHandler.Update).DELETE("/:id", studioHandler.Delete)
			protected.Group("/languages").POST("", languageHandler.Create).PUT("/:id", languageHandler.Update).DELETE("/:id", languageHandler.Delete)

			// Write Operations for Anime
			animes := protected.Group("/animes")
			animes.POST("", animeHandler.Create).PUT("/:id", animeHandler.Update).DELETE("/:id", animeHandler.Delete)

			// Write Operations for Episodes
			episodes := protected.Group("/episodes")
			episodes.POST("", episodeHandler.Create).PUT("/:id", episodeHandler.Update).DELETE("/:id", episodeHandler.Delete)

			// Watch Later Routes (Personal)
			watchLater := protected.Group("/watch-later")
			{
				watchLater.POST("", watchLaterHandler.Toggle)
				watchLater.GET("", watchLaterHandler.GetByUser)
				watchLater.GET("/check", watchLaterHandler.CheckStatus)
			}

			// History Routes (Personal)
			history := protected.Group("/history")
			{
				history.GET("", historyHandler.GetHistory)
				history.DELETE("", historyHandler.ClearHistory)
				history.POST("/track-episode", historyHandler.TrackEpisodeView)
				history.POST("/track-anime", historyHandler.TrackAnimeView)
			}

			// Comment Write Operations
			protected.POST("/episodes/:id/comments", commentHandler.Create)
			protected.POST("/comments/:id/like", commentHandler.ToggleLike)
			protected.PUT("/comments/:id", commentHandler.Update)
			protected.DELETE("/comments/:id", commentHandler.Delete)

			// Notification Routes (Personal)
			protected.GET("/notifications", notifHandler.GetUserNotifications)
			protected.POST("/notifications/:id/read", notifHandler.MarkRead)
			protected.POST("/notifications/read-all", notifHandler.MarkAllRead)

			// Episode Stats Routes
			protected.POST("/episodes/:id/view", episodeHandler.TrackView)
			protected.POST("/episodes/:id/reactions", episodeHandler.ToggleReaction)
			protected.GET("/episodes/:id/stats", episodeHandler.GetStats)
		}
	}

	r.Use(func(c *gin.Context) {
		log.Printf("Incoming: %s %s | Len: %d", c.Request.Method, c.Request.URL.Path, c.Request.ContentLength)
		c.Next()
	})

	srv := &http.Server{
		Addr:        ":" + cfg.Port,
		Handler:     r,
		ReadTimeout: 0, WriteTimeout: 0, IdleTimeout: 0,
	}

	log.Printf("Server running on port %s", cfg.Port)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
