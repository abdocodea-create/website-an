package service

import (
	"backend/internal/core/domain"
	"backend/internal/core/port"
)

type ServerService struct {
	repo port.ServerRepository
}

func NewServerService(repo port.ServerRepository) *ServerService {
	return &ServerService{repo: repo}
}

func (s *ServerService) Create(server *domain.Server) error {
	return s.repo.CreateServer(server)
}

func (s *ServerService) GetByID(id uint) (*domain.Server, error) {
	return s.repo.GetServerByID(id)
}

func (s *ServerService) GetAll(search string) ([]domain.Server, error) {
	return s.repo.GetAllServers(search)
}

func (s *ServerService) Update(server *domain.Server) error {
	return s.repo.UpdateServer(server)
}

func (s *ServerService) Delete(id uint) error {
	return s.repo.DeleteServer(id)
}
