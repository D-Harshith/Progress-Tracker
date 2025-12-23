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
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);

        const activities = await Activity.find({
            date: { $gte: startDate, $lte: endDate }
        }).select('date wakeTime totalStudyMinutes');

        // Create a map for easy lookup
        const heatmapData = activities.map(act => ({
            date: act.date.toISOString().split('T')[0],
            wakeTime: act.wakeTime,
            wakeCategory: act.wakeCategory,
            studyMinutes: act.totalStudyMinutes
        }));

        res.json(heatmapData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
