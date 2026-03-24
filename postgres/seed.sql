-- ============================================================
-- Habitual — Seed Data
-- ============================================================
-- Re-runnable: uses ON CONFLICT and cleans up before re-inserting.
-- Creates 1 demo profile, 8 habits, 180 days of completions,
-- pre-computed streaks, and 26 weeks of weekly stats.
--
-- To reseed: psql -U appuser -d habitualdb -f seed.sql
-- ============================================================

-- ============================================================
-- 1. Demo Profile
-- ============================================================
INSERT INTO profiles (id, display_name, timezone)
VALUES ('11111111-1111-4111-8111-111111111111', 'Demo User', 'UTC')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Habits (8 habits with varied frequencies and descriptions)
-- ============================================================
INSERT INTO habits (id, profile_id, name, description, icon, color, frequency) VALUES
    ('aaaa1111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111',
     'Exercise', '30 minutes of cardio or strength training', '💪', '#EF4444', 'daily'),
    ('aaaa2222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111',
     'Read 30min', 'Read at least 30 minutes of a book', '📚', '#3B82F6', 'daily'),
    ('aaaa3333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111',
     'Drink 2L Water', 'Drink at least 2 liters throughout the day', '💧', '#06B6D4', 'daily'),
    ('aaaa4444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111',
     'Meditate', '10 minutes of mindfulness meditation', '🧘', '#8B5CF6', 'daily'),
    ('aaaa5555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111',
     'No Social Media', 'Stay off social media for the entire day', '📵', '#F59E0B', 'daily'),
    ('aaaa6666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111',
     'Journal', 'Write at least one page in your journal', '📝', '#6366F1', 'daily'),
    ('aaaa7777-7777-4777-8777-777777777777', '11111111-1111-4111-8111-111111111111',
     'Eat Healthy', 'No junk food, eat whole foods only', '🥗', '#10B981', 'daily'),
    ('aaaa8888-8888-4888-8888-888888888888', '11111111-1111-4111-8111-111111111111',
     'Walk 10k Steps', 'Hit 10,000 steps by end of day', '🚶', '#EC4899', 'weekdays')
ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description,
    icon        = EXCLUDED.icon,
    color       = EXCLUDED.color,
    frequency   = EXCLUDED.frequency;

-- ============================================================
-- 3. Historical Completions (180 days)
-- ============================================================
-- Clean existing completions for demo habits before re-seeding
DELETE FROM completions WHERE habit_id IN (
    'aaaa1111-1111-4111-8111-111111111111',
    'aaaa2222-2222-4222-8222-222222222222',
    'aaaa3333-3333-4333-8333-333333333333',
    'aaaa4444-4444-4444-8444-444444444444',
    'aaaa5555-5555-4555-8555-555555555555',
    'aaaa6666-6666-4666-8666-666666666666',
    'aaaa7777-7777-4777-8777-777777777777',
    'aaaa8888-8888-4888-8888-888888888888'
);

-- Each habit has different weekday/weekend completion rates.
-- Uses hashtext() for deterministic pseudo-random patterns.

-- Exercise: 75% weekday, 50% Saturday, 25% Sunday
INSERT INTO completions (habit_id, completed_date)
SELECT 'aaaa1111-1111-4111-8111-111111111111', d::date
FROM generate_series(CURRENT_DATE - INTERVAL '179 days', CURRENT_DATE, '1 day') AS d
WHERE CASE
    WHEN EXTRACT(DOW FROM d::date) = 0 THEN abs(hashtext('exercise' || d::text)) % 100 < 25
    WHEN EXTRACT(DOW FROM d::date) = 6 THEN abs(hashtext('exercise' || d::text)) % 100 < 50
    ELSE abs(hashtext('exercise' || d::text)) % 100 < 75
END;

-- Read 30min: 88% weekday, 70% weekend (most consistent)
INSERT INTO completions (habit_id, completed_date)
SELECT 'aaaa2222-2222-4222-8222-222222222222', d::date
FROM generate_series(CURRENT_DATE - INTERVAL '179 days', CURRENT_DATE, '1 day') AS d
WHERE CASE
    WHEN EXTRACT(DOW FROM d::date) IN (0, 6) THEN abs(hashtext('read' || d::text)) % 100 < 70
    ELSE abs(hashtext('read' || d::text)) % 100 < 88
END;

-- Drink 2L Water: 75% weekday, 55% weekend
INSERT INTO completions (habit_id, completed_date)
SELECT 'aaaa3333-3333-4333-8333-333333333333', d::date
FROM generate_series(CURRENT_DATE - INTERVAL '179 days', CURRENT_DATE, '1 day') AS d
WHERE CASE
    WHEN EXTRACT(DOW FROM d::date) IN (0, 6) THEN abs(hashtext('water' || d::text)) % 100 < 55
    ELSE abs(hashtext('water' || d::text)) % 100 < 75
END;

-- Meditate: 70% weekday, 45% weekend
INSERT INTO completions (habit_id, completed_date)
SELECT 'aaaa4444-4444-4444-8444-444444444444', d::date
FROM generate_series(CURRENT_DATE - INTERVAL '179 days', CURRENT_DATE, '1 day') AS d
WHERE CASE
    WHEN EXTRACT(DOW FROM d::date) IN (0, 6) THEN abs(hashtext('meditate' || d::text)) % 100 < 45
    ELSE abs(hashtext('meditate' || d::text)) % 100 < 70
END;

-- No Social Media: 55% weekday, 30% weekend (least consistent)
INSERT INTO completions (habit_id, completed_date)
SELECT 'aaaa5555-5555-4555-8555-555555555555', d::date
FROM generate_series(CURRENT_DATE - INTERVAL '179 days', CURRENT_DATE, '1 day') AS d
WHERE CASE
    WHEN EXTRACT(DOW FROM d::date) IN (0, 6) THEN abs(hashtext('nosocial' || d::text)) % 100 < 30
    ELSE abs(hashtext('nosocial' || d::text)) % 100 < 55
END;

-- Journal: 90% weekday, 75% weekend (very consistent)
INSERT INTO completions (habit_id, completed_date)
SELECT 'aaaa6666-6666-4666-8666-666666666666', d::date
FROM generate_series(CURRENT_DATE - INTERVAL '179 days', CURRENT_DATE, '1 day') AS d
WHERE CASE
    WHEN EXTRACT(DOW FROM d::date) IN (0, 6) THEN abs(hashtext('journal' || d::text)) % 100 < 75
    ELSE abs(hashtext('journal' || d::text)) % 100 < 90
END;

-- Eat Healthy: 65% weekday, 45% weekend
INSERT INTO completions (habit_id, completed_date)
SELECT 'aaaa7777-7777-4777-8777-777777777777', d::date
FROM generate_series(CURRENT_DATE - INTERVAL '179 days', CURRENT_DATE, '1 day') AS d
WHERE CASE
    WHEN EXTRACT(DOW FROM d::date) IN (0, 6) THEN abs(hashtext('eathealthy' || d::text)) % 100 < 45
    ELSE abs(hashtext('eathealthy' || d::text)) % 100 < 65
END;

-- Walk 10k Steps: 80% weekday, 20% weekend (weekday-focused)
INSERT INTO completions (habit_id, completed_date)
SELECT 'aaaa8888-8888-4888-8888-888888888888', d::date
FROM generate_series(CURRENT_DATE - INTERVAL '179 days', CURRENT_DATE, '1 day') AS d
WHERE CASE
    WHEN EXTRACT(DOW FROM d::date) IN (0, 6) THEN abs(hashtext('walk10k' || d::text)) % 100 < 20
    ELSE abs(hashtext('walk10k' || d::text)) % 100 < 80
END;

-- ============================================================
-- 4. Pre-compute Streaks
-- ============================================================
INSERT INTO streaks (habit_id, current_streak, longest_streak, completion_rate_30d, computed_at)
SELECT
    h.id,
    COALESCE((
        SELECT COUNT(*)
        FROM generate_series(0, 89) AS n
        WHERE EXISTS (
            SELECT 1 FROM completions c
            WHERE c.habit_id = h.id
              AND c.completed_date = CURRENT_DATE - (n || ' days')::interval
        )
        AND NOT EXISTS (
            SELECT 1 FROM generate_series(0, n - 1) AS m
            WHERE NOT EXISTS (
                SELECT 1 FROM completions c
                WHERE c.habit_id = h.id
                  AND c.completed_date = CURRENT_DATE - (m || ' days')::interval
            )
        )
    ), 0),
    CASE h.name
        WHEN 'Journal'          THEN 18
        WHEN 'Read 30min'       THEN 14
        WHEN 'Walk 10k Steps'   THEN 10
        WHEN 'Drink 2L Water'   THEN 9
        WHEN 'Exercise'         THEN 8
        WHEN 'Meditate'         THEN 7
        WHEN 'Eat Healthy'      THEN 6
        WHEN 'No Social Media'  THEN 5
        ELSE 0
    END,
    ROUND(
        (SELECT COUNT(*)::decimal FROM completions c
         WHERE c.habit_id = h.id
           AND c.completed_date >= CURRENT_DATE - INTERVAL '30 days') / 30.0 * 100,
        2
    ),
    now()
FROM habits h
WHERE h.profile_id = '11111111-1111-4111-8111-111111111111'
ON CONFLICT (habit_id) DO UPDATE SET
    current_streak      = EXCLUDED.current_streak,
    longest_streak      = EXCLUDED.longest_streak,
    completion_rate_30d = EXCLUDED.completion_rate_30d,
    computed_at         = EXCLUDED.computed_at;

-- ============================================================
-- 5. Pre-compute Weekly Stats (last 26 weeks)
-- ============================================================
DELETE FROM weekly_stats
WHERE profile_id = '11111111-1111-4111-8111-111111111111';

INSERT INTO weekly_stats (profile_id, week_start, total_completions, total_possible, computed_at)
SELECT
    '11111111-1111-4111-8111-111111111111',
    week_start,
    (SELECT COUNT(*)
     FROM completions c
     JOIN habits h ON c.habit_id = h.id
     WHERE h.profile_id = '11111111-1111-4111-8111-111111111111'
       AND c.completed_date >= week_start
       AND c.completed_date < week_start + INTERVAL '7 days'),
    (SELECT COUNT(*) FROM habits
     WHERE profile_id = '11111111-1111-4111-8111-111111111111'
       AND NOT archived) * 7,
    now()
FROM generate_series(
    DATE_TRUNC('week', CURRENT_DATE - INTERVAL '25 weeks'),
    DATE_TRUNC('week', CURRENT_DATE),
    '1 week'
) AS week_start;
