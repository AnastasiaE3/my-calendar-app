import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function YearView() {
  const params = useParams();
  const currentYear = params.year ? parseInt(params.year, 10) : new Date().getFullYear();
  const today = new Date();
  const systemYear = today.getFullYear();
  const navigate = useNavigate();
  const currentMonthCardRef = useRef(null);
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

  useEffect(() => {
    // For the current year, auto-scroll to the current month card on initial view.
    if (currentYear === systemYear && currentMonthCardRef.current) {
      currentMonthCardRef.current.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }, [currentYear, systemYear]);
// It creats a grid of 12 months and for each month it generates the days and displays them in a mini calendar format. 
// Also highlights the current day if it falls whithin that month.
  return (
    <div className="bg-peach min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Visible year heading makes it clear which year navigation is showing. */}
        <h1 className="mb-8 text-4xl font-bold text-darktext md:text-5xl">{currentYear}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }, (_, monthIndex) => {
            const days = generateMonthDays(monthIndex, currentYear);
            const isCurrentMonthCard =
              currentYear === today.getFullYear() && monthIndex === today.getMonth();
            
            return (
              <div
                key={monthIndex}
                ref={isCurrentMonthCard ? currentMonthCardRef : null}
                onClick={() => handleMonthClick(monthIndex)}
                // Highlight current month card in Year view while keeping the warm visual style.
                className={`rounded-3xl p-6 shadow-md transition-all cursor-pointer hover:shadow-lg ${
                  isCurrentMonthCard
                    ? 'bg-white ring-2 ring-mauve'
                    : 'bg-white bg-opacity-80 hover:bg-opacity-100'
                }`}
              >
                <h2 className="text-sm font-semibold text-mauve mb-4 text-center">
                  {monthNames[monthIndex]}
                </h2>
                
                <div className="w-full">
                  <div className="grid grid-cols-7 gap-1 mb-2 w-full">
                  {dayHeaders.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-gray-400 py-1"
                    >
                      {day}
                    </div>
                  ))}
                  </div>
                </div>

                <div className="w-full">
                  <div className="grid grid-cols-7 gap-1 w-full">
                  {days.map((day, index) => (
                    <div
                      key={index}
                      className={`aspect-square w-full flex items-center justify-center text-xs font-medium rounded-lg ${
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default YearView;
