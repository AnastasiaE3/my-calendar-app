import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { safeFetchJson, jsonHeaders } from '../api';

const colorOptions = [
  { id: 'pink', stripe: 'bg-[#FF85A1]', tint: 'bg-[rgba(255,133,161,0.18)]' },
  { id: 'purple', stripe: 'bg-[#C39BD3]', tint: 'bg-[rgba(195,155,211,0.18)]' },
  { id: 'coral', stripe: 'bg-[#F07878]', tint: 'bg-[rgba(240,120,120,0.18)]' },
];

function WeekView() {
  const params = useParams();
  const navigate = useNavigate();
  const today = new Date();

  const [events, setEvents] = useState([]);
  const [modalState, setModalState] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedColorId, setSelectedColorId] = useState(colorOptions[0].id);
  const [loading, setLoading] = useState(false);
  const safeArray = (value) => (Array.isArray(value) ? value : []);

  const displayDateString = params.date || today.toISOString().split('T')[0];
  let displayDate = new Date(displayDateString);
  if (Number.isNaN(displayDate.getTime())) {
    displayDate = today;
  }

  const currentWeekStart = new Date(displayDate);
  const dayIndex = currentWeekStart.getDay();
  const offset = currentWeekStart.getDate() - dayIndex + (dayIndex === 0 ? -6 : 1);
  currentWeekStart.setDate(offset);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return {
      shortName: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][i],
      date: date.getDate(),
      dateString: date.toISOString().split('T')[0],
      displayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
    };
  });

  const hours = Array.from({ length: 15 }, (_, i) => {
    const hour = 7 + i;
    return `${String(hour).padStart(2, '0')}:00`;
  });

  const isToday = (dateString) => {
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getColorOption = (id) => colorOptions.find((option) => option.id === id) || colorOptions[0];

  const findDisplayName = (dateString) => {
    return weekDays.find((day) => day.dateString === dateString)?.displayName || new Date(dateString).toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getWeekRange = () => {
    return {
      start: weekDays[0]?.dateString,
      end: weekDays[weekDays.length - 1]?.dateString,
    };
  };

  const fetchWeekEvents = async () => {
    setLoading(true);
    const { start, end } = getWeekRange();
    const eventsFromApi = await safeFetchJson(
      `http://localhost:8080/api/events?start=${start}&end=${end}`,
      {},
      []
    );
    setEvents(Array.isArray(eventsFromApi) ? eventsFromApi : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWeekEvents();
  }, [displayDateString]);

  const openCreateModal = (dayDateString, startHour, endHour) => {
    setModalState({ mode: 'create', dayDateString, startHour, endHour });
    setTitle('');
    setSelectedColorId(colorOptions[0].id);
  };

  const openEditModal = (event) => {
    setModalState({ mode: 'edit', eventId: event.id, dayDateString: event.day, startHour: event.startHour, endHour: event.endHour });
    setTitle(event.title);
    setSelectedColorId(event.colorId);
  };

  const closeModal = () => {
    setModalState(null);
    setTitle('');
    setSelectedColorId(colorOptions[0].id);
  };

  const saveEvent = async () => {
    if (!modalState || !title.trim()) return;
    const normalizedTitle = title.trim();

    try {
      if (modalState.mode === 'edit' && modalState.eventId) {
        await fetch(`http://localhost:8080/api/events/${modalState.eventId}`, {
          method: 'PUT',
          headers: jsonHeaders,
          body: JSON.stringify({
            day: modalState.dayDateString,
            startHour: modalState.startHour,
            endHour: modalState.endHour,
            title: normalizedTitle,
            colorId: selectedColorId,
          }),
        });
      } else {
        const created = await safeFetchJson(
          'http://localhost:8080/api/events',
          {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({
              day: modalState.dayDateString,
              startHour: modalState.startHour,
              endHour: modalState.endHour,
              title: normalizedTitle,
              colorId: selectedColorId,
            }),
          },
          null
        );
        if (created && created.id) {
          setEvents((prev) => [...safeArray(prev), created]);
        }
      }
    } catch (error) {
      console.error('Failed saving event', error);
    }

    await fetchWeekEvents();
    closeModal();
  };

  const deleteEvent = async () => {
    if (!modalState?.eventId) return;
    try {
      await fetch(`http://localhost:8080/api/events/${modalState.eventId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed deleting event', error);
    }
    await fetchWeekEvents();
    closeModal();
  };

  const finalizeSelection = () => {
    if (!dragState?.active) return;
    const startHour = Math.min(dragState.startHour, dragState.currentHour);
    const endHour = Math.max(dragState.startHour, dragState.currentHour) + 1;
    setDragState(null);
    setIsDragging(false);
    openCreateModal(dragState.dayDateString, startHour, endHour);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseUp = () => finalizeSelection();
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, dragState]);

  const startDrag = (dayDateString, hourValue) => {
    const existingEvents = events.filter((event) => event.day === dayDateString && hourValue >= event.startHour && hourValue < event.endHour);
    if (existingEvents.length > 0) {
      openEditModal(existingEvents[0]);
      return;
    }
    setIsDragging(true);
    setDragState({ active: true, dayDateString, startHour: hourValue, currentHour: hourValue });
  };

  const updateDrag = (dayDateString, hourValue) => {
    if (!isDragging || !dragState || dragState.dayDateString !== dayDateString) return;
    if (hourValue !== dragState.currentHour) {
      setDragState({ ...dragState, currentHour: hourValue });
    }
  };

  const renderModalTitle = () => {
    if (!modalState) return '';
    const dayName = findDisplayName(modalState.dayDateString);
    const start = `${String(modalState.startHour).padStart(2, '0')}:00`;
    const end = `${String(modalState.endHour - 1).padStart(2, '0')}:00`;
    return `${dayName} ${start} — ${end}`;
  };

  return (
    <div className="min-h-screen bg-peach py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="overflow-x-auto rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(61,43,31,0.12)]">
          <div className="grid grid-cols-[96px_repeat(7,minmax(0,1fr))] gap-4">
            <div />
            {weekDays.map((day) => (
              <button
                key={day.dateString}
                type="button"
                onClick={() => navigate(`/day/${day.dateString}`)}
                className="flex flex-col items-center gap-3 rounded-3xl bg-white px-3 py-4 text-center transition hover:bg-cream"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-mauve">
                  {day.shortName}
                </span>
                <span className={`grid h-12 w-12 place-items-center rounded-full text-lg font-bold ${isToday(day.dateString) ? 'bg-mauve text-white' : 'text-darktext'}`}>
                  {day.date}
                </span>
              </button>
            ))}
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div className="flex items-center justify-end pr-4 text-sm text-[#7a5f4c]">
                  {hour}
                </div>
                {weekDays.map((day) => {
                  const hourValue = parseInt(hour, 10);
                  const cellEvents = events.filter((event) => event.day === day.dateString && hourValue >= event.startHour && hourValue < event.endHour);
                  const primaryEvent = cellEvents[0];
                  const color = primaryEvent ? getColorOption(primaryEvent.colorId) : null;
                  const isSelected = dragState?.active && dragState.dayDateString === day.dateString && hourValue >= Math.min(dragState.startHour, dragState.currentHour) && hourValue <= Math.max(dragState.startHour, dragState.currentHour);
                  const baseClass = primaryEvent ? color.tint : isSelected ? 'bg-[#ffe3ea]' : 'bg-cream';
                  const hoverClass = primaryEvent ? '' : 'hover:bg-cream/90';
                  const labelEvent = primaryEvent && primaryEvent.startHour === hourValue ? primaryEvent : null;

                  return (
                    <button
                      key={`${day.dateString}-${hour}`}
                      type="button"
                      onMouseDown={() => startDrag(day.dateString, hourValue)}
                      onMouseEnter={() => updateDrag(day.dateString, hourValue)}
                      className={`h-12 rounded-xl p-0 text-left transition ${baseClass} ${hoverClass}`}
                    >
                      <div className="flex h-full w-full overflow-hidden rounded-xl">
                        <div className={`h-full w-1.5 ${primaryEvent ? color.stripe : 'bg-transparent'}`} />
                        <div className="flex flex-1 items-center justify-center px-2">
                          {labelEvent ? (
                            <span className="truncate text-xs font-semibold text-darktext">
                              {labelEvent.title}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={closeModal}>
          <div className="w-full max-w-md rounded-3xl bg-cream p-6 shadow-[0_20px_60px_rgba(61,43,31,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 text-lg font-semibold text-darktext">{renderModalTitle()}</div>
            <label className="mb-2 block text-sm font-medium text-darktext">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm text-darktext outline-none focus:border-mauve focus:ring-2 focus:ring-mauve/20"
            />
            <div className="mb-5 grid grid-cols-3 gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setSelectedColorId(color.id)}
                  className={`h-11 w-11 rounded-full ${color.tint} ${selectedColorId === color.id ? 'ring-2 ring-darktext' : ''}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={saveEvent}
                className="flex-1 rounded-lg bg-mauve px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#a5648f]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg bg-gray-200 px-4 py-3 text-sm font-semibold text-darktext transition hover:bg-gray-300"
              >
                Cancel
              </button>
              {modalState.mode === 'edit' && (
                <button
                  type="button"
                  onClick={deleteEvent}
                  className="rounded-lg bg-[#F07878] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#d55c5c]"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeekView;
