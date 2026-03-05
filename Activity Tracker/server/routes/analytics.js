const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// Helper to convert wake time string to minutes
const wakeTimeToMinutes = (wakeTime) => {
    const [hours, minutes] = wakeTime.split(':').map(Number);
    return hours * 60 + minutes;
};

// Helper to convert minutes back to time string
const minutesToWakeTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Helper to get date range
const getDateRange = (period, offset = 0) => {
    const now = new Date();
    let startDate, endDate;

    if (period === 'week') {
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek - (offset * 7));
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59, 999);
    }

    return { startDate, endDate };
};

// Calculate stats for a period
const calculateStats = async (startDate, endDate) => {
    const activities = await Activity.find({
        date: { $gte: startDate, $lte: endDate }
    });

    if (activities.length === 0) {
        return {
            avgWakeTime: null,
            totalStudyHours: 0,
            totalDays: 0,
            avgStudyHoursPerDay: 0
        };
    }

    const totalWakeMinutes = activities.reduce((sum, act) => {
        return sum + wakeTimeToMinutes(act.wakeTime);
    }, 0);

    const totalStudyMinutes = activities.reduce((sum, act) => {
        return sum + act.totalStudyMinutes;
    }, 0);

    return {
        avgWakeTime: minutesToWakeTime(totalWakeMinutes / activities.length),
        totalStudyHours: parseFloat((totalStudyMinutes / 60).toFixed(1)),
        totalDays: activities.length,
        avgStudyHoursPerDay: parseFloat((totalStudyMinutes / 60 / activities.length).toFixed(1))
    };
};

// GET weekly stats
router.get('/weekly', async (req, res) => {
    try {
        const currentRange = getDateRange('week', 0);
        const previousRange = getDateRange('week', 1);

        const currentStats = await calculateStats(currentRange.startDate, currentRange.endDate);
        const previousStats = await calculateStats(previousRange.startDate, previousRange.endDate);

        // Calculate comparison
        const comparison = {
            wakeTime: null,
            studyHours: null
        };

        if (currentStats.avgWakeTime && previousStats.avgWakeTime) {
            const currentWakeMin = wakeTimeToMinutes(currentStats.avgWakeTime);
            const previousWakeMin = wakeTimeToMinutes(previousStats.avgWakeTime);
            comparison.wakeTime = {
                diff: previousWakeMin - currentWakeMin, // Positive = waking earlier
                improved: currentWakeMin < previousWakeMin
            };
        }

        if (previousStats.totalStudyHours > 0) {
            const diff = currentStats.totalStudyHours - previousStats.totalStudyHours;
            comparison.studyHours = {
                diff: parseFloat(diff.toFixed(1)),
                improved: diff > 0
            };
        }

        res.json({
            period: 'week',
            current: {
                ...currentStats,
                startDate: currentRange.startDate,
                endDate: currentRange.endDate
            },
            previous: {
                ...previousStats,
                startDate: previousRange.startDate,
                endDate: previousRange.endDate
            },
            comparison
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET monthly stats
router.get('/monthly', async (req, res) => {
    try {
        const currentRange = getDateRange('month', 0);
        const previousRange = getDateRange('month', 1);

        const currentStats = await calculateStats(currentRange.startDate, currentRange.endDate);
        const previousStats = await calculateStats(previousRange.startDate, previousRange.endDate);

        // Calculate comparison
        const comparison = {
            wakeTime: null,
            studyHours: null
        };

        if (currentStats.avgWakeTime && previousStats.avgWakeTime) {
            const currentWakeMin = wakeTimeToMinutes(currentStats.avgWakeTime);
            const previousWakeMin = wakeTimeToMinutes(previousStats.avgWakeTime);
            comparison.wakeTime = {
                diff: previousWakeMin - currentWakeMin,
                improved: currentWakeMin < previousWakeMin
            };
        }

        if (previousStats.totalStudyHours > 0) {
            const diff = currentStats.totalStudyHours - previousStats.totalStudyHours;
            comparison.studyHours = {
                diff: parseFloat(diff.toFixed(1)),
                improved: diff > 0
            };
        }

        res.json({
            period: 'month',
            current: {
                ...currentStats,
                startDate: currentRange.startDate,
                endDate: currentRange.endDate
            },
            previous: {
                ...previousStats,
                startDate: previousRange.startDate,
                endDate: previousRange.endDate
            },
            comparison
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET heatmap data (last 365 days)
router.get('/heatmap', async (req, res) => {
    try {
        // Use end of tomorrow UTC to ensure we catch all of today's entries regardless of timezone
        const endDate = new Date();
        endDate.setUTCDate(endDate.getUTCDate() + 1);
        endDate.setUTCHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setUTCHours(0, 0, 0, 0);

        const activities = await Activity.find({
            date: { $gte: startDate, $lte: endDate }
        }).select('date wakeTime totalStudyMinutes');

        // Helper to calculate study category based on hours
        const getStudyCategory = (minutes) => {
            const hours = minutes / 60;
            if (minutes === 0) return 'none';      // Red - no study
            if (hours < 1) return 'low';           // Pale green
            if (hours < 2) return 'medium';        // Light green
            if (hours < 4) return 'good';          // Green
            return 'high';                          // Bright green
        };

        // Create heatmap data with study-based categories
        const heatmapData = activities.map(act => ({
            date: act.date.toISOString().split('T')[0],
            wakeTime: act.wakeTime,
            studyMinutes: act.totalStudyMinutes,
            studyCategory: getStudyCategory(act.totalStudyMinutes)
        }));

        res.json(heatmapData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET streak data
router.get('/streak', async (req, res) => {
    try {
        // Get all activities sorted by date descending
        const activities = await Activity.find({})
            .sort({ date: -1 })
            .select('date totalStudyMinutes');

        if (activities.length === 0) {
            return res.json({ currentStreak: 0, longestStreak: 0 });
        }

        // Normalize dates to YYYY-MM-DD strings
        const loggedDates = new Set(
            activities.map(a => a.date.toISOString().split('T')[0])
        );

        // Calculate current streak (LeetCode-style)
        // Streak is alive if today OR yesterday is logged.
        // Start counting back from the most recent logged day.
        let currentStreak = 0;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Only count a streak if today or yesterday has an entry
        if (loggedDates.has(todayStr) || loggedDates.has(yesterdayStr)) {
            // Start from today if logged, otherwise from yesterday
            const checkDate = loggedDates.has(todayStr) ? new Date(today) : new Date(yesterday);

            while (true) {
                const dateStr = checkDate.toISOString().split('T')[0];
                if (loggedDates.has(dateStr)) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // Calculate longest streak
        const sortedDates = [...loggedDates].sort();
        let longestStreak = 0;
        let streak = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const prev = new Date(sortedDates[i - 1] + 'T12:00:00Z');
            const curr = new Date(sortedDates[i] + 'T12:00:00Z');
            const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                streak++;
            } else {
                longestStreak = Math.max(longestStreak, streak);
                streak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, streak);

        res.json({ currentStreak, longestStreak, totalDays: loggedDates.size });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
