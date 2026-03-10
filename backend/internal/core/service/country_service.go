package service

import (
	"backend/internal/core/domain"
	"backend/internal/core/port"
)

type CountryService struct {
	repo port.CountryRepository
}

func NewCountryService(repo port.CountryRepository) *CountryService {
	return &CountryService{repo: repo}
}

func (s *CountryService) Create(country *domain.Country) error {
	return s.repo.CreateCountry(country)
}

func (s *CountryService) GetByID(id uint) (*domain.Country, error) {
	return s.repo.GetCountryByID(id)
}

func (s *CountryService) GetAll(search string) ([]domain.Country, error) {
	return s.repo.GetAllCountries(search)
}

func (s *CountryService) Update(country *domain.Country) error {
	return s.repo.UpdateCountry(country)
}

func (s *CountryService) Delete(id uint) error {
	return s.repo.DeleteCountry(id)
}
