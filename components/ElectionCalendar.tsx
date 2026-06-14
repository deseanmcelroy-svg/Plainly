'use client';

import { useState } from 'react';
import { CalendarEvent } from '@/lib/types';

interface ElectionCalendarProps {
  events: CalendarEvent[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function ElectionCalendar({ events }: ElectionCalendarProps) {
  const parsedEvents = events.map((e) => ({ ...e, dateObj: new Date(e.date) }));

  const initial = parsedEvents.length
    ? new Date(parsedEvents[0].dateObj.getFullYear(), parsedEvents[0].dateObj.getMonth(), 1)
    : new Date();

  const [viewDate, setViewDate] = useState(initial);

  function goPrev() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  }
  function goNext() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  }

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const now = new Date();
  const upcoming = parsedEvents
    .filter((e) => e.dateObj >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  const listEvents = upcoming.length ? upcoming : parsedEvents;

  return (
    <section id="calendar" className="mx-auto max-w-[1000px] px-[6vw] py-12">
      <div className="mb-9 text-center">
        <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight">
          Your election calendar
        </h2>
        <p className="mx-auto max-w-[480px] text-base text-muted">
          Key dates leading up to Election Day — registration deadlines, early voting, and more.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Calendar grid */}
        <div className="rounded-2xl bg-card p-7">
          <div className="mb-[18px] flex items-center justify-between">
            <h3 className="font-display text-xl font-bold">
              {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={goPrev}
                aria-label="Previous month"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border-2 border-line bg-card text-base transition-colors hover:border-navy"
              >
                ‹
              </button>
              <button
                onClick={goNext}
                aria-label="Next month"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border-2 border-line bg-card text-base transition-colors hover:border-navy"
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {DOW_NAMES.map((d, i) => (
              <div key={i} className="py-2 text-xs font-bold uppercase tracking-wide text-muted">
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={i} className="invisible aspect-square" />;
              }
              const thisDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const event = parsedEvents.find((e) => sameDay(e.dateObj, thisDate));
              const isToday = sameDay(thisDate, today);

              const base =
                'relative flex aspect-square items-center justify-center rounded-[10px] text-sm text-navy';
              const eventClasses = event
                ? ' cursor-pointer bg-terracotta/10 font-bold hover:bg-terracotta/20'
                : '';
              const todayClasses = isToday ? ' border-2 border-green font-bold' : '';

              return (
                <div
                  key={i}
                  className={base + eventClasses + todayClasses}
                  tabIndex={event ? 0 : undefined}
                  role={event ? 'button' : undefined}
                  aria-label={
                    event
                      ? `${event.title} on ${MONTH_NAMES[thisDate.getMonth()]} ${day}`
                      : undefined
                  }
                  onClick={
                    event ? () => alert(`${event.title}\n${event.sub}`) : undefined
                  }
                  onKeyDown={
                    event
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            alert(`${event.title}\n${event.sub}`);
                          }
                        }
                      : undefined
                  }
                >
                  {day}
                  {event && (
                    <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-terracotta" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming events list */}
        <div className="rounded-2xl bg-card p-7">
          <h3 className="mb-1.5 font-display text-xl font-bold">Upcoming dates</h3>
          <p className="mb-[14px] text-sm text-muted">
            Tap a highlighted date on the calendar to see what&apos;s happening.
          </p>
          <div className="flex flex-col gap-2.5">
            {listEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl bg-cream p-3.5">
                <div className="min-w-[54px] flex-shrink-0 rounded-[10px] border border-line bg-card px-3 py-2 text-center">
                  <div className="text-xs font-bold uppercase tracking-wide text-terracotta">
                    {MONTH_NAMES[event.dateObj.getMonth()].slice(0, 3)}
                  </div>
                  <div className="font-display text-xl font-bold">{event.dateObj.getDate()}</div>
                </div>
                <div>
                  <div className="text-base font-bold">{event.title}</div>
                  <div className="text-sm text-muted">{event.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
