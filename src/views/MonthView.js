import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function MonthView() {
  const params = useParams();
  const navigate = useNavigate();
  const today = new Date();
  
  // Get month and year from URL params or use current month/year
  let displayMonth = params.month ? parseInt(params.month) : today.getMonth();
  let displayYear = params.year ? parseInt(params.year) : today.getFullYear();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Get first day of month (0 = Sunday, need to adjust for Monday start)
  const firstDay = new Date(displayYear, displayMonth, 1).getDay();
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

  // Adjust for Monday start (Monday = 0)
  let adjustedFirstDay = firstDay - 1;
  if (adjustedFirstDay === -1) adjustedFirstDay = 6;

  const days = [];
  // Add empty cells for days before the month starts
  for (let i = 0; i < adjustedFirstDay; i++) {
    days.push(null);
  }
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isToday = (day) => {
    return (
      day === today.getDate() &&
      displayMonth === today.getMonth() &&
      displayYear === today.getFullYear()
    );
  };

  const handleDayClick = (day) => {
    if (day !== null) {
      const dateString = new Date(displayYear, displayMonth, day)
        .toISOString()
        .split('T')[0];
      navigate(`/day/${dateString}`);
    }
  };

  return (
    <div className="bg-peach min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-darktext mb-8">
          {monthNames[displayMonth]} {displayYear}
        </h2>

        <div className="bg-white bg-opacity-95 rounded-3xl shadow-lg p-8">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0 mb-6">
            {dayHeaders.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-mauve uppercase tracking-wider pb-4"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0">
            {days.map((day, index) => (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={`aspect-video flex items-start justify-start p-4 border-b border-r border-gray-100 last:border-r-0 ${
                  day !== null ? 'cursor-pointer hover:bg-cream transition-colors' : ''
                }`}
              >
                {day !== null && (
                  <div
                    className={`flex items-center justify-center h-8 w-8 text-sm font-medium ${
                      isToday(day)
                        ? 'bg-mauve text-white rounded-full font-semibold'
                        : 'text-darktext'
                    }`}
                  >
                    {day}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthView;
