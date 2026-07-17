'use client';

import React, { useEffect, useState } from 'react';
import { MedText } from '@/components/ui/med-text';

interface ScheduleEvent {
  id: string | number;
  title: string;
  time: string;
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled';
}

interface RightSidebarProps {
  events?: ScheduleEvent[];
  actionLabel?: string;
  onAction?: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDays(now: Date) {
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));

  return DAYS.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      day,
      date: d.getDate(),
      isToday: d.toDateString() === now.toDateString(),
    };
  });
}

const statusColors: Record<string, { dot: string; bg: string; text: string }> = {
  pending: { dot: 'bg-[#F59E0B]', bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' },
  accepted: { dot: 'bg-[#027A48]', bg: 'bg-[#ECFDF3]', text: 'text-[#027A48]' },
  completed: { dot: 'bg-secondary', bg: 'bg-foreground/5', text: 'text-text-secondary' },
  cancelled: { dot: 'bg-[#D92D20]', bg: 'bg-error-bg', text: 'text-error' },
};

export function RightSidebar({ events = [], actionLabel, onAction }: RightSidebarProps) {
  const [weekDays, setWeekDays] = useState<ReturnType<typeof getWeekDays>>([]);

  useEffect(() => {
    setWeekDays(getWeekDays(new Date()));
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-[16px] p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {weekDays.length > 0 && (
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((wd, i) => (
              <div key={wd.day} className="flex flex-col items-center gap-1 py-2 animate-in fade-in duration-300" style={{ animationDelay: `${i * 40}ms` }}>
                <MedText variant="metadata" className="text-[10px] text-muted">{wd.day}</MedText>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium transition-all duration-200 ${
                  wd.isToday ? 'bg-primary text-white shadow-md shadow-primary/30 scale-110' : 'text-text-secondary hover:bg-foreground/5'
                }`}>
                  {wd.date}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-[16px] p-4 animate-in fade-in slide-in-from-bottom-3 duration-300 delay-100">
        <MedText variant="metadata" className="text-[11px] text-muted tracking-[0.3px] uppercase mb-3">Upcoming</MedText>
        {events.length === 0 ? (
          <MedText variant="metadata" className="text-muted text-center py-4">No upcoming events</MedText>
        ) : (
          <div className="space-y-2">
            {events.map((ev, i) => {
              const colors = ev.status ? statusColors[ev.status] : statusColors.accepted;
              return (
                <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-[10px] bg-background hover:bg-foreground/5 transition-colors animate-in fade-in slide-in-from-right-2 duration-200" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className={`w-1 h-8 rounded-full ${colors.dot}`} />
                  <div className="flex-1 min-w-0">
                    <MedText variant="body" className="text-[13px] font-medium text-text truncate">{ev.title}</MedText>
                    <MedText variant="metadata" className="text-muted">{ev.time}</MedText>
                  </div>
                  {ev.status && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors.bg} ${colors.text} shrink-0`}>
                      {ev.status}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="w-full bg-primary text-white text-[14px] font-medium py-3 rounded-[12px] hover:bg-primary/90 transition-all active:scale-[0.97] animate-in fade-in slide-in-from-bottom-4 duration-300 delay-200"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
