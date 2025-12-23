import { useState, useEffect } from 'react';
import { activitiesApi } from '../services/api';

function DayDetailModal({ date, activity: initialActivity, onClose, onUpdate }) {
    const [activity, setActivity] = useState(initialActivity);
    const [loading, setLoading] = useState(!initialActivity);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!initialActivity && date) {
            fetchActivity();
        }
    }, [date]);

    const fetchActivity = async () => {
        try {
            setLoading(true);
            const data = await activitiesApi.getByDate(date);
            setActivity(data);
            setError(null);
        } catch (err) {
            if (err.message.includes('not found')) {
                setActivity(null);
            } else {
                setError('Failed to load activity details');
            }
        } finally {
            setLoading(false);
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

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getWakeCategoryLabel = () => {
        if (!activity) return '';

        const [hours] = activity.wakeTime.split(':').map(Number);
        if (hours < 5) return 'Early Bird! 🌟';
        if (hours < 7) return 'Good Morning! ☀️';
        return 'Late Start 😴';
    };

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
                        <button onClick={fetchActivity}>Retry</button>
                    </div>
                )}

                {!loading && !error && !activity && (
                    <div className="modal-empty">
                        <p>😔 No activity logged for this day.</p>
                        <p className="hint">Use the form above to log your activity!</p>
                    </div>
                )}

                {!loading && !error && activity && (
                    <div className="modal-body">
                        <div className="wake-section">
                            <div className={`wake-badge ${activity.wakeCategory}`}>
                                <span className="wake-icon">⏰</span>
                                <div>
                                    <span className="wake-time">{activity.wakeTime}</span>
                                    <span className="wake-label">{getWakeCategoryLabel()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="study-section">
                            <h3>📚 Study Sessions</h3>

                            {activity.studySessions.length === 0 ? (
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
                            <button className="btn-delete" onClick={handleDelete}>
                                🗑️ Delete Activity
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DayDetailModal;
