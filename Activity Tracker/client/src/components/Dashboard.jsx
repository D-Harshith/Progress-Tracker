import { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import AnalyticsCards from './AnalyticsCards';
import CalendarHeatmap from './CalendarHeatmap';
import ActivityForm from './ActivityForm';
import DayDetailModal from './DayDetailModal';

function Dashboard() {
    const [selectedDay, setSelectedDay] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [streak, setStreak] = useState(null);

    useEffect(() => {
        fetchStreak();
    }, [refreshTrigger]);

    const fetchStreak = async () => {
        try {
            const data = await analyticsApi.getStreak();
            setStreak(data);
        } catch (err) {
            console.error('Failed to load streak:', err);
        }
    };

    const handleDayClick = (date, activity) => {
        setSelectedDay({ date, activity });
    };

    const handleCloseModal = () => {
        setSelectedDay(null);
    };

    const handleActivitySaved = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Progress Tracker</h1>
                <p className="subtitle">Track your wake times and study progress</p>
            </header>

            {streak && (
                <div className="streak-display">
                    <div className="streak-card">
                        <span className="streak-icon">🔥</span>
                        <div className="streak-info">
                            <span className="streak-value">{streak.currentStreak}</span>
                            <span className="streak-label">Day Streak</span>
                        </div>
                    </div>
                    <div className="streak-card">
                        <span className="streak-icon">🏆</span>
                        <div className="streak-info">
                            <span className="streak-value">{streak.longestStreak}</span>
                            <span className="streak-label">Best Streak</span>
                        </div>
                    </div>
                    <div className="streak-card">
                        <span className="streak-icon">📊</span>
                        <div className="streak-info">
                            <span className="streak-value">{streak.totalDays}</span>
                            <span className="streak-label">Total Days</span>
                        </div>
                    </div>
                </div>
            )}

            <AnalyticsCards key={`analytics-${refreshTrigger}`} />

            <div className="main-content">
                <div className="content-grid">
                    <div className="calendar-section">
                        <CalendarHeatmap
                            onDayClick={handleDayClick}
                            refreshTrigger={refreshTrigger}
                        />
                    </div>

                    <div className="form-section">
                        <ActivityForm onActivitySaved={handleActivitySaved} />
                    </div>
                </div>
            </div>

            {selectedDay && (
                <DayDetailModal
                    date={selectedDay.date}
                    activity={selectedDay.activity}
                    onClose={handleCloseModal}
                    onUpdate={handleActivitySaved}
                />
            )}
        </div>
    );
}

export default Dashboard;
