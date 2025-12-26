import { useState, useEffect } from 'react';
import { activitiesApi } from '../services/api';

function DayDetailModal({ date, activity: initialActivity, onClose, onUpdate }) {
    const [activity, setActivity] = useState(initialActivity);
    const [loading, setLoading] = useState(!initialActivity);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form state for editing
    const [wakeTime, setWakeTime] = useState('');
    const [studySessions, setStudySessions] = useState([]);
    const [newSession, setNewSession] = useState({ topic: '', hours: 0, minutes: 30, notes: '' });

    useEffect(() => {
        if (!initialActivity && date) {
            fetchActivity();
        } else if (initialActivity) {
            populateForm(initialActivity);
        }
    }, [date, initialActivity]);

    const populateForm = (act) => {
        if (act) {
            setWakeTime(act.wakeTime || '06:00');
            setStudySessions(act.studySessions?.map(s => ({
                ...s,
                hours: Math.floor(s.duration / 60),
                minutes: s.duration % 60
            })) || []);
        } else {
            setWakeTime('06:00');
            setStudySessions([]);
        }
    };

    const fetchActivity = async () => {
        try {
            setLoading(true);
            const data = await activitiesApi.getByDate(date);
            setActivity(data);
            populateForm(data);
            setError(null);
        } catch (err) {
            if (err.message.includes('not found')) {
                setActivity(null);
                populateForm(null);
            } else {
                setError('Failed to load activity details');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            // Convert sessions to API format
            const sessionsData = studySessions.map(s => ({
                topic: s.topic,
                duration: (s.hours * 60) + s.minutes,
                notes: s.notes || ''
            }));

            await activitiesApi.save({
                date,
                wakeTime,
                studySessions: sessionsData
            });

            setIsEditing(false);
            onUpdate();

            // Refresh the activity display
            await fetchActivity();
        } catch (err) {
            setError('Failed to save activity: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this activity?')) return;

        try {
            await activitiesApi.delete(date);
            onUpdate();
            onClose();
        } catch (err) {
            setError('Failed to delete activity');
        }
    };

    const addSession = () => {
        if (!newSession.topic.trim()) return;
        setStudySessions([...studySessions, {
            topic: newSession.topic,
            hours: newSession.hours,
            minutes: newSession.minutes,
            notes: newSession.notes
        }]);
        setNewSession({ topic: '', hours: 0, minutes: 30, notes: '' });
    };

    const removeSession = (index) => {
        setStudySessions(studySessions.filter((_, i) => i !== index));
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getTotalStudyMinutes = () => {
        return studySessions.reduce((sum, s) => sum + (s.hours * 60) + s.minutes, 0);
    };

    // Render view mode
    const renderViewMode = () => (
        <div className="modal-body">
            <div className="wake-section">
                <div className="wake-badge">
                    <span className="wake-icon">⏰</span>
                    <div>
                        <span className="wake-time">{activity.wakeTime}</span>
                        <span className="wake-label">Wake Time</span>
                    </div>
                </div>
            </div>

            <div className="study-section">
                <h3>📚 Study Sessions</h3>

                {(!activity.studySessions || activity.studySessions.length === 0) ? (
                    <p className="no-sessions">No study sessions logged</p>
                ) : (
                    <>
                        <div className="sessions-list">
                            {activity.studySessions.map((session, index) => (
                                <div key={index} className="session-item">
                                    <div className="session-topic">{session.topic}</div>
                                    <div className="session-duration">
                                        {formatDuration(session.duration)}
                                    </div>
                                    {session.notes && (
                                        <div className="session-notes">{session.notes}</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="study-total">
                            <span>Total Study Time:</span>
                            <strong>{formatDuration(activity.totalStudyMinutes)}</strong>
                        </div>
                    </>
                )}
            </div>

            <div className="modal-actions">
                <button className="btn-primary" onClick={() => { setIsEditing(true); populateForm(activity); }}>
                    ✏️ Edit
                </button>
                <button className="btn-delete" onClick={handleDelete}>
                    🗑️ Delete
                </button>
            </div>
        </div>
    );

    // Render edit mode
    const renderEditMode = () => (
        <div className="modal-body edit-mode">
            <div className="form-group">
                <label>⏰ Wake Time</label>
                <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>📚 Study Sessions</label>

                {studySessions.length > 0 && (
                    <div className="edit-sessions-list">
                        {studySessions.map((session, index) => (
                            <div key={index} className="edit-session-item">
                                <span className="session-topic">{session.topic}</span>
                                <span className="session-duration">{session.hours}h {session.minutes}m</span>
                                <button
                                    className="btn-remove-session"
                                    onClick={() => removeSession(index)}
                                    type="button"
                                >×</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="add-session-form">
                    <input
                        type="text"
                        placeholder="Topic (e.g., Math, Physics)"
                        value={newSession.topic}
                        onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                    />
                    <div className="duration-inputs">
                        <select
                            value={newSession.hours}
                            onChange={(e) => setNewSession({ ...newSession, hours: parseInt(e.target.value) })}
                        >
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                                <option key={h} value={h}>{h}h</option>
                            ))}
                        </select>
                        <select
                            value={newSession.minutes}
                            onChange={(e) => setNewSession({ ...newSession, minutes: parseInt(e.target.value) })}
                        >
                            {[0, 15, 30, 45].map(m => (
                                <option key={m} value={m}>{m}m</option>
                            ))}
                        </select>
                    </div>
                    <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={newSession.notes}
                        onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                    />
                    <button
                        type="button"
                        className="btn-add-session"
                        onClick={addSession}
                        disabled={!newSession.topic.trim()}
                    >
                        + Add
                    </button>
                </div>

                {studySessions.length > 0 && (
                    <div className="study-total">
                        <span>Total:</span>
                        <strong>{formatDuration(getTotalStudyMinutes())}</strong>
                    </div>
                )}
            </div>

            <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                    Cancel
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save'}
                </button>
            </div>
        </div>
    );

    // Render create new mode (no existing activity)
    const renderCreateMode = () => (
        <div className="modal-body edit-mode">
            <p className="create-hint">No activity logged for this day. Create one!</p>

            <div className="form-group">
                <label>⏰ Wake Time</label>
                <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>📚 Study Sessions (optional)</label>

                {studySessions.length > 0 && (
                    <div className="edit-sessions-list">
                        {studySessions.map((session, index) => (
                            <div key={index} className="edit-session-item">
                                <span className="session-topic">{session.topic}</span>
                                <span className="session-duration">{session.hours}h {session.minutes}m</span>
                                <button
                                    className="btn-remove-session"
                                    onClick={() => removeSession(index)}
                                    type="button"
                                >×</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="add-session-form">
                    <input
                        type="text"
                        placeholder="Topic (e.g., Math, Physics)"
                        value={newSession.topic}
                        onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                    />
                    <div className="duration-inputs">
                        <select
                            value={newSession.hours}
                            onChange={(e) => setNewSession({ ...newSession, hours: parseInt(e.target.value) })}
                        >
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                                <option key={h} value={h}>{h}h</option>
                            ))}
                        </select>
                        <select
                            value={newSession.minutes}
                            onChange={(e) => setNewSession({ ...newSession, minutes: parseInt(e.target.value) })}
                        >
                            {[0, 15, 30, 45].map(m => (
                                <option key={m} value={m}>{m}m</option>
                            ))}
                        </select>
                    </div>
                    <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={newSession.notes}
                        onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                    />
                    <button
                        type="button"
                        className="btn-add-session"
                        onClick={addSession}
                        disabled={!newSession.topic.trim()}
                    >
                        + Add
                    </button>
                </div>
            </div>

            <div className="modal-actions">
                <button className="btn-secondary" onClick={onClose} disabled={saving}>
                    Cancel
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : '💾 Create Activity'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <h2>📅 {formatDate(date)}</h2>

                {loading && (
                    <div className="modal-loading">
                        <div className="spinner"></div>
                        <p>Loading...</p>
                    </div>
                )}

                {error && (
                    <div className="modal-error">
                        <p>{error}</p>
                        <button onClick={() => setError(null)}>Dismiss</button>
                    </div>
                )}

                {!loading && !error && !activity && renderCreateMode()}

                {!loading && !error && activity && !isEditing && renderViewMode()}

                {!loading && !error && activity && isEditing && renderEditMode()}
            </div>
        </div>
    );
}

export default DayDetailModal;
