'use client';

import React from 'react';
import { format, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export default function DateSelector({
  selectedDate,
  onSelectDate,
}: DateSelectorProps) {
  const today = new Date();
  
  // Generate next 7 days
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(today, i);
    return {
      dateString: format(d, 'yyyy-MM-dd'),
      dayNumber: format(d, 'd'),
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(d, 'EEEE'),
    };
  });

  const currentMonthName = format(today, 'MMMM');

  return (
    <div className="px-4 py-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-800">
          2. Select Date
        </label>
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <span>{currentMonthName}</span>
        </span>
      </div>

      {/* Horizontal Date Cards (matching inspiration image) */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        {dates.map((d) => {
          const isSelected = selectedDate === d.dateString;
          return (
            <button
              key={d.dateString}
              type="button"
              onClick={() => onSelectDate(d.dateString)}
              className={`min-w-[72px] py-3 px-2 rounded-2xl border text-center transition-all shrink-0 active:scale-95 ${
                isSelected
                  ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/25 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <p className={`text-base font-extrabold leading-none ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {d.dayNumber}
              </p>
              <p className={`text-[10px] font-medium mt-1 leading-tight ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                {d.dayName}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
