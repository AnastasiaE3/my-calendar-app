import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import YearView from './views/YearView';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import DayView from './views/DayView';

function NavigationBar() { //  the top navigation bar with Year/Month/Week/Day buttons and the arrows.
  const location = useLocation(); //gives the current URL as an object
  const navigate = useNavigate();
  const today = new Date();

  const formatLocalDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

//Checks if the current URL starts with a given path. 
// this is used to determine which navigation button 
//should be highlighted as active based on the current view.
  const isActive = (path) => { 
    return location.pathname.startsWith(path);
  };

  const getNavButtonClass = (path) => {
    // Mobile-first sizing keeps nav buttons readable without forcing horizontal page overflow.
    const baseClass = "px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors md:px-4 md:py-2 md:text-base";
    // depends on whether this button is the current view .
    const activeClass = isActive(path)
      ? "bg-mauve text-white"
      : "bg-peach text-darktext hover:bg-coral";
    return `${baseClass} ${activeClass}`;
  };
// This allows to click the arrow.
// it checks what view is currently on and allows to 
// navigate to the previous page (if not a year view).
  const parseMonthRoute = () => {
    const match = location.pathname.match(/\/month\/(\d+)\/(\d+)/);
    if (match) {
      return { month: parseInt(match[1], 10), year: parseInt(match[2], 10) };
    }
    return { month: today.getMonth(), year: today.getFullYear() };
  };

  const parseDateRoute = (prefix) => {
    const match = location.pathname.match(new RegExp(`${prefix}\\/(.+)`));
    if (match) {
      // Parse YYYY-MM-DD from the URL into a local Date (avoid Date(string) which may treat as UTC)
      const dateStr = match[1];
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1; // monthIndex
        const d = parseInt(parts[2], 10);
        return new Date(y, m, d); // local date
      }
      return new Date(dateStr);
    }
    // Return a fresh copy of today to avoid mutating the shared `today` Date object
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const handlePrevious = () => {
    if (location.pathname.startsWith('/year')) {
      const match = location.pathname.match(/\/year\/(\d+)/);
      const year = match ? parseInt(match[1], 10) - 1 : today.getFullYear() - 1;
      navigate(`/year/${year}`);
    } else if (location.pathname.startsWith('/month')) {
      const { month, year } = parseMonthRoute();
      let newMonth = month - 1;
      let newYear = year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      }
      navigate(`/month/${newMonth}/${newYear}`);
    } else if (location.pathname.startsWith('/week')) {
      const currentDate = parseDateRoute('/week');
      currentDate.setDate(currentDate.getDate() - 7);
      navigate(`/week/${formatLocalDate(currentDate)}`);
    } else if (location.pathname.startsWith('/day')) {
      const currentDate = parseDateRoute('/day');
      currentDate.setDate(currentDate.getDate() - 1);
      navigate(`/day/${formatLocalDate(currentDate)}`);
    }
  };

  const handleNext = () => {
    if (location.pathname.startsWith('/year')) {
      const match = location.pathname.match(/\/year\/(\d+)/);
      const year = match ? parseInt(match[1], 10) + 1 : today.getFullYear() + 1;
      navigate(`/year/${year}`);
    } else if (location.pathname.startsWith('/month')) {
      const { month, year } = parseMonthRoute();
      let newMonth = month + 1;
      let newYear = year;
      if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
      navigate(`/month/${newMonth}/${newYear}`);
    } else if (location.pathname.startsWith('/week')) {
      const currentDate = parseDateRoute('/week');
      currentDate.setDate(currentDate.getDate() + 7);
      navigate(`/week/${formatLocalDate(currentDate)}`);
    } else if (location.pathname.startsWith('/day')) {
      const currentDate = parseDateRoute('/day');
      currentDate.setDate(currentDate.getDate() + 1);
      navigate(`/day/${formatLocalDate(currentDate)}`);
    }
  };


  // this function is called when the "today" button is clicked.
  const handleToday = () => {
    const todayString = formatLocalDate(today);
    navigate(`/day/${todayString}`);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      {/* Mobile: left-aligned wrapped controls; md+: keep the current split layout. */}
      <div className="mx-auto flex w-full max-w-full flex-wrap items-center gap-2 px-3 py-3 md:max-w-7xl md:flex-nowrap md:justify-between md:px-4 md:py-4">
        <div className="flex flex-wrap gap-2 md:w-auto md:gap-4">
          <Link to="/year" className={getNavButtonClass('/year')}> 
            Year
          </Link> 
          <Link to={`/month/${today.getMonth()}/${today.getFullYear()}`} className={getNavButtonClass('/month')}>
            Month
          </Link>
          <Link to={`/week/${formatLocalDate(today)}`} className={getNavButtonClass('/week')}>
            Week
          </Link>
          <Link to={`/day/${formatLocalDate(today)}`} className={getNavButtonClass('/day')}>
            Day
          </Link>
        </div>

        {/* On small screens these controls flow directly after the view tabs (no right push). */}
        <div className="flex flex-wrap items-center gap-2 md:ml-auto md:w-auto md:justify-end md:gap-4">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm bg-white text-mauve font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 md:px-4 md:py-2 md:text-base"
          >
            Today
          </button>
          <button
            onClick={handlePrevious}
            className="px-2.5 py-1.5 text-sm bg-gray-100 text-darktext rounded-lg hover:bg-gray-200 md:px-3 md:py-2 md:text-base"
          >
            ←
          </button>
          <button
            onClick={handleNext}
            className="px-2.5 py-1.5 text-sm bg-gray-100 text-darktext rounded-lg hover:bg-gray-200 md:px-3 md:py-2 md:text-base"
          >
            →
          </button>
        </div>
      </div>
    </nav>
  );
}


//the root of everything.

function App() {
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch((error) => {
        console.warn('Notification permission request failed', error);
      });
    }
  }, []);

  return (
    <Router> 
     
      {/* Constrain app width on mobile to prevent full-page horizontal scrolling. */}
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-cream">
        <header className="bg-mauve text-white py-6 shadow-md">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold text-white">My Calendar</h1>
          </div>
        </header>

        <NavigationBar /> 

        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/year/:year" element={<YearView />} />
            <Route path="/year" element={<YearView />} />
            <Route path="/month/:month/:year" element={<MonthView />} />
            <Route path="/month" element={<MonthView />} />
            <Route path="/week/:date" element={<WeekView />} />
            <Route path="/week" element={<WeekView />} />
            <Route path="/day/:date" element={<DayView />} />
            <Route path="/day" element={<DayView />} />
            <Route path="/" element={<MonthView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; //Makes App available to index.js which renders it onto the page
