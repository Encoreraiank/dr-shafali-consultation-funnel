'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Save,
  ArrowLeft,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  Ban
} from 'lucide-react';
import Link from 'next/link';

export default function ScheduleManager() {
  const [workingDays, setWorkingDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);
  const [morningStart, setMorningStart] = useState<string>('10:00');
  const [morningEnd, setMorningEnd] = useState<string>('13:00');
  const [eveningStart, setEveningStart] = useState<string>('17:00');
  const [eveningEnd, setEveningEnd] = useState<string>('20:00');
  const [slotDurationMin, setSlotDurationMin] = useState<number>(5);
  const [bufferTimeMin, setBufferTimeMin] = useState<number>(2);
  const [consultationFee, setConsultationFee] = useState<number>(21);
  const [doctorEmail, setDoctorEmail] = useState<string>('Shafaligarg@gmail.com');
  const [doctorPhone, setDoctorPhone] = useState<string>('+919540329351');

  // Block slots state
  const [blockedSlots, setBlockedSlots] = useState<{ id: string; date: string; timeSlot?: string; reason?: string }[]>([]);
  const [blockDate, setBlockDate] = useState<string>('');
  const [blockTimeSlot, setBlockTimeSlot] = useState<string>('');
  const [blockReason, setBlockReason] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const daysList = [
    { key: 'MON', label: 'Monday' },
    { key: 'TUE', label: 'Tuesday' },
    { key: 'WED', label: 'Wednesday' },
    { key: 'THU', label: 'Thursday' },
    { key: 'FRI', label: 'Friday' },
    { key: 'SAT', label: 'Saturday' },
    { key: 'SUN', label: 'Sunday' },
  ];

  useEffect(() => {
    fetchSettings();
    fetchBlocked();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data) {
        if (data.workingDays) setWorkingDays(data.workingDays);
        if (data.morningStart) setMorningStart(data.morningStart);
        if (data.morningEnd) setMorningEnd(data.morningEnd);
        if (data.eveningStart) setEveningStart(data.eveningStart);
        if (data.eveningEnd) setEveningEnd(data.eveningEnd);
        if (data.slotDurationMin) setSlotDurationMin(data.slotDurationMin);
        if (data.bufferTimeMin) setBufferTimeMin(data.bufferTimeMin);
        if (data.consultationFee) setConsultationFee(data.consultationFee);
        if (data.doctorEmail) setDoctorEmail(data.doctorEmail);
        if (data.doctorPhone) setDoctorPhone(data.doctorPhone);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlocked = async () => {
    try {
      const res = await fetch('/api/admin/block-slot');
      const data = await res.json();
      setBlockedSlots(data.blocked || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workingDays,
          morningStart,
          morningEnd,
          eveningStart,
          eveningEnd,
          slotDurationMin,
          bufferTimeMin,
          consultationFee,
          doctorEmail,
          doctorPhone,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (key: string) => {
    setWorkingDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate) return;

    try {
      const res = await fetch('/api/admin/block-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: blockDate,
          timeSlot: blockTimeSlot || null,
          reason: blockReason || 'Unavailable',
        }),
      });

      if (res.ok) {
        setBlockDate('');
        setBlockTimeSlot('');
        setBlockReason('');
        fetchBlocked();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      await fetch(`/api/admin/block-slot?id=${id}`, { method: 'DELETE' });
      fetchBlocked();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-slate-800 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <h1 className="text-sm font-bold text-slate-900 font-serif">
            Availability & Slot Engine Configuration
          </h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Working Schedule Form */}
        <form onSubmit={handleSaveSettings} className="rounded-3xl bg-white border border-orange-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-orange-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                <span>Doctor Consultation Windows</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure when the ₹21 5-minute consultation slots should appear on the customer landing page.
              </p>
            </div>

            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Saved Successfully!
              </span>
            )}
          </div>

          {/* Working Days */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Available Days of the Week
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {daysList.map((day) => {
                const isActive = workingDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      isActive
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-[#FFFDF9] border-slate-200 text-slate-700 hover:border-orange-200'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Morning & Evening Windows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Morning Shift */}
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-orange-100 space-y-3">
              <p className="text-xs font-bold text-orange-700">🌅 Morning Consultation Window</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    value={morningStart}
                    onChange={(e) => setMorningStart(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    value={morningEnd}
                    onChange={(e) => setMorningEnd(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Evening Shift */}
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-orange-100 space-y-3">
              <p className="text-xs font-bold text-orange-700">🌆 Evening Consultation Window</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    value={eveningStart}
                    onChange={(e) => setEveningStart(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    value={eveningEnd}
                    onChange={(e) => setEveningEnd(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Slot Duration & Buffers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Slot Duration (Minutes)
              </label>
              <input
                type="number"
                min="3"
                max="30"
                value={slotDurationMin}
                onChange={(e) => setSlotDurationMin(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs text-slate-900"
              />
              <p className="text-[10px] text-slate-500 mt-1">Default is 5 minutes for this funnel.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buffer Between Slots (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="15"
                value={bufferTimeMin}
                onChange={(e) => setBufferTimeMin(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs text-slate-900"
              />
              <p className="text-[10px] text-slate-500 mt-1">Gives doctor a break between calls.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Consultation Fee (INR)
              </label>
              <input
                type="number"
                min="1"
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs text-slate-900"
              />
              <p className="text-[10px] text-slate-500 mt-1">Currently ₹21 offer price.</p>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Schedule Rules</span>
            </button>
          </div>
        </form>

        {/* Emergency Block Slot / Holiday Manager */}
        <div className="rounded-3xl bg-white border border-orange-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-orange-100">
            <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-600" />
              <span>Block Dates or Specific Slots (Doctor Leaves / Busy Hours)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Prevent bookings for specific dates or single slots when Dr. Shafali is occupied.
            </p>
          </div>

          {/* Add Block Form */}
          <form onSubmit={handleAddBlock} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#FFFDF9] p-4 rounded-2xl border border-orange-100 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Date to Block *</label>
              <input
                type="date"
                required
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Specific Slot (Leave blank for whole day)
              </label>
              <input
                type="text"
                value={blockTimeSlot}
                onChange={(e) => setBlockTimeSlot(e.target.value)}
                placeholder="E.g. 10:30 AM - 10:35 AM"
                className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Reason (Optional)</label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="E.g. Travel, Personal Leave"
                className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Block Selected</span>
              </button>
            </div>
          </form>

          {/* Active Blocks List */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Currently Blocked Dates & Slots ({blockedSlots.length})
            </h3>

            {blockedSlots.length === 0 ? (
              <p className="text-xs text-slate-500 bg-[#FFFDF9] p-4 rounded-xl border border-orange-100 text-center">
                No active blocks. All standard working slots are open.
              </p>
            ) : (
              <div className="space-y-2">
                {blockedSlots.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#FFFDF9] border border-orange-100 text-xs"
                  >
                    <div>
                      <span className="font-bold text-rose-700">{b.date}</span>
                      <span className="text-slate-700 ml-2">
                        {b.timeSlot ? `[Slot: ${b.timeSlot}]` : '[Whole Day Blocked]'}
                      </span>
                      {b.reason && <span className="text-slate-500 ml-2">({b.reason})</span>}
                    </div>

                    <button
                      onClick={() => handleDeleteBlock(b.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Unblock"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
