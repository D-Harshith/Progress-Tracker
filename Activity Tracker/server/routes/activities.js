const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// Helper to normalize date to start of day
const normalizeDate = (dateStr) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date;
};

// GET all activities (with optional date range filter)
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.date = {
                $gte: normalizeDate(startDate),
                $lte: normalizeDate(endDate)
            };
        }

        const activities = await Activity.find(query).sort({ date: -1 });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET single activity by date
router.get('/:date', async (req, res) => {
    try {
        // Parse the date string and create a range for that day (handles timezone issues)
        const dateStr = req.params.date; // Expected format: YYYY-MM-DD
        const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
        const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

        // Query for activities where date falls within the day range
        const activity = await Activity.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!activity) {
            return res.status(404).json({ message: 'Activity not found for this date' });
        }

        res.json(activity);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create or update activity
router.post('/', async (req, res) => {
    try {
        const { date, wakeTime, studySessions } = req.body;
        // Use UTC date to avoid timezone offset issues
        const dateStr = date; // Expected format: YYYY-MM-DD
        const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
        const endOfDay = new Date(dateStr + 'T23:59:59.999Z');
        const normalizedDate = new Date(dateStr + 'T12:00:00.000Z'); // Use noon UTC for storage

        // Check if activity exists for this date (using range query for timezone safety)
        let activity = await Activity.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (activity) {
            // Update existing activity
            activity.wakeTime = wakeTime;
            activity.studySessions = studySessions || [];
        } else {
            // Create new activity
            activity = new Activity({
                date: normalizedDate,
                wakeTime,
                studySessions: studySessions || []
            });
        }

        const savedActivity = await activity.save();
        res.status(201).json(savedActivity);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT add study session to existing activity
router.put('/:date/session', async (req, res) => {
    try {
        const dateStr = req.params.date;
        const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
        const endOfDay = new Date(dateStr + 'T23:59:59.999Z');
        const { topic, duration, notes } = req.body;

        let activity = await Activity.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!activity) {
            return res.status(404).json({ message: 'Activity not found for this date' });
        }

        activity.studySessions.push({ topic, duration, notes });
        const savedActivity = await activity.save();
        res.json(savedActivity);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE activity by date
router.delete('/:date', async (req, res) => {
    try {
        const dateStr = req.params.date;
        const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
        const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

        const result = await Activity.findOneAndDelete({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!result) {
            return res.status(404).json({ message: 'Activity not found for this date' });
        }

        res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
