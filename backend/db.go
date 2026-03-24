// Copyright 2026 The OpenChoreo Authors
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ConnectDB creates a connection pool to the PostgreSQL database.
// It retries the connection up to 30 times with a 2-second delay between attempts.
func ConnectDB(ctx context.Context) (*pgxpool.Pool, error) {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	dbName := getEnv("DB_NAME", "habitualdb")
	user := getEnv("DB_USER", "appuser")
	password := getEnv("DB_PASSWORD", "apppass")

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		url.QueryEscape(user), url.QueryEscape(password), host, port, dbName)

	maxRetries := 30
	for i := range maxRetries {
		pool, err := pgxpool.New(ctx, dsn)
		if err != nil {
			log.Printf("Attempt %d/%d: failed to create connection pool: %v", i+1, maxRetries, err)
			time.Sleep(2 * time.Second)
			continue
		}

		if err := pool.Ping(ctx); err != nil {
			pool.Close()
			log.Printf("Attempt %d/%d: waiting for database... %v", i+1, maxRetries, err)
			time.Sleep(2 * time.Second)
			continue
		}

		return pool, nil
	}

	return nil, fmt.Errorf("failed to connect to database after %d attempts", maxRetries)
}

// CreateProfile inserts a new profile into the database.
func CreateProfile(ctx context.Context, pool *pgxpool.Pool, req CreateProfileRequest) (*Profile, error) {
	tz := "UTC"
	if req.Timezone != nil {
		tz = *req.Timezone
	}

	var p Profile
	err := pool.QueryRow(ctx,
		`INSERT INTO profiles (display_name, timezone)
		 VALUES ($1, $2)
		 RETURNING id, display_name, timezone, created_at`,
		req.DisplayName, tz,
	).Scan(&p.ID, &p.DisplayName, &p.Timezone, &p.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert profile: %w", err)
	}

	return &p, nil
}

// GetProfile retrieves a profile by ID.
func GetProfile(ctx context.Context, pool *pgxpool.Pool, profileID string) (*Profile, error) {
	var p Profile
	err := pool.QueryRow(ctx,
		`SELECT id, display_name, timezone, created_at FROM profiles WHERE id = $1`, profileID,
	).Scan(&p.ID, &p.DisplayName, &p.Timezone, &p.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get profile: %w", err)
	}

	return &p, nil
}

// CreateHabit inserts a new habit for a profile.
func CreateHabit(ctx context.Context, pool *pgxpool.Pool, profileID string, req CreateHabitRequest) (*Habit, error) {
	icon := "✅"
	if req.Icon != nil {
		icon = *req.Icon
	}
	color := "#4CAF50"
	if req.Color != nil {
		color = *req.Color
	}
	frequency := "daily"
	if req.Frequency != nil {
		frequency = *req.Frequency
	}
	description := ""
	if req.Description != nil {
		description = *req.Description
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	var h Habit
	err = tx.QueryRow(ctx,
		`INSERT INTO habits (profile_id, name, description, icon, color, frequency)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, profile_id, name, description, icon, color, frequency, archived`,
		profileID, req.Name, description, icon, color, frequency,
	).Scan(&h.ID, &h.ProfileID, &h.Name, &h.Description, &h.Icon, &h.Color, &h.Frequency, &h.Archived)
	if err != nil {
		return nil, fmt.Errorf("failed to insert habit: %w", err)
	}

	// Initialize streaks row
	_, err = tx.Exec(ctx,
		`INSERT INTO streaks (habit_id, current_streak, longest_streak, completion_rate_30d)
		 VALUES ($1, 0, 0, 0)`, h.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize streaks: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &h, nil
}

// ListHabits returns all habits for a profile with streak data.
func ListHabits(ctx context.Context, pool *pgxpool.Pool, profileID string) ([]Habit, error) {
	rows, err := pool.Query(ctx,
		`SELECT h.id, h.profile_id, h.name, h.description, h.icon, h.color, h.frequency, h.archived,
		        COALESCE(s.current_streak, 0), COALESCE(s.longest_streak, 0),
		        COALESCE(s.completion_rate_30d, 0)
		 FROM habits h
		 LEFT JOIN streaks s ON s.habit_id = h.id
		 WHERE h.profile_id = $1
		 ORDER BY h.created_at ASC`, profileID)
	if err != nil {
		return nil, fmt.Errorf("failed to query habits: %w", err)
	}
	defer rows.Close()

	var habits []Habit
	for rows.Next() {
		var h Habit
		if err := rows.Scan(&h.ID, &h.ProfileID, &h.Name, &h.Description, &h.Icon, &h.Color,
			&h.Frequency, &h.Archived, &h.CurrentStreak, &h.LongestStreak, &h.Rate30d); err != nil {
			return nil, fmt.Errorf("failed to scan habit: %w", err)
		}
		habits = append(habits, h)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate habits: %w", err)
	}

	if habits == nil {
		habits = []Habit{}
	}

	return habits, nil
}

// UpdateHabit updates a habit.
func UpdateHabit(ctx context.Context, pool *pgxpool.Pool, habitID string, req UpdateHabitRequest) (*Habit, error) {
	// Build dynamic update
	setClauses := ""
	args := []any{habitID}
	argIdx := 2

	if req.Name != nil {
		setClauses += fmt.Sprintf("name = $%d, ", argIdx)
		args = append(args, *req.Name)
		argIdx++
	}
	if req.Description != nil {
		setClauses += fmt.Sprintf("description = $%d, ", argIdx)
		args = append(args, *req.Description)
		argIdx++
	}
	if req.Icon != nil {
		setClauses += fmt.Sprintf("icon = $%d, ", argIdx)
		args = append(args, *req.Icon)
		argIdx++
	}
	if req.Color != nil {
		setClauses += fmt.Sprintf("color = $%d, ", argIdx)
		args = append(args, *req.Color)
		argIdx++
	}
	if req.Frequency != nil {
		setClauses += fmt.Sprintf("frequency = $%d, ", argIdx)
		args = append(args, *req.Frequency)
		argIdx++
	}
	if req.Archived != nil {
		setClauses += fmt.Sprintf("archived = $%d, ", argIdx)
		args = append(args, *req.Archived)
		argIdx++
	}

	if setClauses == "" {
		// Nothing to update, just return the current habit
		return getHabitByID(ctx, pool, habitID)
	}

	// Remove trailing comma and space
	setClauses = setClauses[:len(setClauses)-2]

	query := fmt.Sprintf(
		`UPDATE habits SET %s WHERE id = $1
		 RETURNING id, profile_id, name, description, icon, color, frequency, archived`, setClauses)

	var h Habit
	err := pool.QueryRow(ctx, query, args...).Scan(
		&h.ID, &h.ProfileID, &h.Name, &h.Description, &h.Icon, &h.Color, &h.Frequency, &h.Archived)
	if err != nil {
		return nil, fmt.Errorf("failed to update habit: %w", err)
	}

	return &h, nil
}

// DeleteHabit deletes a habit by ID.
func DeleteHabit(ctx context.Context, pool *pgxpool.Pool, habitID string) error {
	result, err := pool.Exec(ctx, `DELETE FROM habits WHERE id = $1`, habitID)
	if err != nil {
		return fmt.Errorf("failed to delete habit: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("habit not found")
	}
	return nil
}

func getHabitByID(ctx context.Context, pool *pgxpool.Pool, habitID string) (*Habit, error) {
	var h Habit
	err := pool.QueryRow(ctx,
		`SELECT h.id, h.profile_id, h.name, h.description, h.icon, h.color, h.frequency, h.archived,
		        COALESCE(s.current_streak, 0), COALESCE(s.longest_streak, 0),
		        COALESCE(s.completion_rate_30d, 0)
		 FROM habits h
		 LEFT JOIN streaks s ON s.habit_id = h.id
		 WHERE h.id = $1`, habitID,
	).Scan(&h.ID, &h.ProfileID, &h.Name, &h.Description, &h.Icon, &h.Color,
		&h.Frequency, &h.Archived, &h.CurrentStreak, &h.LongestStreak, &h.Rate30d)
	if err != nil {
		return nil, fmt.Errorf("failed to get habit: %w", err)
	}

	return &h, nil
}

// ToggleCompletion toggles a habit completion for a given date.
// If already completed, it deletes the completion. Otherwise, it creates one.
// Uses a transaction to prevent race conditions on concurrent requests.
func ToggleCompletion(ctx context.Context, pool *pgxpool.Pool, habitID string, dateStr string) (*Completion, error) {
	if dateStr == "" {
		dateStr = time.Now().UTC().Format("2006-01-02")
	}

	// Parse date to validate
	_, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return nil, fmt.Errorf("invalid date format, expected YYYY-MM-DD: %w", err)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// Check if completion already exists (within transaction for atomicity)
	var existingID string
	err = tx.QueryRow(ctx,
		`SELECT id FROM completions WHERE habit_id = $1 AND completed_date = $2 FOR UPDATE`,
		habitID, dateStr,
	).Scan(&existingID)

	if err == nil {
		// Exists, delete it
		_, err = tx.Exec(ctx, `DELETE FROM completions WHERE id = $1`, existingID)
		if err != nil {
			return nil, fmt.Errorf("failed to delete completion: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
		return &Completion{
			ID:            existingID,
			HabitID:       habitID,
			CompletedDate: dateStr,
			Toggled:       "uncompleted",
		}, nil
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("failed to check completion: %w", err)
	}

	// Does not exist, create it
	var c Completion
	err = tx.QueryRow(ctx,
		`INSERT INTO completions (habit_id, completed_date)
		 VALUES ($1, $2)
		 RETURNING id, habit_id, completed_date`,
		habitID, dateStr,
	).Scan(&c.ID, &c.HabitID, &c.CompletedDate)
	if err != nil {
		return nil, fmt.Errorf("failed to insert completion: %w", err)
	}
	c.Toggled = "completed"

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &c, nil
}

// GetHeatmap returns daily completion counts for a profile over a given number of months.
func GetHeatmap(ctx context.Context, pool *pgxpool.Pool, profileID string, months int) ([]HeatmapEntry, error) {
	if months <= 0 {
		months = 12
	}

	rows, err := pool.Query(ctx,
		`SELECT c.completed_date, COUNT(*) AS cnt
		 FROM completions c
		 JOIN habits h ON c.habit_id = h.id
		 WHERE h.profile_id = $1
		   AND h.archived = false
		   AND c.completed_date >= CURRENT_DATE - ($2 || ' months')::interval
		 GROUP BY c.completed_date
		 ORDER BY c.completed_date ASC`,
		profileID, strconv.Itoa(months))
	if err != nil {
		return nil, fmt.Errorf("failed to query heatmap: %w", err)
	}
	defer rows.Close()

	var entries []HeatmapEntry
	for rows.Next() {
		var e HeatmapEntry
		var d time.Time
		if err := rows.Scan(&d, &e.Count); err != nil {
			return nil, fmt.Errorf("failed to scan heatmap entry: %w", err)
		}
		e.Date = d.Format("2006-01-02")
		entries = append(entries, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate heatmap: %w", err)
	}

	if entries == nil {
		entries = []HeatmapEntry{}
	}

	return entries, nil
}

// GetStats returns weekly stats and per-habit rates for a profile.
func GetStats(ctx context.Context, pool *pgxpool.Pool, profileID string) (*StatsResponse, error) {
	// Weekly stats
	weekRows, err := pool.Query(ctx,
		`SELECT week_start,
		        CASE WHEN total_possible > 0
		             THEN ROUND(total_completions::decimal / total_possible * 100, 1)
		             ELSE 0 END AS completion_rate
		 FROM weekly_stats
		 WHERE profile_id = $1
		 ORDER BY week_start DESC
		 LIMIT 12`, profileID)
	if err != nil {
		return nil, fmt.Errorf("failed to query weekly stats: %w", err)
	}
	defer weekRows.Close()

	var weeklyStats []WeeklyStat
	for weekRows.Next() {
		var ws WeeklyStat
		var d time.Time
		if err := weekRows.Scan(&d, &ws.CompletionRate); err != nil {
			return nil, fmt.Errorf("failed to scan weekly stat: %w", err)
		}
		ws.WeekStart = d.Format("2006-01-02")
		weeklyStats = append(weeklyStats, ws)
	}
	if err := weekRows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate weekly stats: %w", err)
	}

	if weeklyStats == nil {
		weeklyStats = []WeeklyStat{}
	}

	// Reverse to get chronological order
	for i, j := 0, len(weeklyStats)-1; i < j; i, j = i+1, j-1 {
		weeklyStats[i], weeklyStats[j] = weeklyStats[j], weeklyStats[i]
	}

	// Per-habit rates
	habitRows, err := pool.Query(ctx,
		`SELECT h.name, h.color, h.icon,
		        COALESCE(s.completion_rate_30d, 0),
		        COALESCE(s.current_streak, 0),
		        COALESCE(s.longest_streak, 0)
		 FROM habits h
		 LEFT JOIN streaks s ON s.habit_id = h.id
		 WHERE h.profile_id = $1 AND h.archived = false
		 ORDER BY s.completion_rate_30d DESC NULLS LAST`, profileID)
	if err != nil {
		return nil, fmt.Errorf("failed to query habit rates: %w", err)
	}
	defer habitRows.Close()

	var habitRates []HabitRate
	for habitRows.Next() {
		var hr HabitRate
		if err := habitRows.Scan(&hr.HabitName, &hr.Color, &hr.Icon,
			&hr.Rate30d, &hr.CurrentStreak, &hr.LongestStreak); err != nil {
			return nil, fmt.Errorf("failed to scan habit rate: %w", err)
		}
		habitRates = append(habitRates, hr)
	}
	if err := habitRows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate habit rates: %w", err)
	}

	if habitRates == nil {
		habitRates = []HabitRate{}
	}

	return &StatsResponse{
		WeeklyStats: weeklyStats,
		HabitRates:  habitRates,
	}, nil
}

// GetTodayCompletions returns all completions for a profile for today.
func GetTodayCompletions(ctx context.Context, pool *pgxpool.Pool, profileID string) (map[string]bool, error) {
	today := time.Now().UTC().Format("2006-01-02")

	rows, err := pool.Query(ctx,
		`SELECT c.habit_id
		 FROM completions c
		 JOIN habits h ON c.habit_id = h.id
		 WHERE h.profile_id = $1
		   AND c.completed_date = $2`, profileID, today)
	if err != nil {
		return nil, fmt.Errorf("failed to query today completions: %w", err)
	}
	defer rows.Close()

	result := make(map[string]bool)
	for rows.Next() {
		var habitID string
		if err := rows.Scan(&habitID); err != nil {
			return nil, fmt.Errorf("failed to scan completion: %w", err)
		}
		result[habitID] = true
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate completions: %w", err)
	}

	return result, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
