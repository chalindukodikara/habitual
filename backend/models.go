// Copyright 2026 The OpenChoreo Authors
// SPDX-License-Identifier: Apache-2.0

package main

import "time"

// Profile represents a user profile.
type Profile struct {
	ID          string    `json:"id"`
	DisplayName string    `json:"displayName"`
	Timezone    string    `json:"timezone"`
	CreatedAt   time.Time `json:"createdAt"`
}

// CreateProfileRequest is the body for creating a new profile.
type CreateProfileRequest struct {
	DisplayName string  `json:"displayName"`
	Timezone    *string `json:"timezone,omitempty"`
}

// Habit represents a habit record.
type Habit struct {
	ID            string  `json:"id"`
	ProfileID     string  `json:"profileId"`
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	Icon          string  `json:"icon"`
	Color         string  `json:"color"`
	Frequency     string  `json:"frequency"`
	Archived      bool    `json:"archived"`
	CurrentStreak int     `json:"currentStreak"`
	LongestStreak int     `json:"longestStreak"`
	Rate30d       float64 `json:"rate30d"`
}

// CreateHabitRequest is the body for creating a new habit.
type CreateHabitRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	Icon        *string `json:"icon,omitempty"`
	Color       *string `json:"color,omitempty"`
	Frequency   *string `json:"frequency,omitempty"`
}

// UpdateHabitRequest is the body for updating a habit.
type UpdateHabitRequest struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
	Icon        *string `json:"icon,omitempty"`
	Color       *string `json:"color,omitempty"`
	Frequency   *string `json:"frequency,omitempty"`
	Archived    *bool   `json:"archived,omitempty"`
}

// CompleteRequest is the body for completing/uncompleting a habit.
type CompleteRequest struct {
	Date *string `json:"date,omitempty"` // YYYY-MM-DD, defaults to today
}

// Completion represents a habit completion record.
type Completion struct {
	ID            string `json:"id"`
	HabitID       string `json:"habitId"`
	CompletedDate string `json:"completedDate"`
	Toggled       string `json:"toggled"` // "completed" or "uncompleted"
}

// HeatmapEntry represents a single day in the heatmap.
type HeatmapEntry struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

// StatsResponse is the response for the stats endpoint.
type StatsResponse struct {
	WeeklyStats []WeeklyStat `json:"weeklyStats"`
	HabitRates  []HabitRate  `json:"habitRates"`
}

// WeeklyStat represents a single week's stats.
type WeeklyStat struct {
	WeekStart      string  `json:"weekStart"`
	CompletionRate float64 `json:"completionRate"`
}

// HabitRate represents a single habit's rate.
type HabitRate struct {
	HabitName     string  `json:"habitName"`
	Rate30d       float64 `json:"rate30d"`
	CurrentStreak int     `json:"currentStreak"`
	LongestStreak int     `json:"longestStreak"`
	Color         string  `json:"color"`
	Icon          string  `json:"icon"`
}
