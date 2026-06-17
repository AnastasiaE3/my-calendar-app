import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function YearView() {
  const params = useParams();
  const currentYear = params.year ? parseInt(params.year, 10) : new Date().getFullYear();
  const today = new Date();
  const navigate = useNavigate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];


  //  This function generates the days for a given month and year, including empty cells for alignment. 
  const generateMonthDays = (month, year) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Adjust for Monday start (0 = Monday)
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
    return days;
  };


  // checks if a specific day cell is today
  const isToday = (day, month) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      today.getFullYear() === currentYear
    );
  };

  //when a month is clicked we navigate to the MonthView for that specific month and year. 
  const handleMonthClick = (monthIndex) => {
    navigate(`/month/${monthIndex}/${currentYear}`);
  };
// It creats a grid of 12 months and for each month it generates the days and displays them in a mini calendar format. 
// Also highlights the current day if it falls whithin that month.
  return (
    <div className="bg-peach min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-4 gap-6">
          {Array.from({ length: 12 }, (_, monthIndex) => {
            const days = generateMonthDays(monthIndex, currentYear);
            
            return (
              <div
                key={monthIndex}
                onClick={() => handleMonthClick(monthIndex)}
                className="bg-white bg-opacity-80 rounded-3xl shadow-md p-6 cursor-pointer hover:shadow-lg hover:bg-opacity-100 transition-all"
              >
                <h2 className="text-sm font-semibold text-mauve mb-4 text-center">
                  {monthNames[monthIndex]}
                </h2>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayHeaders.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-gray-400 py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => (
                    <div
                      key={index}
                      className={`aspect-square flex items-center justify-center text-xs font-medium rounded-lg ${
                        day === null
                          ? ''
                          : isToday(day, monthIndex)
                          ? 'bg-mauve text-white font-semibold'
                          : 'text-darktext'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default YearView;
