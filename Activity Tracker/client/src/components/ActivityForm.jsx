import { useState } from 'react';
import { activitiesApi } from '../services/api';

function ActivityForm({ onActivitySaved }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        wakeTime: '06:00',
        studySessions: []
    });

    const [newSession, setNewSession] = useState({
        topic: '',
        duration: 60,
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSessionChange = (e) => {
        const { name, value } = e.target;
        setNewSession(prev => ({
            ...prev,
            [name]: name === 'duration' ? parseInt(value) || 0 : value
        }));
    };

    const addSession = () => {
        if (!newSession.topic.trim()) {
            setError('Please enter a topic name');
            return;
        }
        if (newSession.duration < 1) {
            setError('Duration must be at least 1 minute');
            return;
        }

        setFormData(prev => ({
            ...prev,
            studySessions: [...prev.studySessions, { ...newSession }]
        }));

        setNewSession({ topic: '', duration: 60, notes: '' });
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
        if (newSession.topic.trim() && newSession.duration >= 1) {
            sessionsToSave.push({ ...newSession });
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
                date: new Date().toISOString().split('T')[0],
                wakeTime: '06:00',
                studySessions: []
            });
            setNewSession({ topic: '', duration: 60, notes: '' });

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
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    // Calculate total study time
    const totalMinutes = formData.studySessions.reduce((sum, s) => sum + s.duration, 0)
        + (newSession.topic.trim() ? newSession.duration : 0);

    return (
        <div className="activity-form">
            <h2>📝 Log Activity</h2>

            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="date">📅 Date</label>
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
                        <label htmlFor="wakeTime">⏰ Wake Time</label>
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
                    <h3>📚 Study Sessions {totalMinutes > 0 && <span className="total-badge">{formatDuration(totalMinutes)} total</span>}</h3>

                    {formData.studySessions.length > 0 && (
                        <div className="sessions-preview">
                            {formData.studySessions.map((session, index) => (
                                <div key={index} className="session-tag">
                                    <span>{session.topic}</span>
                                    <span className="session-duration">{formatDuration(session.duration)}</span>
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
                                placeholder="e.g., Thermodynamics"
                                value={newSession.topic}
                                onChange={handleSessionChange}
                            />
                        </div>

                        <div className="form-group duration-group">
                            <label htmlFor="duration">Duration (min)</label>
                            <input
                                type="number"
                                id="duration"
                                name="duration"
                                min="1"
                                max="480"
                                value={newSession.duration}
                                onChange={handleSessionChange}
                            />
                        </div>

                        <button
                            type="button"
                            className="btn-add-session"
                            onClick={addSession}
                        >
                            + Add More
                        </button>
                    </div>

                    <div className="form-group notes-group">
                        <label htmlFor="notes">Notes (optional)</label>
                        <input
                            type="text"
                            id="notes"
                            name="notes"
                            placeholder="Any notes for this session..."
                            value={newSession.notes}
                            onChange={handleSessionChange}
                        />
                    </div>

                    {newSession.topic.trim() && (
                        <div className="pending-session-hint">
                            ✓ "{newSession.topic}" ({formatDuration(newSession.duration)}) will be saved with this activity
                        </div>
                    )}
                </div>

                {error && (
                    <div className="form-error">
                        ⚠️ {error}
                    </div>
                )}

                {success && (
                    <div className="form-success">
                        ✅ Activity saved successfully!
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : '💾 Save Activity'}
                </button>
            </form>
        </div>
    );
}

export default ActivityForm;
