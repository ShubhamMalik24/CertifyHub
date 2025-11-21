import React, { useState, useEffect } from 'react';
import './Calendar.css';

const Calendar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get current date information
  const today = new Date();
  const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentDay = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' });

  // Mock streak data - in real app this would come from API
  const streakData = {
    currentStreak: 7,
    longestStreak: 15,
    totalActiveDays: 45,
    weeklyProgress: [
      { day: 'Mon', completed: true, intensity: 3 },
      { day: 'Tue', completed: true, intensity: 2 },
      { day: 'Wed', completed: true, intensity: 4 },
      { day: 'Thu', completed: true, intensity: 1 },
      { day: 'Fri', completed: false, intensity: 0 },
      { day: 'Sat', completed: true, intensity: 2 },
      { day: 'Sun', completed: true, intensity: 3 }
    ]
  };

  // Check if user has any real activity (in real app, this would check actual user data)
  const hasUserActivity = streakData.totalActiveDays > 0 && streakData.currentStreak > 0;

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 0: return '#e5e7eb';
      case 1: return '#bbf7d0';
      case 2: return '#86efac';
      case 3: return '#4ade80';
      case 4: return '#22c55e';
      default: return '#16a34a';
    }
  };

  const toggleCalendar = () => {
    setIsOpen(!isOpen);
  };

  // Generate mini calendar for current month
  const generateMiniCalendar = () => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();

      // Mock activity data - in real app this would come from backend
      const dayOfWeek = date.getDay();
      const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const activity = streakData.weeklyProgress.find(w => w.day === weekDayNames[dayOfWeek]);
      const intensity = activity ? activity.intensity : 0;

      calendarDays.push({
        day,
        date,
        isToday,
        intensity,
        isActive: intensity > 0
      });
    }

    return calendarDays;
  };

  return (
    <div className="calendar-container">
      <button className="calendar-toggle" onClick={toggleCalendar}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="calendar-badge">{streakData.currentStreak}</span>
      </button>

      {isOpen && (
        <div className="calendar-dropdown">
          <div className="calendar-header">
            <div className="current-date-info">
              <h3>{currentMonth}</h3>
              <p className="current-day">{currentDay}</p>
            </div>
            <button className="close-calendar" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          {/* Show streak section only if user has activity */}
          {hasUserActivity && (
            <div className="streak-section">
              <div className="streak-stats">
                <div className="streak-item">
                  <div className="streak-number">{streakData.currentStreak}</div>
                  <div className="streak-label">Current Streak</div>
                </div>
                <div className="streak-item">
                  <div className="streak-number">{streakData.longestStreak}</div>
                  <div className="streak-label">Best Streak</div>
                </div>
                <div className="streak-item">
                  <div className="streak-number">{streakData.totalActiveDays}</div>
                  <div className="streak-label">Total Active</div>
                </div>
              </div>
            </div>
          )}

          {/* Show welcome message for new users */}
          {!hasUserActivity && (
            <div className="welcome-section">
              <div className="welcome-message">
                <h4>Welcome to CertifyHub! 🎓</h4>
                <p>Complete your first lesson to start tracking your learning streak!</p>
              </div>
            </div>
          )}

          {/* Mini Calendar View */}
          <div className="mini-calendar">
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-header">{day}</div>
              ))}
              {generateMiniCalendar().map((dayInfo, index) => (
                <div
                  key={index}
                  className={`calendar-day ${dayInfo?.isToday ? 'today' : ''} ${dayInfo?.isActive ? 'active' : ''}`}
                  style={{ backgroundColor: dayInfo?.intensity ? getIntensityColor(dayInfo.intensity) : undefined }}
                >
                  {dayInfo ? (
                    <span className="day-number">{dayInfo.day}</span>
                  ) : (
                    ''
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="calendar-footer">
            <div className="progress-summary">
              {hasUserActivity ? (
                <>
                  <p>Keep up the great work! 🔥</p>
                  <p className="progress-detail">You're on a {streakData.currentStreak}-day streak</p>
                </>
              ) : (
                <>
                  <p>Ready to start learning? 🚀</p>
                  <p className="progress-detail">Complete a course to begin your streak!</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
