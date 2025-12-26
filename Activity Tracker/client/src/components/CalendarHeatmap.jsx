import { useState, useEffect, useRef } from 'react';
import { analyticsApi } from '../services/api';

function CalendarHeatmap({ onDayClick, refreshTrigger }) {
    const [heatmapData, setHeatmapData] = useState([]);
    const [loading, setLoading] = useState(true);
    const heatmapRef = useRef(null);

    useEffect(() => {
        fetchHeatmapData();
    }, [refreshTrigger]);

    // Auto-scroll to show current month (rightmost) when loaded
    useEffect(() => {
        if (!loading && heatmapRef.current) {
            heatmapRef.current.scrollLeft = heatmapRef.current.scrollWidth;
        }
    }, [loading]);

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

    // Get color class based on study category (GitHub-style)
    const getColorClass = (activity) => {
        if (!activity) return 'empty';  // Gray - no data

        const { studyCategory } = activity;
        switch (studyCategory) {
            case 'none': return 'study-none';      // Red - no study
            case 'low': return 'study-low';        // Pale green
            case 'medium': return 'study-medium';  // Light green
            case 'good': return 'study-good';      // Green
            case 'high': return 'study-high';      // Bright green
            default: return 'empty';
        }
    };

    // Format study hours for display
    const formatStudyHours = (minutes) => {
        if (!minutes) return '0h';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
        if (hours > 0) return `${hours}h`;
        return `${mins}m`;
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
                <h2>📊 Study Activity</h2>
                <div className="legend">
                    <span className="legend-item">
                        <span className="legend-box empty"></span>
                        No data
                    </span>
                    <span className="legend-item">
                        <span className="legend-box study-none"></span>
                        0h
                    </span>
                    <span className="legend-item">
                        <span className="legend-box study-low"></span>
                        &lt;1h
                    </span>
                    <span className="legend-item">
                        <span className="legend-box study-medium"></span>
                        1-2h
                    </span>
                    <span className="legend-item">
                        <span className="legend-box study-good"></span>
                        2-4h
                    </span>
                    <span className="legend-item">
                        <span className="legend-box study-high"></span>
                        4h+
                    </span>
                </div>
            </div>

            <div className="heatmap-container" ref={heatmapRef}>
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
                                                title={day ? `${day.date}${day.activity ? ` - ${formatStudyHours(day.activity.studyMinutes)}` : ''}` : ''}
                                            />
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
