import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function WeekView() {
  const params = useParams();
  const navigate = useNavigate();
  const today = new Date();
  
  // Get date from URL params or use current date
  let displayDate = today;
  if (params.date) {
    displayDate = new Date(params.date);
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Calculate week start (Monday)
  const currentWeekStart = new Date(displayDate);
  const day = currentWeekStart.getDay();
  const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
  currentWeekStart.setDate(diff);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return {
      name: dayNames[(i + 1) % 7],
      date: date.getDate(),
      fullDate: date.toLocaleDateString(),
      dateString: date.toISOString().split('T')[0],
    };
  });

  const handleDayClick = (dateString) => {
    navigate(`/day/${dateString}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-3xl font-bold text-mauve mb-6">Week View</h2>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => (
          <div
            key={index}
            onClick={() => handleDayClick(day.dateString)}
            className={`p-6 rounded-lg text-center cursor-pointer transition-colors ${
              day.date === today.getDate() &&
              new Date(day.dateString).getMonth() === today.getMonth() &&
              new Date(day.dateString).getFullYear() === today.getFullYear()
                ? 'bg-coral text-white hover:bg-coral-800'
                : 'bg-cream border-2 border-peach text-darktext hover:bg-peach'
            }`}
          >
            <h3 className="text-lg font-semibold">{day.name}</h3>
            <p className="text-sm mt-2">{day.fullDate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeekView;
