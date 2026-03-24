CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '✅',
    color TEXT DEFAULT '#4CAF50',
    frequency TEXT DEFAULT 'daily',
    description TEXT DEFAULT '',
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(habit_id, completed_date)
);

CREATE TABLE streaks (
    habit_id UUID PRIMARY KEY REFERENCES habits(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    completion_rate_30d DECIMAL(5,2) DEFAULT 0,
    computed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weekly_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    total_completions INTEGER DEFAULT 0,
    total_possible INTEGER DEFAULT 0,
    computed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(profile_id, week_start)
);
