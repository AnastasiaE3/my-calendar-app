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


//Checks if the current URL starts with a given path. 
// this is used to determine which navigation button 
//should be highlighted as active based on the current view.
  const isActive = (path) => { 
    return location.pathname.startsWith(path);
  };

  const getNavButtonClass = (path) => {
    //styling that every button always has (padding, font, rounded corners)
    const baseClass = "px-4 py-2 font-semibold rounded-lg transition-colors";
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
      return new Date(match[1]);
    }
    return today;
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
      navigate(`/week/${currentDate.toISOString().split('T')[0]}`);
    } else if (location.pathname.startsWith('/day')) {
      const currentDate = parseDateRoute('/day');
      currentDate.setDate(currentDate.getDate() - 1);
      navigate(`/day/${currentDate.toISOString().split('T')[0]}`);
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
      navigate(`/week/${currentDate.toISOString().split('T')[0]}`);
    } else if (location.pathname.startsWith('/day')) {
      const currentDate = parseDateRoute('/day');
      currentDate.setDate(currentDate.getDate() + 1);
      navigate(`/day/${currentDate.toISOString().split('T')[0]}`);
    }
  };


  // this function is called when the "today" button is clicked.
  const handleToday = () => {
    const todayString = today.toISOString().split('T')[0]; //it gives "2026-05-12" format
    navigate(`/day/${todayString}`);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex gap-4">
          <Link to="/year" className={getNavButtonClass('/year')}> 
            Year
          </Link> 
          <Link to={`/month/${today.getMonth()}/${today.getFullYear()}`} className={getNavButtonClass('/month')}>
            Month
          </Link>
          <Link to={`/week/${today.toISOString().split('T')[0]}`} className={getNavButtonClass('/week')}>
            Week
          </Link>
          <Link to={`/day/${today.toISOString().split('T')[0]}`} className={getNavButtonClass('/day')}>
            Day
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-white text-mauve font-semibold rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={handlePrevious}
            className="px-3 py-2 bg-gray-100 text-darktext rounded-lg hover:bg-gray-200"
          >
            ←
          </button>
          <button
            onClick={handleNext}
            className="px-3 py-2 bg-gray-100 text-darktext rounded-lg hover:bg-gray-200"
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
     
      <div className="min-h-screen bg-cream">
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
