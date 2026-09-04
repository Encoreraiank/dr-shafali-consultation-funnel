'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Loader2, Check } from 'lucide-react';
import { Slot } from '@/types';

interface TimeSlotPickerProps {
  selectedDate: string;
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
}

export default function TimeSlotPicker({
  selectedDate,
  selectedSlot,
  onSelectSlot,
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'morning' | 'evening'>('all');

  useEffect(() => {
    async function fetchSlots() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/slots?date=${selectedDate}`);
        const data = await res.json();
        setSlots(data.slots || []);
      } catch (err) {
        console.error('Error fetching slots:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate]);

  const filteredSlots = slots.filter((s) => {
    if (periodFilter === 'all') return true;
    return s.period === periodFilter;
  });

  return (
    <div className="px-4 py-2">
      {/* Header with period toggle */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <span>3. Select Time (5-Min Slot)</span>
        </label>

        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold text-slate-500">
          <button
            type="button"
            onClick={() => setPeriodFilter('all')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              periodFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : ''
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('morning')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              periodFilter === 'morning' ? 'bg-white text-slate-900 shadow-sm' : ''
            }`}
          >
            Morning
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('evening')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              periodFilter === 'evening' ? 'bg-white text-slate-900 shadow-sm' : ''
            }`}
          >
            Evening
          </button>
        </div>
      </div>

      {/* Slots Grid */}
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
          <span className="text-xs">Checking live doctor availability...</span>
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="py-6 text-center bg-white rounded-2xl border border-slate-100 text-xs text-slate-500">
          No slots open for this selection. Please pick another date.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-0.5">
          {filteredSlots.map((slot) => {
            const isSelected = selectedSlot === slot.displayTime;
            return (
              <button
                key={slot.id}
                type="button"
                disabled={!slot.isAvailable}
                onClick={() => onSelectSlot(slot.displayTime)}
                className={`py-2 px-2 rounded-xl border text-xs font-semibold text-center transition-all flex items-center justify-center gap-1 active:scale-95 ${
                  isSelected
                    ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-sm'
                    : slot.isAvailable
                    ? 'bg-white border-slate-200 text-slate-800 hover:border-orange-300'
                    : 'bg-slate-50 border-slate-100 text-slate-300 line-through cursor-not-allowed'
                }`}
              >
                <Clock className="w-3 h-3 shrink-0" />
                <span>{slot.startTime}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
