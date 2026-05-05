import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import YearView from './views/YearView';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import DayView from './views/DayView';

function NavigationBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const today = new Date();

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const getNavButtonClass = (path) => {
    const baseClass = "px-4 py-2 font-semibold rounded-lg transition-colors";
    const activeClass = isActive(path)
      ? "bg-mauve text-white"
      : "bg-peach text-darktext hover:bg-coral";
    return `${baseClass} ${activeClass}`;
  };

  const handlePrevious = () => {
    if (isActive('/year')) {
      navigate('/year');
    } else if (isActive('/month')) {
      const match = location.pathname.match(/\/month\/(\d+)\/(\d+)/);
      if (match) {
        let month = parseInt(match[1]);
        let year = parseInt(match[2]);
        month--;
        if (month < 0) {
          month = 11;
          year--;
        }
        navigate(`/month/${month}/${year}`);
      }
    } else if (isActive('/week')) {
      const match = location.pathname.match(/\/week\/(.+)/);
      if (match) {
        const currentDate = new Date(match[1]);
        currentDate.setDate(currentDate.getDate() - 7);
        navigate(`/week/${currentDate.toISOString().split('T')[0]}`);
      }
    } else if (isActive('/day')) {
      const match = location.pathname.match(/\/day\/(.+)/);
      if (match) {
        const currentDate = new Date(match[1]);
        currentDate.setDate(currentDate.getDate() - 1);
        navigate(`/day/${currentDate.toISOString().split('T')[0]}`);
      }
    }
  };

  const handleNext = () => {
    if (isActive('/year')) {
      navigate('/year');
    } else if (isActive('/month')) {
      const match = location.pathname.match(/\/month\/(\d+)\/(\d+)/);
      if (match) {
        let month = parseInt(match[1]);
        let year = parseInt(match[2]);
        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
        navigate(`/month/${month}/${year}`);
      }
    } else if (isActive('/week')) {
      const match = location.pathname.match(/\/week\/(.+)/);
      if (match) {
        const currentDate = new Date(match[1]);
        currentDate.setDate(currentDate.getDate() + 7);
        navigate(`/week/${currentDate.toISOString().split('T')[0]}`);
      }
    } else if (isActive('/day')) {
      const match = location.pathname.match(/\/day\/(.+)/);
      if (match) {
        const currentDate = new Date(match[1]);
        currentDate.setDate(currentDate.getDate() + 1);
        navigate(`/day/${currentDate.toISOString().split('T')[0]}`);
      }
    }
  };

  const handleToday = () => {
    const todayString = today.toISOString().split('T')[0];
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

function App() {
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

export default App;
