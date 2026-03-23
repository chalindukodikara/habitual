// Copyright 2026 The OpenChoreo Authors
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler holds all HTTP handler methods.
type Handler struct {
	pool *pgxpool.Pool
}

// NewHandler creates a new Handler.
func NewHandler(pool *pgxpool.Pool) *Handler {
	return &Handler{pool: pool}
}

// RegisterRoutes registers all HTTP routes.
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/profiles", h.handleCreateProfile)
	mux.HandleFunc("GET /api/profiles/{id}", h.handleGetProfile)
	mux.HandleFunc("POST /api/profiles/{id}/habits", h.handleCreateHabit)
	mux.HandleFunc("GET /api/profiles/{id}/habits", h.handleListHabits)
	mux.HandleFunc("GET /api/profiles/{id}/today", h.handleGetToday)
	mux.HandleFunc("PATCH /api/habits/{id}", h.handleUpdateHabit)
	mux.HandleFunc("DELETE /api/habits/{id}", h.handleDeleteHabit)
	mux.HandleFunc("POST /api/habits/{id}/complete", h.handleToggleComplete)
	mux.HandleFunc("GET /api/profiles/{id}/heatmap", h.handleGetHeatmap)
	mux.HandleFunc("GET /api/profiles/{id}/stats", h.handleGetStats)
	mux.HandleFunc("GET /healthz", h.handleHealth)
}

func (h *Handler) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleCreateProfile(w http.ResponseWriter, r *http.Request) {
	var req CreateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.DisplayName == "" {
		writeError(w, http.StatusBadRequest, "displayName is required")
		return
	}

	profile, err := CreateProfile(r.Context(), h.pool, req)
	if err != nil {
		log.Printf("Error creating profile: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to create profile")
		return
	}

	writeJSON(w, http.StatusCreated, profile)
}

func (h *Handler) handleGetProfile(w http.ResponseWriter, r *http.Request) {
	profileID := r.PathValue("id")

	profile, err := GetProfile(r.Context(), h.pool, profileID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "profile not found")
			return
		}
		log.Printf("Error getting profile: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to get profile")
		return
	}

	writeJSON(w, http.StatusOK, profile)
}

func (h *Handler) handleCreateHabit(w http.ResponseWriter, r *http.Request) {
	profileID := r.PathValue("id")

	var req CreateHabitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	habit, err := CreateHabit(r.Context(), h.pool, profileID, req)
	if err != nil {
		log.Printf("Error creating habit: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to create habit")
		return
	}

	writeJSON(w, http.StatusCreated, habit)
}

func (h *Handler) handleListHabits(w http.ResponseWriter, r *http.Request) {
	profileID := r.PathValue("id")

	habits, err := ListHabits(r.Context(), h.pool, profileID)
	if err != nil {
		log.Printf("Error listing habits: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to list habits")
		return
	}

	writeJSON(w, http.StatusOK, habits)
}

func (h *Handler) handleGetToday(w http.ResponseWriter, r *http.Request) {
	profileID := r.PathValue("id")

	completions, err := GetTodayCompletions(r.Context(), h.pool, profileID)
	if err != nil {
		log.Printf("Error getting today completions: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to get today completions")
		return
	}

	writeJSON(w, http.StatusOK, completions)
}

func (h *Handler) handleUpdateHabit(w http.ResponseWriter, r *http.Request) {
	habitID := r.PathValue("id")

	var req UpdateHabitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	habit, err := UpdateHabit(r.Context(), h.pool, habitID, req)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "habit not found")
			return
		}
		log.Printf("Error updating habit: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to update habit")
		return
	}

	writeJSON(w, http.StatusOK, habit)
}

func (h *Handler) handleDeleteHabit(w http.ResponseWriter, r *http.Request) {
	habitID := r.PathValue("id")

	err := DeleteHabit(r.Context(), h.pool, habitID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "habit not found")
			return
		}
		log.Printf("Error deleting habit: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to delete habit")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) handleToggleComplete(w http.ResponseWriter, r *http.Request) {
	habitID := r.PathValue("id")

	var req CompleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// Allow empty body (defaults to today)
		req = CompleteRequest{}
	}

	dateStr := ""
	if req.Date != nil {
		dateStr = *req.Date
	}

	completion, err := ToggleCompletion(r.Context(), h.pool, habitID, dateStr)
	if err != nil {
		log.Printf("Error toggling completion: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to toggle completion")
		return
	}

	writeJSON(w, http.StatusOK, completion)
}

func (h *Handler) handleGetHeatmap(w http.ResponseWriter, r *http.Request) {
	profileID := r.PathValue("id")

	months := 12
	if m := r.URL.Query().Get("months"); m != "" {
		parsed, err := strconv.Atoi(m)
		if err == nil && parsed > 0 && parsed <= 24 {
			months = parsed
		}
	}

	entries, err := GetHeatmap(r.Context(), h.pool, profileID, months)
	if err != nil {
		log.Printf("Error getting heatmap: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to get heatmap data")
		return
	}

	writeJSON(w, http.StatusOK, entries)
}

func (h *Handler) handleGetStats(w http.ResponseWriter, r *http.Request) {
	profileID := r.PathValue("id")

	stats, err := GetStats(r.Context(), h.pool, profileID)
	if err != nil {
		log.Printf("Error getting stats: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to get stats")
		return
	}

	writeJSON(w, http.StatusOK, stats)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Error encoding JSON response: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
