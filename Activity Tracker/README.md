# Progress Tracker 📊

A full-stack MERN application to track your daily wake times and study sessions with a GitHub-style heatmap visualization.

## Features

- 📅 **Calendar Heatmap** - LeetCode-style visualization of wake times
- ⏰ **Wake Time Tracking** - Color-coded based on wake time (before 5 AM, 5-7 AM, after 7 AM)
- 📚 **Study Sessions** - Log topics, duration, and notes
- 📈 **Analytics** - Weekly/monthly averages with comparisons
- 🎨 **Modern Dark Theme** - Premium glassmorphism design

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Styling**: Vanilla CSS with CSS Variables

## Deployment on Render

### Prerequisites
- MongoDB Atlas account with a cluster
- GitHub account

### Steps

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push
   ```

2. **Create Render Web Service**:
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repo: `D-Harshith/Progress-Tracker`

3. **Configure Settings**:
   | Setting | Value |
   |---------|-------|
   | **Name** | progress-tracker |
   | **Region** | Oregon (or nearest) |
   | **Branch** | main |
   | **Root Directory** | (leave empty) |
   | **Build Command** | `npm run render-build` |
   | **Start Command** | `npm start` |

4. **Add Environment Variables**:
   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | Your MongoDB Atlas connection string |
   | `NODE_ENV` | production |

5. **Deploy!**
   - Click "Create Web Service"
   - Wait 5-10 minutes for build and deploy

Your app will be available at: `https://progress-tracker-xxxx.onrender.com`

## Local Development

```bash
# Install dependencies
npm run install:all

# Start development servers
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

## Color Coding

| Color | Wake Time |
|-------|-----------|
| 🟢 Light Green | Before 5 AM |
| 🟢 Dark Green | 5 AM - 7 AM |
| 🔴 Red | After 7 AM |
| ⬛ Gray | No data |

## License

MIT
