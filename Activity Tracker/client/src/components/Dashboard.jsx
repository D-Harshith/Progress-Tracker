import { useState } from 'react';
import AnalyticsCards from './AnalyticsCards';
import CalendarHeatmap from './CalendarHeatmap';
import ActivityForm from './ActivityForm';
import DayDetailModal from './DayDetailModal';

function Dashboard() {
    const [selectedDay, setSelectedDay] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleDayClick = (date, activity) => {
        setSelectedDay({ date, activity });
    };

    const handleCloseModal = () => {
        setSelectedDay(null);
    };

    const handleActivitySaved = () => {
        // Increment to trigger refresh in child components
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>📈 Progress Tracker</h1>
                <p className="subtitle">Track your wake times and study progress</p>
            </header>

            <AnalyticsCards key={`analytics-${refreshTrigger}`} />

            <div className="main-content">
                <div className="content-grid">
                    <div className="form-section">
                        <ActivityForm onActivitySaved={handleActivitySaved} />
                    </div>

                    <div className="calendar-section">
                        <CalendarHeatmap
                            onDayClick={handleDayClick}
                            refreshTrigger={refreshTrigger}
                        />
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
