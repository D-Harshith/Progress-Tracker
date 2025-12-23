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
        const date = normalizeDate(req.params.date);
        const activity = await Activity.findOne({ date });

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
        const normalizedDate = normalizeDate(date);

        // Check if activity exists for this date
        let activity = await Activity.findOne({ date: normalizedDate });

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
        const date = normalizeDate(req.params.date);
        const { topic, duration, notes } = req.body;

        let activity = await Activity.findOne({ date });

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
        const date = normalizeDate(req.params.date);
        const result = await Activity.findOneAndDelete({ date });

        if (!result) {
            return res.status(404).json({ message: 'Activity not found for this date' });
        }

        res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
