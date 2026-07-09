import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { safeFetchJson, API_BASE } from '../api';

function MonthView() {
  const params = useParams();
  const navigate = useNavigate(); // sending user to a different page when i click on something
  const today = new Date();
  const [eventsByDay, setEventsByDay] = useState({});

  //a ternary operator to get month and year from URL params or use current month and year.
  // Get month and year from URL params or use current month/year
  //parseInt - converts a string to a number
  let displayMonth = params.month ? parseInt (params.month) : today.getMonth();
  let displayYear = params.year ? parseInt(params.year) : today.getFullYear();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Shared local date-key builder (YYYY-MM-DD) keeps date comparisons timezone-safe.
  const toLocalDateKey = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Get first day of month (0 = Sunday, need to adjust for Monday start)
  // creats the first date of the month and asks what day of the week it falls on. This tells us how many empty cells to add before the 1st.
  const firstDay = new Date(displayYear, displayMonth, 1).getDay();
  // Get number of days in month by creating a date for the 0th day of the next month, which gives us the last day of the month we want.
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

  // Adjust for Monday start (Monday = 0)
  //shifting the days so that Monday is 0. And it is a first day on the week
  let adjustedFirstDay = firstDay - 1;
  if (adjustedFirstDay === -1) adjustedFirstDay = 6;


  //This builds the array of cells for the calendar grid
  // starts as an empty array 
  // first loop adds empty cells. Second loop adds actual day numbers.
  const days = [];
  // Add empty cells for days before the month starts
  for (let i = 0; i < adjustedFirstDay; i++) {
    days.push(null);
  }
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
// all of them should be true to be today
  const isToday = (day) => {
    return (
      day === today.getDate() &&
      displayMonth === today.getMonth() &&
      displayYear === today.getFullYear()
    );
  };

  useEffect(() => {
    // Fetch month events from the same endpoint used by Week/Day views.
    const fetchMonthEvents = async () => {
      const monthStart = toLocalDateKey(new Date(displayYear, displayMonth, 1));
      const monthEnd = toLocalDateKey(new Date(displayYear, displayMonth + 1, 0));
      const events = await safeFetchJson(
        `${API_BASE}/events?start=${monthStart}&end=${monthEnd}`,
        {},
        []
      );

      const grouped = (Array.isArray(events) ? events : []).reduce((acc, event) => {
        if (!event || typeof event.day !== 'string') return acc;
        const [y, m, d] = event.day.split('-').map(Number);
        if (!y || !m || !d) return acc;

        const eventDayKey = toLocalDateKey(new Date(y, m - 1, d));
        if (!acc[eventDayKey]) acc[eventDayKey] = [];
        acc[eventDayKey].push(event.colorId || '#F07878');
        return acc;
      }, {});

      setEventsByDay(grouped);
    };

    fetchMonthEvents();
  }, [displayMonth, displayYear]);

  //MonthView puts the date in the URL → DayView reads it. 
  const handleDayClick = (day) => {
    if (day !== null) {
      const date = new Date(displayYear, displayMonth, day);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;
      navigate(`/day/${dateString}`);
    }
  };

  return (
    <div className="bg-peach min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-darktext mb-8">
          {monthNames[displayMonth]} {displayYear}
        </h2>

        {/* Match Week view container palette/shadow while slightly enlarging the calendar area. */}
        <div className="rounded-3xl bg-[#FFF6E9] p-6 shadow-[0_20px_60px_rgba(61,43,31,0.12)] md:p-8">
          {/* Header and day cells share the same 7-column layout for exact alignment. */}
          <div className="mb-2 grid w-full grid-cols-7 gap-0">
            {dayHeaders.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-sm font-semibold uppercase text-mauve md:py-3 md:text-base"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid w-full grid-cols-7 gap-0">
            {days.map((day, index) => (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                // Keep each date centered in its exact weekday column with no left offset.
                className={`min-h-[60px] p-0 sm:min-h-[72px] md:min-h-[110px] lg:min-h-[130px] ${
                  day !== null ? 'cursor-pointer hover:bg-cream transition-colors' : ''
                }`}
              >
                {day !== null && (
                  <div className="flex h-full w-full flex-col items-center justify-start gap-1 py-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center text-sm font-medium md:h-10 md:w-10 md:text-base ${
                        isToday(day)
                          ? 'bg-mauve text-white rounded-full font-semibold'
                          : 'text-darktext'
                      }`}
                    >
                      {day}
                    </div>
                    {/* Render one tidy color dot per event for this day (same colorId as event). */}
                    <div className="flex max-w-full flex-wrap items-center justify-center gap-1 px-1 pb-1">
                      {(() => {
                        const dayKey = toLocalDateKey(new Date(displayYear, displayMonth, day));
                        return (eventsByDay[dayKey] || []).map((eventColor, dotIndex) => (
                          <span
                            key={`${dayKey}-${dotIndex}`}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: eventColor }}
                          />
                        ));
                      })()}
                    </div>
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

export default MonthView; // makes this component available to the rest of the app
