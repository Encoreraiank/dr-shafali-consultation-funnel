'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowLeft, ArrowRight, Loader2, AlertCircle, Sparkles, Check } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { BookingFormData, Slot } from '@/types';

interface StepSlotsProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  sessionId: string;
  onNext: () => void;
  onBack: () => void;
}

export default function StepSlots({
  formData,
  setFormData,
  sessionId,
  onNext,
  onBack,
}: StepSlotsProps) {
  // Generate next 7 days
  const today = new Date();
  const availableDates = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(today, i);
    return {
      dateString: format(d, 'yyyy-MM-dd'),
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(d, 'EEE'),
      displayDate: format(d, 'd MMM'),
    };
  });

  const [selectedDate, setSelectedDate] = useState<string>(
    formData.date || availableDates[0].dateString
  );
  const [selectedSlot, setSelectedSlot] = useState<string>(formData.timeSlot || '');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocking, setIsLocking] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isAvailableDay, setIsAvailableDay] = useState<boolean>(true);

  useEffect(() => {
    async function fetchSlots() {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/slots?date=${selectedDate}`);
        const data = await res.json();

        if (data.isAvailableDay === false) {
          setIsAvailableDay(false);
          setErrorMsg(data.message || 'Dr. Shafali Garg is not available on this day.');
          setSlots([]);
        } else {
          setIsAvailableDay(true);
          setSlots(data.slots || []);
        }
      } catch (err) {
        console.error('Error loading slots:', err);
        setErrorMsg('Failed to load slots. Please check connection and try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSlots();
  }, [selectedDate]);

  const handleProceed = async () => {
    if (!selectedSlot) {
      setErrorMsg('Please choose a time slot to continue');
      return;
    }

    setIsLocking(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/slots/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: selectedSlot,
          sessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to lock slot');
        setIsLocking(false);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        date: selectedDate,
        timeSlot: selectedSlot,
      }));

      onNext();
    } catch (err) {
      console.error('Slot lock error:', err);
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLocking(false);
    }
  };

  const morningSlots = slots.filter((s) => s.period === 'morning');
  const eveningSlots = slots.filter((s) => s.period === 'evening');

  return (
    <div className="space-y-5 text-slate-800">
      {/* Header */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          <span>Select Date & 5-Min Time Slot</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Choose a time when you will be in a quiet space with Google Meet installed.
        </p>
      </div>

      {/* Date Selector Tabs */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Select Consultation Date
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {availableDates.map((d) => {
            const isSelected = selectedDate === d.dateString;
            return (
              <button
                key={d.dateString}
                type="button"
                onClick={() => {
                  setSelectedDate(d.dateString);
                  setSelectedSlot('');
                }}
                className={`shrink-0 py-2.5 px-3.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-orange-500 text-white font-bold border-orange-500 shadow-md shadow-orange-500/20'
                    : 'bg-[#FFFDF9] border-slate-200 text-slate-700 hover:border-orange-300 hover:bg-orange-50/50'
                }`}
              >
                <p className="text-[11px] uppercase tracking-wider">{d.dayName}</p>
                <p className="text-sm font-bold mt-0.5">{d.displayDate}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Slot Grid */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-xs">Checking live doctor availability...</span>
        </div>
      ) : !isAvailableDay ? (
        <div className="py-8 text-center bg-orange-50/50 rounded-2xl border border-orange-200 p-6">
          <p className="text-sm text-orange-800 font-bold">No slots available on this date</p>
          <p className="text-xs text-slate-500 mt-1">Please select another date from the tabs above.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
          {/* Morning Slots */}
          {morningSlots.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🌅 Morning Schedule (10:00 AM - 1:00 PM)</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {morningSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.displayTime;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot.displayTime)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold ring-2 ring-orange-400'
                          : slot.isAvailable
                          ? 'bg-white border-slate-200 text-slate-800 hover:border-orange-300 hover:bg-orange-50/40'
                          : 'bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>{slot.startTime}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 font-bold" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evening Slots */}
          {eveningSlots.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🌆 Evening Schedule (5:00 PM - 8:00 PM)</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {eveningSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.displayTime;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot.displayTime)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold ring-2 ring-orange-400'
                          : slot.isAvailable
                          ? 'bg-white border-slate-200 text-slate-800 hover:border-orange-300 hover:bg-orange-50/40'
                          : 'bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>{slot.startTime}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 font-bold" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Slot Preview Pill */}
      {selectedSlot && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Selected: <strong>{format(new Date(selectedDate), 'dd MMMM yyyy')}</strong> at <strong>{selectedSlot}</strong>
          </span>
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
            Available
          </span>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          disabled={!selectedSlot || isLocking}
          onClick={handleProceed}
          className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLocking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Reserving Slot...</span>
            </>
          ) : (
            <>
              <span>Lock Slot & Proceed to Pay ₹21</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
