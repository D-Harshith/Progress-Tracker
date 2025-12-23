const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 1
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
});

const activitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  wakeTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  },
  studySessions: [studySessionSchema],
  totalStudyMinutes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate total study minutes
activitySchema.pre('save', function(next) {
  this.totalStudyMinutes = this.studySessions.reduce((total, session) => {
    return total + session.duration;
  }, 0);
  next();
});

// Virtual to get wake time category for heatmap coloring
activitySchema.virtual('wakeCategory').get(function() {
  const [hours, minutes] = this.wakeTime.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  if (timeInMinutes < 5 * 60) { // Before 5:00 AM
    return 'early'; // Light green
  } else if (timeInMinutes < 7 * 60) { // Before 7:00 AM
    return 'good'; // Dark green
  } else {
    return 'late'; // Red
  }
});

// Ensure virtuals are included in JSON output
activitySchema.set('toJSON', { virtuals: true });
activitySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Activity', activitySchema);
