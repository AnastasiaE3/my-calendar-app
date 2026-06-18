import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { safeFetchJson, jsonHeaders } from '../api';

function DayView() {
  const params = useParams();

  let displayDate = new Date();
  if (params.date) {
    displayDate = new Date(params.date);
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dateKey = (() => {
    const yyyy = displayDate.getFullYear();
    const mm = String(displayDate.getMonth() + 1).padStart(2, '0');
    const dd = String(displayDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const [expandedSections, setExpandedSections] = useState({
    appointments: true,
    notes: true,
    lists: true,
  });

  // Appointments were removed in favor of Events backend.
  const [notes, setNotes] = useState('');
  const [lists, setLists] = useState([]); // [{id, name, items: [{id,text,checked}]}]
  // Events fetched from backend for this day
  const [eventsForDay, setEventsForDay] = useState([]);
  const [modalState, setModalState] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [newListInput, setNewListInput] = useState(false);
  const [newItemText, setNewItemText] = useState({});
  const itemInputRefs = useRef({});
  const [loading, setLoading] = useState(false);
  const noteSaveTimer = useRef(null);

  const DEFAULT_EVENT_COLOR_ID = '#F07878'; // default event color for new Day view events
  const safeArray = (value) => (Array.isArray(value) ? value : []);
  const parseTimeToDecimal = (value) => {
    const [hour, minute] = (value || '00:00').split(':').map(Number);
    return hour + (minute || 0) / 60;
  };
  const safeNotesValue = (value) => {
    if (value == null) return '';
    if (typeof value === 'object') return value.content || '';
    return String(value);
  };
  const safeJson = async (response, defaultValue) => {
    if (!response || !response.ok) return defaultValue;
    try {
      const data = await response.json();
      return data == null ? defaultValue : data;
    } catch (error) {
      return defaultValue;
    }
  };

  // Appointments were removed in favor of Events. getCurrentDayData and currentData cleanup follows.

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const dayName = dayNames[displayDate.getDay()];
  const monthName = monthNames[displayDate.getMonth()];
  const date = displayDate.getDate();
  const year = displayDate.getFullYear();

  const safeLists = safeArray(lists);
  const noteValue = notes || '';

  const openEventModal = () => {
    // Open modal to create a new event
    setModalState({ mode: 'create', id: null, title: '', time: '09:00', endTime: '10:00' });
  };

  const closeModal = () => setModalState(null);

  const saveEvent = async () => {
    if (!modalState || !modalState.title.trim()) return;
    try {
      // Create a new backend event using the same body shape as WeekView
      await safeFetchJson(
        'http://localhost:8080/api/events',
        {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({
            day: dateKey,
            startHour: parseTimeToDecimal(modalState.time),
            endHour: parseTimeToDecimal(modalState.endTime),
            title: modalState.title.trim(),
            colorId: DEFAULT_EVENT_COLOR_ID,
          }),
        },
        null
      );
      await fetchEventsForDay();
    } catch (e) {
      console.error('Failed saving event', e);
    }
    closeModal();
  };

  const updateNotes = (text) => {
    setNotes(text);
    if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
    noteSaveTimer.current = setTimeout(async () => {
      try {
        await fetch('http://localhost:8080/api/notes', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ date: dateKey, content: text }),
        });
      } catch (e) {
        console.error('Failed saving note', e);
      }
    }, 1000);
  };

  const createNewList = async () => {
    if (!newListName.trim()) return;
    try {
      await fetch('http://localhost:8080/api/lists', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ date: dateKey, name: newListName }),
      });
      await refreshDayData();
      setNewListName('');
      setNewListInput(false);
    } catch (e) {
      console.error('Failed creating list', e);
    }
  };

  const deleteList = async (listId) => {
    try {
      await fetch(`http://localhost:8080/api/lists/${listId}`, { method: 'DELETE' });
      await refreshDayData();
    } catch (e) {
      console.error('Failed deleting list', e);
    }
  };

  const addItemToList = async (listId, itemText) => {
    if (!itemText.trim()) return;
    try {
      await fetch(`http://localhost:8080/api/lists/${listId}/items`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ text: itemText }),
      });
      await refreshDayData();
      setNewItemText((prev) => ({ ...prev, [listId]: '' }));
      setTimeout(() => {
        if (itemInputRefs.current[listId]) {
          itemInputRefs.current[listId].focus();
        }
      }, 0);
    } catch (e) {
      console.error('Failed adding item', e);
    }
  };

  const toggleItem = async (listId, itemId) => {
    try {
      const list = lists.find((l) => l.id === listId);
      if (!list) return;
      const item = (list.items || []).find((it) => it.id === itemId);
      if (!item) return;
      await fetch(`http://localhost:8080/api/lists/items/${itemId}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ checked: !item.checked }),
      });
      await refreshDayData();
    } catch (e) {
      console.error('Failed toggling item', e);
    }
  };

  const deleteItem = async (listId, itemId) => {
    try {
      await fetch(`http://localhost:8080/api/lists/items/${itemId}`, { method: 'DELETE' });
      await refreshDayData();
    } catch (e) {
      console.error('Failed deleting item', e);
    }
  };

  const refreshDayData = useCallback(async () => {
    setLoading(true);
    try {
      const [notesRes, listsRes] = await Promise.all([
        fetch(`http://localhost:8080/api/notes?date=${dateKey}`),
        fetch(`http://localhost:8080/api/lists?date=${dateKey}`),
      ]);
      const notesJson = await safeJson(notesRes, null);
      const listsJson = await safeJson(listsRes, []);
      setNotes(safeNotesValue(notesJson));
      setLists(safeArray(listsJson));
    } catch (e) {
      console.error('Failed fetching day data', e);
    }
    setLoading(false);
  }, [dateKey]); // Wrap in useCallback to provide stable function identity

  const fetchEventsForDay = useCallback(async (shouldSetState = true) => {
    try {
      const eventsFromApi = await safeFetchJson(
        `http://localhost:8080/api/events?start=${dateKey}&end=${dateKey}`,
        {},
        []
      );
      const safeEvents = Array.isArray(eventsFromApi) ? eventsFromApi : [];
      const [selectedYear, selectedMonth, selectedDay] = dateKey.split('-').map(Number);
      const selectedDayKey = toLocalDateKey(new Date(selectedYear, selectedMonth - 1, selectedDay));
      // Filter events by comparing the "day" field (YYYY-MM-DD string) directly
      // to the selected day's dateKey. Do not parse as Date (avoids UTC shifts).
      const matched = safeEvents.filter((ev) => ev && ev.day === selectedDayKey);
      if (shouldSetState) setEventsForDay(matched);
    } catch (err) {
      console.error('Failed fetching events for day', err);
      if (shouldSetState) setEventsForDay([]);
    }
  }, [dateKey]); // Wrap in useCallback to provide stable function identity

  // --- Helpers to format event times and local YYYY-MM-DD strings ---
  // Format a decimal hour (e.g. 9.5) into a localized time string
  const formatTime = (hourValue) => {
    const whole = Math.floor(hourValue);
    const minutes = hourValue % 1 === 0 ? 0 : 30;
    const date = new Date();
    date.setHours(whole, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Format start/end hour numbers into a single range string
  const formatRange = (startHour, endHour) => `${formatTime(startHour)} - ${formatTime(endHour)}`;

  // Build a local YYYY-MM-DD string from a Date using local year/month/day
  const toLocalDateKey = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // --- Fetch backend Events for this date when `dateKey` changes ---
  // Runs only when the primitive `dateKey` changes (prevents infinite loop)
  useEffect(() => {
    let mounted = true;
    fetchEventsForDay(mounted);
    return () => {
      mounted = false;
    };
  }, [dateKey, fetchEventsForDay]); // Added fetchEventsForDay to dependency array (now stable via useCallback)

  // Fetch data when dateKey changes
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (!mounted) return;
      await refreshDayData();
    };
    fetchData();
    return () => {
      mounted = false;
      if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
    };
  }, [dateKey, refreshDayData]); // Added refreshDayData to dependency array (now stable via useCallback)

  return (
    <div className="bg-peach min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start gap-6 mb-8">
          <div className="bg-mauve rounded-3xl w-24 h-24 flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold uppercase">{monthName}</span>
            <span className="text-white text-4xl font-bold">{date}</span>
          </div>
          <div>
            {/* Responsive heading sizing keeps long day names readable on phones. */}
            <h1 className="text-3xl font-bold leading-tight text-darktext sm:text-4xl md:text-5xl">{dayName}</h1>
            <p className="text-lg text-darktext mt-2">
              {monthName} {date}, {year}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-md mb-6 overflow-hidden">
          <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('appointments')}>
            <div className="flex items-center gap-4">
              <div className="bg-coral rounded-lg p-3">
                <span className="text-white text-xl">📋</span>
              </div>
              <h2 className="text-xl font-semibold text-darktext">Events</h2>
            </div>
            <button className="text-mauve font-bold text-2xl">{expandedSections.appointments ? '−' : '+'}</button>
          </div>
          {expandedSections.appointments && (
            <div className="border-t border-gray-100 px-6 py-8 bg-cream bg-opacity-30">
              {loading ? (
                <p className="text-center text-gray-400 mb-6">Loading events…</p>
              ) : eventsForDay.length === 0 ? (
                <p className="text-center text-gray-600 mb-6">No events scheduled today. 💚</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {eventsForDay.map((ev) => (
                    <div key={ev.id} className="bg-white rounded-2xl p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-darktext">{ev.title}</p>
                        <p className="text-sm text-gray-600">{formatRange(ev.startHour, ev.endHour)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-center">
                <button onClick={openEventModal} className="text-coral font-semibold text-sm hover:text-mauve">
                  + Add event
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-md mb-6 overflow-hidden">
          <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('notes')}>
            <div className="flex items-center gap-4">
              <div className="bg-coral rounded-lg p-3">
                <span className="text-white text-xl">📝</span>
              </div>
              <h2 className="text-xl font-semibold text-darktext">Notes</h2>
            </div>
            <button className="text-mauve font-bold text-2xl">{expandedSections.notes ? '−' : '+'}</button>
          </div>
          {expandedSections.notes && (
            <div className="border-t border-gray-100 px-6 py-6 bg-cream bg-opacity-30">
              <textarea
                value={noteValue}
                onChange={(e) => updateNotes(e.target.value)}
                className="w-full bg-cream rounded-xl p-4 text-darktext placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mauve resize-none"
                rows="6"
                placeholder="What's on your mind today?"
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('lists')}>
            <div className="flex items-center gap-4">
              <div className="bg-coral rounded-lg p-3">
                <span className="text-white text-xl">✓</span>
              </div>
              <h2 className="text-xl font-semibold text-darktext">Lists</h2>
            </div>
            <button className="text-mauve font-bold text-2xl">{expandedSections.lists ? '−' : '+'}</button>
          </div>
          {expandedSections.lists && (
            <div className="border-t border-gray-100 px-6 py-8 bg-cream bg-opacity-30">
              {loading ? (
                <p className="text-center text-gray-400 mb-6">Loading lists…</p>
              ) : safeLists.length === 0 && !newListInput ? (
                <p className="text-center text-gray-600 mb-6">No lists yet – start by creating one 🌟</p>
              ) : null}
              <div className="space-y-6 mb-6">
                {safeLists.map((list) => (
                  <div key={list.id}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-darktext">{list.name}</h3>
                      <button onClick={() => deleteList(list.id)} className="text-coral hover:text-[#d55c5c] text-sm">
                        🗑️
                      </button>
                    </div>
                    <div className="space-y-2 mb-3">
                      {Array.isArray(list.items) && list.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleItem(list.id, item.id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className={`flex-1 ${item.checked ? 'line-through text-gray-400' : 'text-darktext'}`}>{item.text}</span>
                          <button onClick={() => deleteItem(list.id, item.id)} className="text-coral hover:text-[#d55c5c] text-sm">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={(el) => {
                          if (el) itemInputRefs.current[list.id] = el;
                        }}
                        type="text"
                        value={newItemText[list.id] || ''}
                        onChange={(e) => setNewItemText((prev) => ({ ...prev, [list.id]: e.target.value }))}
                        placeholder="Add an item..."
                        className="flex-1 bg-cream rounded-lg px-3 py-2 text-sm focus:outline-none"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addItemToList(list.id, newItemText[list.id]);
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {newListInput ? (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="List name..."
                    className="flex-1 bg-cream rounded-lg px-3 py-2 text-sm focus:outline-none"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && createNewList()}
                  />
                  <button onClick={createNewList} className="text-coral font-semibold text-sm hover:text-mauve">
                    ✓
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <button onClick={() => setNewListInput(true)} className="text-coral font-semibold text-sm hover:text-mauve">
                    + New list
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={closeModal}>
          <div className="w-full max-w-md rounded-3xl bg-cream p-6 shadow-[0_20px_60px_rgba(61,43,31,0.18)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-darktext mb-4">Add Appointment</h3>
            <label className="block text-sm font-medium text-darktext mb-2">Title</label>
            <input
              type="text"
              value={modalState.title}
              onChange={(e) => setModalState((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm text-darktext outline-none focus:border-mauve focus:ring-2 focus:ring-mauve/20 mb-4"
            />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-darktext mb-2">Start time</label>
                <input
                  type="time"
                  value={modalState.time}
                  onChange={(e) => setModalState((prev) => ({ ...prev, time: e.target.value }))}
                  className="w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm text-darktext outline-none focus:border-mauve focus:ring-2 focus:ring-mauve/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darktext mb-2">End time</label>
                <input
                  type="time"
                  value={modalState.endTime}
                  onChange={(e) => setModalState((prev) => ({ ...prev, endTime: e.target.value }))}
                  className="w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm text-darktext outline-none focus:border-mauve focus:ring-2 focus:ring-mauve/20"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={saveEvent} className="flex-1 rounded-lg bg-mauve px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#a5648f]">
                Save
              </button>
              <button onClick={closeModal} className="flex-1 rounded-lg bg-gray-200 px-4 py-3 text-sm font-semibold text-darktext transition hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DayView;
