import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { safeFetchJson, jsonHeaders, API_BASE } from '../api';

const colorOptions = [
  {
    id: 'pink',
    stripe: 'bg-[#FF85A1]',
    tint: 'bg-[rgba(255,133,161,0.18)]',
    fill: '#FBC4D0',
  },
  {
    id: 'purple',
    stripe: 'bg-[#C39BD3]',
    tint: 'bg-[rgba(195,155,211,0.18)]',
    fill: '#D9BDE8',
  },
  {
    id: 'coral',
    stripe: 'bg-[#F07878]',
    tint: 'bg-[rgba(240,120,120,0.18)]',
    fill: '#F6B0A8',
  },
];

function WeekView() {
  const params = useParams();
  const navigate = useNavigate();
  const today = new Date();

  const [events, setEvents] = useState([]);
  const [modalState, setModalState] = useState(null);
  const [title, setTitle] = useState('');
  const [selectedColorId, setSelectedColorId] = useState(colorOptions[0].id);
  const [modalFormDate, setModalFormDate] = useState('');
  const [modalFormStartTime, setModalFormStartTime] = useState('09:00');
  const [modalFormEndTime, setModalFormEndTime] = useState('10:00');
  const safeArray = (value) => (Array.isArray(value) ? value : []);

  const HOUR_ROW_HEIGHT = 60;
  const visibleHours = Array.from({ length: 15 }, (_, i) => 7 + i);
  const todayString = (() => {
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  // Parse "YYYY-MM-DD" as local midnight (avoid Date(string), which treats it as UTC).
  const parseLocalDateString = (dateStr) => {
    const parts = (dateStr || '').split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    return new Date(dateStr);
  };

  const formatTime = (hourValue) => {
    const whole = Math.floor(hourValue);
    const minutes = hourValue % 1 === 0 ? 0 : 30;
    const date = new Date();
    date.setHours(whole, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatRange = (startHour, endHour) => `${formatTime(startHour)} - ${formatTime(endHour)}`;

  const formatInputTime = (hourValue) => {
    const whole = Math.floor(hourValue);
    const minutes = Math.round((hourValue - whole) * 60);
    return `${String(whole).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const parseInputTime = (value) => {
    const [hour, minute] = value.split(':').map(Number);
    return hour + (minute || 0) / 60;
  };

  const buildDayEventLayouts = (dayEvents) => {
    const sorted = [...dayEvents].sort((a, b) => a.startHour - b.startHour || a.endHour - b.endHour);
    const clusters = [];
    let currentCluster = [];
    let clusterEnd = 0;

    for (const event of sorted) {
      if (currentCluster.length === 0 || event.startHour < clusterEnd) {
        currentCluster.push(event);
        clusterEnd = Math.max(clusterEnd, event.endHour);
      } else {
        clusters.push(currentCluster);
        currentCluster = [event];
        clusterEnd = event.endHour;
      }
    }
    if (currentCluster.length) clusters.push(currentCluster);

    return clusters.flatMap((cluster) => {
      const columns = [];
      const eventLayouts = cluster.map((event) => {
        let column = columns.findIndex((endHour) => event.startHour >= endHour);
        if (column === -1) {
          column = columns.length;
          columns.push(event.endHour);
        } else {
          columns[column] = event.endHour;
        }
        return { event, column };
      });

      const totalColumns = Math.max(columns.length, 1);
      return eventLayouts.map(({ event, column }) => ({
        event,
        top: (event.startHour - 7) * HOUR_ROW_HEIGHT,
        height: (event.endHour - event.startHour) * HOUR_ROW_HEIGHT,
        left: (column / totalColumns) * 100,
        width: 100 / totalColumns,
      }));
    });
  };

  const displayDateString = params.date || todayString;
  let displayDate = parseLocalDateString(displayDateString);
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
      dateString: (() => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      })(),
      displayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
    };
  });

  const hourLabels = visibleHours.map((hour) => `${String(hour).padStart(2, '0')}:00`);

  const isToday = (dateString) => {
    const date = parseLocalDateString(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getColorOption = (id) => colorOptions.find((option) => option.id === id) || colorOptions[0];

  // Stable range builder for fetch callback dependency tracking.
  const getWeekRange = useCallback(() => {
    let baseDate = parseLocalDateString(displayDateString);
    if (Number.isNaN(baseDate.getTime())) {
      baseDate = parseLocalDateString(todayString);
    }

    const weekStart = new Date(baseDate);
    const weekDayIndex = weekStart.getDay();
    const weekOffset = weekStart.getDate() - weekDayIndex + (weekDayIndex === 0 ? -6 : 1);
    weekStart.setDate(weekOffset);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const start = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    const end = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;

    return { start, end };
  }, [displayDateString, todayString]);

  const fetchWeekEvents = useCallback(async () => {
    const { start, end } = getWeekRange();
    const eventsFromApi = await safeFetchJson(
      `${API_BASE}/events?start=${start}&end=${end}`,
      {},
      []
    );
    setEvents(Array.isArray(eventsFromApi) ? eventsFromApi : []);
  }, [getWeekRange]); // useCallback keeps this stable until the viewed week changes

  useEffect(() => {
    fetchWeekEvents();
  }, [displayDateString, fetchWeekEvents]); // Added fetchWeekEvents to dependency array (now stable via useCallback)

  const openCreateModal = () => {
    setModalState({ mode: 'create' });
    setTitle('');
    setSelectedColorId(colorOptions[0].id);
    setModalFormDate(todayString);
    setModalFormStartTime('09:00');
    setModalFormEndTime('10:00');
  };

  const openEditModal = (event) => {
    setModalState({ mode: 'edit', eventId: event.id });
    setTitle(event.title);
    setSelectedColorId(event.colorId);
    setModalFormDate(event.day);
    setModalFormStartTime(formatInputTime(event.startHour));
    setModalFormEndTime(formatInputTime(event.endHour));
  };

  const closeModal = () => {
    setModalState(null);
    setTitle('');
    setSelectedColorId(colorOptions[0].id);
    setModalFormDate(todayString);
    setModalFormStartTime('09:00');
    setModalFormEndTime('10:00');
  };

  const saveEvent = async () => {
    if (!modalState || !title.trim()) return;
    const normalizedTitle = title.trim();
    const startHour = parseInputTime(modalFormStartTime);
    const endHour = parseInputTime(modalFormEndTime);
    if (startHour >= endHour) return;

    try {
      if (modalState.mode === 'edit' && modalState.eventId) {
        await fetch(`${API_BASE}/events/${modalState.eventId}`, {
          method: 'PUT',
          headers: jsonHeaders,
          body: JSON.stringify({
            day: modalFormDate,
            startHour,
            endHour,
            title: normalizedTitle,
            colorId: selectedColorId,
          }),
        });
      } else {
        const created = await safeFetchJson(
          `${API_BASE}/events`,
          {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({
              day: modalFormDate,
              startHour,
              endHour,
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
      await fetch(`${API_BASE}/events/${modalState.eventId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed deleting event', error);
    }
    await fetchWeekEvents();
    closeModal();
  };


  const renderModalTitle = () => {
    if (!modalState) return '';
    const header = modalState.mode === 'edit' ? 'Edit event' : 'New event';
    return `${header}`;
  };

  return (
    <div className="min-h-screen bg-peach py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl bg-[#FFF6E9] p-6 shadow-[0_20px_60px_rgba(61,43,31,0.12)]">
          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#B87AA0] text-white shadow-[0_12px_25px_rgba(184,122,160,0.24)] transition hover:bg-[#a86e94]"
            >
              <span className="text-2xl leading-none">+</span>
            </button>
          </div>
          {/* Responsive wrapper: allow horizontal scrolling on small screens and
              ensure a reasonable minimum width so day columns remain readable. */}
          <div className="overflow-x-auto md:overflow-x-visible">
            <div className="min-w-[726px] md:min-w-0 grid grid-cols-[96px_repeat(7,minmax(0,1fr))] gap-0">
            <div />
            {weekDays.map((day, index) => (
              <button
                key={day.dateString}
                type="button"
                onClick={() => navigate(`/day/${day.dateString}`)}
                className={`flex flex-col items-center gap-3 border-l ${index > 0 ? 'border-[#e8d7cb]' : 'border-transparent'} bg-transparent px-3 py-4 text-center transition hover:bg-white/90`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-mauve">
                  {day.shortName}
                </span>
                <span className={`grid h-12 w-12 place-items-center rounded-full text-lg font-bold ${isToday(day.dateString) ? 'bg-mauve text-white' : 'text-darktext'}`}>
                  {day.date}
                </span>
              </button>
            ))}
            <div className="space-y-0 border-r border-[#e8d7cb]">
              {hourLabels.map((label) => (
                <div key={label} className="flex h-[60px] items-center justify-end border-b border-[#e8d7cb] pr-4 text-sm text-[#7a5f4c]">
                  {label}
                </div>
              ))}
            </div>
            {weekDays.map((day, index) => {
              const dayEvents = events.filter((event) => event.day === day.dateString);
              const eventLayouts = buildDayEventLayouts(dayEvents);
              return (
                <div
                  key={day.dateString}
                  className={`relative min-h-[900px] border-l ${index > 0 ? 'border-[#e8d7cb]' : 'border-transparent'} bg-transparent`}
                >
                  {visibleHours.map((hourValue) => (
                    <div
                      key={`${day.dateString}-${hourValue}`}
                      className="flex h-[60px] w-full items-center border-b border-[#e8d7cb] px-3"
                    />
                  ))}
                  {eventLayouts.map(({ event, top, height, left, width }) => {
                    const color = getColorOption(event.colorId);
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(event);
                        }}
                        className="absolute rounded-2xl p-4 text-left shadow-[0_12px_30px_rgba(101,74,72,0.12)] transition hover:shadow-[0_16px_35px_rgba(101,74,72,0.18)]"
                        style={{
                          top,
                          height,
                          left: `${left}%`,
                          width: `${width}%`,
                          backgroundColor: color.fill,
                          color: '#3b2a27',
                        }}
                      >
                        <div className="mb-1 text-sm font-bold leading-5">{event.title}</div>
                        <div className="text-xs leading-4 text-[#503f3a]">{formatRange(event.startHour, event.endHour)}</div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>
      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={closeModal}>
          <div className="w-full max-w-md rounded-3xl bg-cream p-6 shadow-[0_20px_60px_rgba(61,43,31,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 text-lg font-semibold text-darktext">{renderModalTitle()}</div>
            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-darktext">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mb-4 w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm text-darktext outline-none focus:border-mauve focus:ring-2 focus:ring-mauve/20"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-darktext">Date</label>
                  <input
                    type="date"
                    value={modalFormDate}
                    onChange={(e) => setModalFormDate(e.target.value)}
                    className="w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm text-darktext outline-none focus:border-mauve focus:ring-2 focus:ring-mauve/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-darktext">Start time</label>
                    <input
                      type="time"
                      value={modalFormStartTime}
                      onChange={(e) => setModalFormStartTime(e.target.value)}
                      className="w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm text-darktext outline-none focus:border-mauve focus:ring-2 focus:ring-mauve/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-darktext">End time</label>
                    <input
                      type="time"
                      value={modalFormEndTime}
                      onChange={(e) => setModalFormEndTime(e.target.value)}
                      className="w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm text-darktext outline-none focus:border-mauve focus:ring-2 focus:ring-mauve/20"
                    />
                  </div>
                </div>
              </div>
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
      </div>
      )}
    </div>
  );
}

export default WeekView;
