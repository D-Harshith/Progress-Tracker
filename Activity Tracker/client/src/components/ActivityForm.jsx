import { useState } from 'react';
import { activitiesApi } from '../services/api';

// Get local date string in YYYY-MM-DD format (avoids UTC timezone issues)
const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function ActivityForm({ onActivitySaved }) {
    const [formData, setFormData] = useState({
        date: getLocalDateString(),
        wakeTime: '06:00',
        studySessions: []
    });

    const [newSession, setNewSession] = useState({
        topic: '',
        hours: 0,
        minutes: 30,
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addSession = () => {
        if (!newSession.topic.trim()) {
            setError('Please enter a topic name');
            return;
        }
        const totalMinutes = (newSession.hours * 60) + newSession.minutes;
        if (totalMinutes < 1) {
            setError('Duration must be at least 1 minute');
            return;
        }

        setFormData(prev => ({
            ...prev,
            studySessions: [...prev.studySessions, {
                topic: newSession.topic.trim(),
                duration: totalMinutes,
                notes: newSession.notes.trim()
            }]
        }));

        setNewSession({ topic: '', hours: 0, minutes: 30, notes: '' });
        setError(null);
    };

    const removeSession = (index) => {
        setFormData(prev => ({
            ...prev,
            studySessions: prev.studySessions.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.wakeTime) {
            setError('Please enter your wake time');
            return;
        }

        // Auto-add current session if topic is filled but not added yet
        let sessionsToSave = [...formData.studySessions];
        const pendingDuration = (newSession.hours * 60) + newSession.minutes;
        if (newSession.topic.trim() && pendingDuration >= 1) {
            sessionsToSave.push({
                topic: newSession.topic.trim(),
                duration: pendingDuration,
                notes: newSession.notes.trim()
            });
        }

        if (sessionsToSave.length === 0) {
            setError('Please add at least one study session');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await activitiesApi.save({
                ...formData,
                studySessions: sessionsToSave
            });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);

            // Reset form
            setFormData({
                date: getLocalDateString(),
                wakeTime: '06:00',
                studySessions: []
            });
            setNewSession({ topic: '', hours: 0, minutes: 30, notes: '' });

            // Notify parent to refresh data
            if (onActivitySaved) {
                onActivitySaved();
            }
        } catch (err) {
            setError(err.message || 'Failed to save activity');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
        if (hours > 0) return `${hours}h`;
        return `${mins}m`;
    };

    // Calculate total study time
    const pendingDuration = newSession.topic.trim() ? (newSession.hours * 60) + newSession.minutes : 0;
    const totalMinutes = formData.studySessions.reduce((sum, s) => sum + s.duration, 0) + pendingDuration;

    return (
        <div className="activity-form">
            <h2>Log Activity</h2>

            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="date">Date</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="wakeTime">Wake Time</label>
                        <input
                            type="time"
                            id="wakeTime"
                            name="wakeTime"
                            value={formData.wakeTime}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                </div>

                <div className="sessions-section">
                    <h3>Study Sessions {totalMinutes > 0 && <span className="total-badge">{formatDuration(totalMinutes)} total</span>}</h3>

                    {formData.studySessions.length > 0 && (
                        <div className="sessions-preview">
                            {formData.studySessions.map((session, index) => (
                                <div key={index} className="session-tag">
                                    <span>{session.topic}</span>
                                    <span className="session-duration">{formatDuration(session.duration)}</span>
                                    {session.notes && <span className="session-note-indicator" title={session.notes}>*</span>}
                                    <button
                                        type="button"
                                        className="remove-session"
                                        onClick={() => removeSession(index)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="add-session-form">
                        <div className="form-group">
                            <label htmlFor="topic">Topic</label>
                            <input
                                type="text"
                                id="topic"
                                name="topic"
                                placeholder="e.g., Mathematics, Physics"
                                value={newSession.topic}
                                onChange={(e) => setNewSession(prev => ({ ...prev, topic: e.target.value }))}
                            />
                        </div>

                        <div className="form-group duration-group">
                            <label>Duration</label>
                            <div className="duration-inputs">
                                <select
                                    value={newSession.hours}
                                    onChange={(e) => setNewSession(prev => ({ ...prev, hours: parseInt(e.target.value) }))}
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                                        <option key={h} value={h}>{h}h</option>
                                    ))}
                                </select>
                                <select
                                    value={newSession.minutes}
                                    onChange={(e) => setNewSession(prev => ({ ...prev, minutes: parseInt(e.target.value) }))}
                                >
                                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                                        <option key={m} value={m}>{m}m</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn-add-session"
                            onClick={addSession}
                        >
                            + Add
                        </button>
                    </div>

                    <div className="form-group notes-group">
                        <label htmlFor="notes">Notes (optional)</label>
                        <textarea
                            id="notes"
                            name="notes"
                            placeholder="Any notes for this session..."
                            value={newSession.notes}
                            onChange={(e) => setNewSession(prev => ({ ...prev, notes: e.target.value }))}
                            rows="2"
                        />
                    </div>

                    {newSession.topic.trim() && (
                        <div className="pending-session-hint">
                            "{newSession.topic}" ({formatDuration((newSession.hours * 60) + newSession.minutes)}) will be saved with this activity
                        </div>
                    )}
                </div>

                {error && (
                    <div className="form-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="form-success">
                        Activity saved successfully!
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Activity'}
                </button>
            </form>
        </div>
    );
}

export default ActivityForm;
