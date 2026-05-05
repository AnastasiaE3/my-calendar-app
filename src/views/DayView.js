import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

function DayView() {
  const params = useParams();
  
  // Get date from URL params or use current date
  let displayDate = new Date();
  if (params.date) {
    displayDate = new Date(params.date);
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [expandedSections, setExpandedSections] = useState({
    appointments: true,
    notes: true,
    lists: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const dayName = dayNames[displayDate.getDay()];
  const monthName = monthNames[displayDate.getMonth()];
  const date = displayDate.getDate();
  const year = displayDate.getFullYear();

  return (
    <div className="bg-peach min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with Date Circle */}
        <div className="flex items-start gap-6 mb-8">
          <div className="bg-mauve rounded-3xl w-24 h-24 flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold uppercase">{monthName}</span>
            <span className="text-white text-4xl font-bold">{date}</span>
          </div>
          <div>
            <h1 className="text-5xl font-bold text-darktext">{dayName}</h1>
            <p className="text-lg text-darktext mt-2">
              {monthName} {date}, {year}
            </p>
          </div>
        </div>

        {/* Appointments & Meetings Section */}
        <div className="bg-white rounded-3xl shadow-md mb-6 overflow-hidden">
          <div
            className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('appointments')}
          >
            <div className="flex items-center gap-4">
              <div className="bg-coral rounded-lg p-3">
                <span className="text-white text-xl">📋</span>
              </div>
              <h2 className="text-xl font-semibold text-darktext">Appointments & Meetings</h2>
            </div>
            <button className="text-mauve font-bold text-2xl">
              {expandedSections.appointments ? '−' : '+'}
            </button>
          </div>
          {expandedSections.appointments && (
            <div className="border-t border-gray-100 px-6 py-8 bg-cream bg-opacity-30">
              <p className="text-center text-gray-600 mb-6">
                No appointments today. Enjoy your day! 💚
              </p>
              <div className="text-center">
                <button className="text-coral font-semibold text-sm hover:text-mauve">
                  + Add appointment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-3xl shadow-md mb-6 overflow-hidden">
          <div
            className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('notes')}
          >
            <div className="flex items-center gap-4">
              <div className="bg-coral rounded-lg p-3">
                <span className="text-white text-xl">📝</span>
              </div>
              <h2 className="text-xl font-semibold text-darktext">Notes</h2>
            </div>
            <button className="text-mauve font-bold text-2xl">
              {expandedSections.notes ? '−' : '+'}
            </button>
          </div>
          {expandedSections.notes && (
            <div className="border-t border-gray-100 px-6 py-6 bg-cream bg-opacity-30">
              <textarea
                className="w-full bg-cream rounded-xl p-4 text-darktext placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mauve resize-none"
                rows="6"
                placeholder="What's on your mind today?"
              />
            </div>
          )}
        </div>

        {/* Lists Section */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div
            className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('lists')}
          >
            <div className="flex items-center gap-4">
              <div className="bg-coral rounded-lg p-3">
                <span className="text-white text-xl">✓</span>
              </div>
              <h2 className="text-xl font-semibold text-darktext">Lists</h2>
            </div>
            <button className="text-mauve font-bold text-2xl">
              {expandedSections.lists ? '−' : '+'}
            </button>
          </div>
          {expandedSections.lists && (
            <div className="border-t border-gray-100 px-6 py-8 bg-cream bg-opacity-30">
              <p className="text-center text-gray-600 mb-6">
                No lists yet – start by creating one 🌟
              </p>
              <div className="text-center">
                <button className="text-coral font-semibold text-sm hover:text-mauve">
                  + New list
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DayView;
