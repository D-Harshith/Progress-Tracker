// Use relative URL in production (same domain), localhost in development
const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

// Helper for handling responses
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }
    return response.json();
};

// Activities API
export const activitiesApi = {
    // Get all activities (optional date range)
    getAll: async (startDate, endDate) => {
        let url = `${API_BASE}/activities`;
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await fetch(url);
        return handleResponse(response);
    },

    // Get single activity by date
    getByDate: async (date) => {
        const response = await fetch(`${API_BASE}/activities/${date}`);
        return handleResponse(response);
    },

    // Create or update activity
    save: async (activityData) => {
        const response = await fetch(`${API_BASE}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activityData)
        });
        return handleResponse(response);
    },

    // Add study session to existing activity
    addSession: async (date, sessionData) => {
        const response = await fetch(`${API_BASE}/activities/${date}/session`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData)
        });
        return handleResponse(response);
    },

    // Delete activity
    delete: async (date) => {
        const response = await fetch(`${API_BASE}/activities/${date}`, {
            method: 'DELETE'
        });
        return handleResponse(response);
    }
};

// Analytics API
export const analyticsApi = {
    // Get weekly stats
    getWeekly: async () => {
        const response = await fetch(`${API_BASE}/analytics/weekly`);
        return handleResponse(response);
    },

    // Get monthly stats
    getMonthly: async () => {
        const response = await fetch(`${API_BASE}/analytics/monthly`);
        return handleResponse(response);
    },

    // Get heatmap data
    getHeatmap: async () => {
        const response = await fetch(`${API_BASE}/analytics/heatmap`);
        return handleResponse(response);
    }
};
