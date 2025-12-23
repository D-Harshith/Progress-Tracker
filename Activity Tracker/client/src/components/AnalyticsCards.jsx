import { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';

function AnalyticsCards() {
    const [weeklyStats, setWeeklyStats] = useState(null);
    const [monthlyStats, setMonthlyStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [weekly, monthly] = await Promise.all([
                analyticsApi.getWeekly(),
                analyticsApi.getMonthly()
            ]);
            setWeeklyStats(weekly);
            setMonthlyStats(monthly);
            setError(null);
        } catch (err) {
            setError('Failed to load analytics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeDiff = (minutes) => {
        if (!minutes) return null;
        const absMinutes = Math.abs(minutes);
        const hours = Math.floor(absMinutes / 60);
        const mins = absMinutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const renderComparison = (comparison, type) => {
        if (!comparison) return null;

        const { diff, improved } = comparison;
        const icon = improved ? '↑' : '↓';
        const className = improved ? 'comparison improved' : 'comparison declined';

        if (type === 'wakeTime') {
            return (
                <span className={className}>
                    {icon} {formatTimeDiff(diff)} {improved ? 'earlier' : 'later'}
                </span>
            );
        }

        return (
            <span className={className}>
                {icon} {Math.abs(diff)}h {improved ? 'more' : 'less'}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="analytics-cards loading">
                <div className="card skeleton"></div>
                <div className="card skeleton"></div>
                <div className="card skeleton"></div>
                <div className="card skeleton"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="analytics-cards error">
                <p>{error}</p>
                <button onClick={fetchStats}>Retry</button>
            </div>
        );
    }

    return (
        <div className="analytics-cards">
            {/* Weekly Wake Time */}
            <div className="card">
                <div className="card-icon">🌅</div>
                <div className="card-content">
                    <h3>Avg Wake Time</h3>
                    <p className="card-label">This Week</p>
                    <p className="card-value">
                        {weeklyStats?.current?.avgWakeTime || '--:--'}
                    </p>
                    {renderComparison(weeklyStats?.comparison?.wakeTime, 'wakeTime')}
                </div>
            </div>

            {/* Weekly Study Hours */}
            <div className="card">
                <div className="card-icon">📚</div>
                <div className="card-content">
                    <h3>Study Hours</h3>
                    <p className="card-label">This Week</p>
                    <p className="card-value">
                        {weeklyStats?.current?.totalStudyHours || 0}h
                    </p>
                    {renderComparison(weeklyStats?.comparison?.studyHours, 'studyHours')}
                </div>
            </div>

            {/* Monthly Wake Time */}
            <div className="card">
                <div className="card-icon">📅</div>
                <div className="card-content">
                    <h3>Avg Wake Time</h3>
                    <p className="card-label">This Month</p>
                    <p className="card-value">
                        {monthlyStats?.current?.avgWakeTime || '--:--'}
                    </p>
                    {renderComparison(monthlyStats?.comparison?.wakeTime, 'wakeTime')}
                </div>
            </div>

            {/* Monthly Study Hours */}
            <div className="card">
                <div className="card-icon">🎯</div>
                <div className="card-content">
                    <h3>Study Hours</h3>
                    <p className="card-label">This Month</p>
                    <p className="card-value">
                        {monthlyStats?.current?.totalStudyHours || 0}h
                    </p>
                    {renderComparison(monthlyStats?.comparison?.studyHours, 'studyHours')}
                </div>
            </div>
        </div>
    );
}

export default AnalyticsCards;
