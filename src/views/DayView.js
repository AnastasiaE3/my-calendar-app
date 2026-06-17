import React, { useState, useRef, useEffect } from 'react';
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
  const dateKey = displayDate.toISOString().split('T')[0];

  const [expandedSections, setExpandedSections] = useState({
    appointments: true,
    notes: true,
    lists: true,
  });

  const [appointments, setAppointments] = useState([]);
  const [notes, setNotes] = useState('');
  const [lists, setLists] = useState([]); // [{id, name, items: [{id,text,checked}]}]
  const [modalState, setModalState] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [newListInput, setNewListInput] = useState(false);
  const [newItemText, setNewItemText] = useState({});
  const itemInputRefs = useRef({});
  const [loading, setLoading] = useState(false);
  const noteSaveTimer = useRef(null);

  const safeArray = (value) => (Array.isArray(value) ? value : []);
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

  const notificationTimers = useRef([]);

  const clearNotificationTimers = () => {
    notificationTimers.current.forEach((timerId) => clearTimeout(timerId));
    notificationTimers.current = [];
  };

  const scheduleReminderNotification = (title, timeLabel, scheduledTime) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const delay = scheduledTime.getTime() - Date.now();
    if (delay <= 0) return;
    notificationTimers.current.push(
      window.setTimeout(() => {
        new Notification(`Reminder: ${title}`, {
          body: `${timeLabel} — ${scheduledTime.toLocaleString()}`,
        });
      }, delay)
    );
  };

  const scheduleReminders = (appointmentsList) => {
    clearNotificationTimers();
    (Array.isArray(appointmentsList) ? appointmentsList : []).forEach((appointment) => {
      const appointmentDate = appointment.date ? new Date(appointment.date) : new Date(dateKey);
      const [hour, minute] = (appointment.time || '09:00').split(':').map(Number);
      appointmentDate.setHours(hour, minute, 0, 0);
      const reminders = appointment.reminders || {};
      if (reminders.week) {
        const time = new Date(appointmentDate);
        time.setDate(time.getDate() - 7);
        scheduleReminderNotification(appointment.title || 'Appointment', '1 week before', time);
      }
      if (reminders.day) {
        const time = new Date(appointmentDate);
        time.setDate(time.getDate() - 1);
        scheduleReminderNotification(appointment.title || 'Appointment', '1 day before', time);
      }
      if (reminders.min30) {
        const time = new Date(appointmentDate);
        time.setMinutes(time.getMinutes() - 30);
        scheduleReminderNotification(appointment.title || 'Appointment', '30 minutes before', time);
      }
    });
  };

  const getCurrentDayData = () => ({ appointments, notes, lists });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const dayName = dayNames[displayDate.getDay()];
  const monthName = monthNames[displayDate.getMonth()];
  const date = displayDate.getDate();
  const year = displayDate.getFullYear();

  const currentData = getCurrentDayData();
  const safeAppointments = safeArray(currentData.appointments);
  const safeLists = safeArray(lists);
  const noteValue = notes || '';

  const openAppointmentModal = (appointment = null) => {
    if (appointment) {
      const reminders = appointment.reminders || { week: false, day: false, min30: false };
      setModalState({ mode: 'edit', id: appointment.id, title: appointment.title || '', time: appointment.time || '09:00', reminders });
    } else {
      setModalState({ mode: 'create', id: null, title: '', time: '09:00', reminders: { week: false, day: false, min30: false } });
    }
  };

  const closeModal = () => setModalState(null);

  const saveAppointment = async () => {
    if (!modalState || !modalState.title.trim()) return;
    try {
      if (modalState.mode === 'create') {
        await fetch(`http://localhost:8080/api/appointments`, {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ date: dateKey, title: modalState.title, time: modalState.time, reminders: modalState.reminders }),
        });
      } else {
        await fetch(`http://localhost:8080/api/appointments/${modalState.id}`, {
          method: 'PUT',
          headers: jsonHeaders,
          body: JSON.stringify({ date: dateKey, title: modalState.title, time: modalState.time, reminders: modalState.reminders }),
        });
      }
      await refreshDayData();
    } catch (e) {
      console.error('Failed saving appointment', e);
    }
    closeModal();
  };

  const deleteAppointment = async (id) => {
    try {
      await fetch(`http://localhost:8080/api/appointments/${id}`, { method: 'DELETE' });
      await refreshDayData();
    } catch (e) {
      console.error('Failed deleting appointment', e);
    }
  };

  const toggleReminder = (key) => {
    setModalState((prev) => ({
      ...prev,
      reminders: { ...prev.reminders, [key]: !prev.reminders[key] },
    }));
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

  const refreshDayData = async () => {
    setLoading(true);
    try {
      const [notesRes, aptsRes, listsRes] = await Promise.all([
        fetch(`http://localhost:8080/api/notes?date=${dateKey}`),
        fetch(`http://localhost:8080/api/appointments?date=${dateKey}`),
        fetch(`http://localhost:8080/api/lists?date=${dateKey}`),
      ]);
      const notesJson = await safeJson(notesRes, null);
      const aptsJson = await safeJson(aptsRes, []);
      const listsJson = await safeJson(listsRes, []);
      setNotes(safeNotesValue(notesJson));
      const safeApts = safeArray(aptsJson);
      setAppointments(safeApts);
      setLists(safeArray(listsJson));
      scheduleReminders(safeApts);
    } catch (e) {
      console.error('Failed fetching day data', e);
    }
    setLoading(false);
  };

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
      clearNotificationTimers();
      if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
    };
  }, [dateKey]);

  return (
    <div className="bg-peach min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
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

        <div className="bg-white rounded-3xl shadow-md mb-6 overflow-hidden">
          <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('appointments')}>
            <div className="flex items-center gap-4">
              <div className="bg-coral rounded-lg p-3">
                <span className="text-white text-xl">📋</span>
              </div>
              <h2 className="text-xl font-semibold text-darktext">Appointments & Meetings</h2>
            </div>
            <button className="text-mauve font-bold text-2xl">{expandedSections.appointments ? '−' : '+'}</button>
          </div>
          {expandedSections.appointments && (
            <div className="border-t border-gray-100 px-6 py-8 bg-cream bg-opacity-30">
              {loading ? (
                <p className="text-center text-gray-400 mb-6">Loading appointments…</p>
              ) : safeAppointments.length === 0 ? (
                <p className="text-center text-gray-600 mb-6">No appointments today. Enjoy your day! 💚</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {safeAppointments.map((apt) => (
                    <div key={apt.id} className="bg-white rounded-2xl p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-darktext">{apt.title}</p>
                        <p className="text-sm text-gray-600">{apt.time}</p>
                        {(apt.reminders.week || apt.reminders.day || apt.reminders.min30) && (
                          <div className="flex gap-2 mt-2">
                            {apt.reminders.week && <span className="text-xs bg-mauve text-white px-2 py-1 rounded">1 week</span>}
                            {apt.reminders.day && <span className="text-xs bg-mauve text-white px-2 py-1 rounded">1 day</span>}
                            {apt.reminders.min30 && <span className="text-xs bg-mauve text-white px-2 py-1 rounded">30 min</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-3">
                        <button onClick={() => openAppointmentModal(apt)} className="text-mauve hover:text-[#a5648f]">
                          ✏️
                        </button>
                        <button onClick={() => deleteAppointment(apt.id)} className="text-coral hover:text-[#d55c5c]">
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-center">
                <button onClick={() => openAppointmentModal()} className="text-coral font-semibold text-sm hover:text-mauve">
                  + Add appointment
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
            <label className="block text-sm font-medium text-darktext mb-2">Start time</label>
            <input
              type="time"
              value={modalState.time}
              onChange={(e) => setModalState((prev) => ({ ...prev, time: e.target.value }))}
              className="w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm text-darktext outline-none focus:border-mauve focus:ring-2 focus:ring-mauve/20 mb-4"
            />
            <label className="block text-sm font-medium text-darktext mb-3">Reminders</label>
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => toggleReminder('week')}
                className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition ${modalState.reminders.week ? 'bg-mauve text-white border-mauve' : 'border-mauve text-mauve'}`}
              >
                1 week before
              </button>
              <button
                onClick={() => toggleReminder('day')}
                className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition ${modalState.reminders.day ? 'bg-mauve text-white border-mauve' : 'border-mauve text-mauve'}`}
              >
                1 day before
              </button>
              <button
                onClick={() => toggleReminder('min30')}
                className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition ${modalState.reminders.min30 ? 'bg-mauve text-white border-mauve' : 'border-mauve text-mauve'}`}
              >
                30 min before
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={saveAppointment} className="flex-1 rounded-lg bg-mauve px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#a5648f]">
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
