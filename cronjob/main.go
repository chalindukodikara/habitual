// Copyright 2026 The OpenChoreo Authors
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	ctx := context.Background()

	pool, err := connectDB(ctx)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()
	log.Println("Connected to database")

	if err := computeStreaks(ctx, pool); err != nil {
		log.Fatalf("Failed to compute streaks: %v", err)
	}

	if err := computeWeeklyStats(ctx, pool); err != nil {
		log.Fatalf("Failed to compute weekly stats: %v", err)
	}

	log.Println("Streak engine completed successfully")
}

func computeStreaks(ctx context.Context, pool *pgxpool.Pool) error {
	rows, err := pool.Query(ctx, `SELECT id FROM habits WHERE archived = false`)
	if err != nil {
		return fmt.Errorf("failed to list habits: %w", err)
	}
	defer rows.Close()

	var habitIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return fmt.Errorf("failed to scan habit id: %w", err)
		}
		habitIDs = append(habitIDs, id)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("failed to iterate habits: %w", err)
	}

	today := time.Now().UTC().Truncate(24 * time.Hour)

	for _, habitID := range habitIDs {
		currentStreak := 0
		// Start from day=0 (today) to include today's completions in the streak
		for day := 0; day <= 365; day++ {
			date := today.AddDate(0, 0, -day).Format("2006-01-02")
			var count int
			err := pool.QueryRow(ctx,
				`SELECT COUNT(*) FROM completions WHERE habit_id = $1 AND completed_date = $2`,
				habitID, date).Scan(&count)
			if err != nil {
				return fmt.Errorf("failed to check completion: %w", err)
			}
			if count == 0 {
				break
			}
			currentStreak++
		}

		var longestStreak int
		err := pool.QueryRow(ctx,
			`SELECT COALESCE(longest_streak, 0) FROM streaks WHERE habit_id = $1`, habitID,
		).Scan(&longestStreak)
		if err != nil {
			longestStreak = 0
		}
		if currentStreak > longestStreak {
			longestStreak = currentStreak
		}

		var completions30d int
		err = pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM completions
			 WHERE habit_id = $1 AND completed_date >= CURRENT_DATE - INTERVAL '30 days'`,
			habitID).Scan(&completions30d)
		if err != nil {
			return fmt.Errorf("failed to count 30d completions: %w", err)
		}
		rate30d := float64(completions30d) / 30.0 * 100

		_, err = pool.Exec(ctx,
			`INSERT INTO streaks (habit_id, current_streak, longest_streak, completion_rate_30d, computed_at)
			 VALUES ($1, $2, $3, $4, now())
			 ON CONFLICT (habit_id) DO UPDATE SET
			   current_streak = $2, longest_streak = $3, completion_rate_30d = $4, computed_at = now()`,
			habitID, currentStreak, longestStreak, rate30d)
		if err != nil {
			return fmt.Errorf("failed to upsert streaks for %s: %w", habitID, err)
		}

		log.Printf("Habit %s: streak=%d, longest=%d, rate=%.1f%%", habitID, currentStreak, longestStreak, rate30d)
	}

	return nil
}

func computeWeeklyStats(ctx context.Context, pool *pgxpool.Pool) error {
	rows, err := pool.Query(ctx, `SELECT id FROM profiles`)
	if err != nil {
		return fmt.Errorf("failed to list profiles: %w", err)
	}
	defer rows.Close()

	var profileIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return fmt.Errorf("failed to scan profile id: %w", err)
		}
		profileIDs = append(profileIDs, id)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("failed to iterate profiles: %w", err)
	}

	for _, profileID := range profileIDs {
		now := time.Now().UTC()
		weekStart := now.Truncate(24 * time.Hour)
		for weekStart.Weekday() != time.Monday {
			weekStart = weekStart.AddDate(0, 0, -1)
		}
		weekStartStr := weekStart.Format("2006-01-02")

		var totalCompletions int
		err := pool.QueryRow(ctx,
			`SELECT COUNT(*)
			 FROM completions c JOIN habits h ON c.habit_id = h.id
			 WHERE h.profile_id = $1 AND c.completed_date >= $2
			   AND c.completed_date < ($2::date + INTERVAL '7 days')`,
			profileID, weekStartStr).Scan(&totalCompletions)
		if err != nil {
			return fmt.Errorf("failed to count completions: %w", err)
		}

		var habitCount int
		err = pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM habits WHERE profile_id = $1 AND archived = false`,
			profileID).Scan(&habitCount)
		if err != nil {
			return fmt.Errorf("failed to count habits: %w", err)
		}

		totalPossible := habitCount * 7

		_, err = pool.Exec(ctx,
			`INSERT INTO weekly_stats (profile_id, week_start, total_completions, total_possible, computed_at)
			 VALUES ($1, $2, $3, $4, now())
			 ON CONFLICT (profile_id, week_start) DO UPDATE SET
			   total_completions = $3, total_possible = $4, computed_at = now()`,
			profileID, weekStartStr, totalCompletions, totalPossible)
		if err != nil {
			return fmt.Errorf("failed to upsert weekly stats: %w", err)
		}

		log.Printf("Profile %s week %s: %d/%d completions", profileID, weekStartStr, totalCompletions, totalPossible)
	}

	return nil
}

func connectDB(ctx context.Context) (*pgxpool.Pool, error) {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	dbName := getEnv("DB_NAME", "habitualdb")
	user := getEnv("DB_USER", "appuser")
	password := getEnv("DB_PASSWORD", "apppass")

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		url.QueryEscape(user), url.QueryEscape(password), host, port, dbName)

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return pool, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
