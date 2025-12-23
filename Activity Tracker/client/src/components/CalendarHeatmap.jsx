import { useState, useEffect } from 'react';
import { analyticsApi, activitiesApi } from '../services/api';

function CalendarHeatmap({ onDayClick, refreshTrigger }) {
    const [heatmapData, setHeatmapData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredDate, setHoveredDate] = useState(null); // Store date string instead of object
    const [hoveredDetails, setHoveredDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        fetchHeatmapData();
    }, [refreshTrigger]);

    const fetchHeatmapData = async () => {
        try {
            setLoading(true);
            const data = await analyticsApi.getHeatmap();
            setHeatmapData(data);
        } catch (err) {
            console.error('Failed to load heatmap:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch full activity details on hover
    const fetchDayDetails = async (dateStr) => {
        try {
            setDetailsLoading(true);
            const details = await activitiesApi.getByDate(dateStr);
            setHoveredDetails(details);
        } catch (err) {
            setHoveredDetails(null);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleMouseEnter = (day) => {
        if (day) {
            setHoveredDate(day.date); // Store date string
            if (day.activity) {
                fetchDayDetails(day.date);
            } else {
                setHoveredDetails(null);
            }
        }
    };

    const handleMouseLeave = () => {
        setHoveredDate(null);
        setHoveredDetails(null);
    };

    // Generate last 365 days grouped by month
    const generateCalendarData = () => {
        const today = new Date();
        const months = [];
        let currentMonth = null;
        let currentMonthDays = [];
        let currentMonthWeeks = [];
        let currentWeek = [];

        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const month = date.getMonth();
            const year = date.getFullYear();
            const monthKey = `${year}-${month}`;

            const activity = heatmapData.find(d => d.date === dateStr);

            const dayData = {
                date: dateStr,
                dayOfWeek: date.getDay(),
                month,
                year,
                activity
            };

            if (currentMonth !== monthKey) {
                if (currentMonthDays.length > 0) {
                    if (currentWeek.length > 0) {
                        while (currentWeek.length < 7) {
                            currentWeek.push(null);
                        }
                        currentMonthWeeks.push(currentWeek);
                    }
                    months.push({
                        key: currentMonth,
                        name: new Date(currentMonthDays[0].year, currentMonthDays[0].month).toLocaleDateString('en-US', { month: 'short' }),
                        weeks: currentMonthWeeks
                    });
                }

                currentMonth = monthKey;
                currentMonthDays = [];
                currentMonthWeeks = [];
                currentWeek = [];

                for (let j = 0; j < dayData.dayOfWeek; j++) {
                    currentWeek.push(null);
                }
            }

            currentMonthDays.push(dayData);
            currentWeek.push(dayData);

            if (currentWeek.length === 7) {
                currentMonthWeeks.push(currentWeek);
                currentWeek = [];
            }
        }

        if (currentMonthDays.length > 0) {
            if (currentWeek.length > 0) {
                currentMonthWeeks.push(currentWeek);
            }
            months.push({
                key: currentMonth,
                name: new Date(currentMonthDays[0].year, currentMonthDays[0].month).toLocaleDateString('en-US', { month: 'short' }),
                weeks: currentMonthWeeks
            });
        }

        return months;
    };

    const getColorClass = (activity) => {
        if (!activity) return 'empty';

        const { wakeCategory } = activity;
        switch (wakeCategory) {
            case 'early': return 'early';
            case 'good': return 'good';
            case 'late': return 'late';
            default: return 'empty';
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const months = generateCalendarData();

    if (loading) {
        return (
            <div className="calendar-heatmap loading">
                <div className="skeleton-grid"></div>
            </div>
        );
    }

    return (
        <div className="calendar-heatmap">
            <div className="heatmap-header">
                <h2>📊 Activity Calendar</h2>
                <div className="legend">
                    <span className="legend-item">
                        <span className="legend-box empty"></span>
                        No data
                    </span>
                    <span className="legend-item">
                        <span className="legend-box early"></span>
                        Before 5 AM
                    </span>
                    <span className="legend-item">
                        <span className="legend-box good"></span>
                        5-7 AM
                    </span>
                    <span className="legend-item">
                        <span className="legend-box late"></span>
                        After 7 AM
                    </span>
                </div>
            </div>

            <div className="heatmap-container">
                <div className="day-labels">
                    <span></span>
                    <span>Mon</span>
                    <span></span>
                    <span>Wed</span>
                    <span></span>
                    <span>Fri</span>
                    <span></span>
                </div>

                <div className="heatmap-months-wrapper">
                    {months.map((month) => (
                        <div key={month.key} className="month-block">
                            <div className="month-label">{month.name}</div>
                            <div className="month-grid">
                                {month.weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="week-column">
                                        {week.map((day, dayIndex) => (
                                            <div
                                                key={dayIndex}
                                                className={`day-cell ${day ? getColorClass(day.activity) : 'placeholder'}`}
                                                onClick={() => day && onDayClick(day.date, day.activity)}
                                                onMouseEnter={() => handleMouseEnter(day)}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                {/* Compare by date string, not object reference */}
                                                {hoveredDate === day?.date && day && (
                                                    <div className="tooltip-rich">
                                                        <div className="tooltip-header">
                                                            <span className="tooltip-date">{formatDate(day.date)}</span>
                                                        </div>

                                                        {!day.activity ? (
                                                            <div className="tooltip-empty">No activity logged</div>
                                                        ) : (
                                                            <>
                                                                <div className="tooltip-wake">
                                                                    <span className="tooltip-icon">⏰</span>
                                                                    <span>Woke at <strong>{day.activity.wakeTime}</strong></span>
                                                                </div>

                                                                {detailsLoading ? (
                                                                    <div className="tooltip-loading">Loading sessions...</div>
                                                                ) : hoveredDetails && hoveredDetails.studySessions?.length > 0 ? (
                                                                    <div className="tooltip-sessions">
                                                                        <div className="tooltip-sessions-header">
                                                                            📚 Study Sessions ({formatDuration(hoveredDetails.totalStudyMinutes)})
                                                                        </div>
                                                                        {hoveredDetails.studySessions.map((session, idx) => (
                                                                            <div key={idx} className="tooltip-session">
                                                                                <span className="session-bullet">•</span>
                                                                                <span className="session-topic">{session.topic}</span>
                                                                                <span className="session-time">{formatDuration(session.duration)}</span>
                                                                                {session.notes && (
                                                                                    <div className="session-notes">"{session.notes}"</div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="tooltip-no-study">No study sessions</div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CalendarHeatmap;
