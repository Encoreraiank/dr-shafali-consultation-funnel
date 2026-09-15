'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Ban,
  Clock,
  User,
  Phone,
  Power,
  Sparkles,
  AlertCircle,
  Video,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  XCircle,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { format, addDays, parseISO } from 'date-fns';

interface SlotData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  displayTime: string;
  period: 'morning' | 'evening';
  status: 'AVAILABLE' | 'BLOCKED' | 'BOOKED';
  blockId?: string;
  reason?: string;
  booking?: {
    id: string;
    bookingNumber: string;
    patientName: string;
    patientPhone: string;
    patientEmail?: string | null;
    problemCategory: string;
    problemDetail: string;
    status: string;
    amount: number;
    meetUrl?: string | null;
  };
}

export default function ScheduleManager() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  // Selected Date state
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Slots and Day Data
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [isFullDayBlocked, setIsFullDayBlocked] = useState<boolean>(false);
  const [summary, setSummary] = useState({ total: 0, available: 0, blocked: 0, booked: 0 });
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(true);
  const [actionSlotId, setActionSlotId] = useState<string | null>(null);

  // Feedback banner / Toast
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal for Viewing / Managing a Booked Slot
  const [activeBookedSlot, setActiveBookedSlot] = useState<SlotData | null>(null);
  const [isCancellingBooking, setIsCancellingBooking] = useState<boolean>(false);

  // General Settings State
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [workingDays, setWorkingDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
  const [morningStart, setMorningStart] = useState<string>('10:00');
  const [morningEnd, setMorningEnd] = useState<string>('13:00');
  const [eveningStart, setEveningStart] = useState<string>('17:00');
  const [eveningEnd, setEveningEnd] = useState<string>('20:00');
  const [slotDurationMin, setSlotDurationMin] = useState<number>(5);
  const [bufferTimeMin, setBufferTimeMin] = useState<number>(2);
  const [consultationFee, setConsultationFee] = useState<number>(21);
  const [doctorPhone, setDoctorPhone] = useState<string>('+919540329351');

  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState<boolean>(false);

  const daysList = [
    { key: 'MON', label: 'Mon' },
    { key: 'TUE', label: 'Tue' },
    { key: 'WED', label: 'Wed' },
    { key: 'THU', label: 'Thu' },
    { key: 'FRI', label: 'Fri' },
    { key: 'SAT', label: 'Sat' },
    { key: 'SUN', label: 'Sun' },
  ];

  // Quick Date Pill Generator (Next 7 days)
  const quickDates = Array.from({ length: 7 }).map((_, idx) => {
    const d = addDays(new Date(), idx);
    const dStr = format(d, 'yyyy-MM-dd');
    return {
      dateString: dStr,
      dayLabel: idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : format(d, 'EEE'),
      formattedDate: format(d, 'dd MMM'),
    };
  });

  // Check login
  useEffect(() => {
    const token = localStorage.getItem('dsg_admin_auth');
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsLoadingSlots(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed');
        setIsAuthLoading(false);
        return;
      }

      localStorage.setItem('dsg_admin_auth', data.token);
      setIsAuthenticated(true);
    } catch {
      setAuthError('Network error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 3500);
  };

  // Fetch Slots for Selected Date
  const fetchDateSlots = useCallback(async (date: string) => {
    setIsLoadingSlots(true);
    try {
      const res = await fetch(`/api/admin/block-slot?date=${date}`);
      const data = await res.json();
      if (res.ok) {
        setSlots(data.slots || []);
        setIsFullDayBlocked(data.isFullDayBlocked || false);
        setSummary(
          data.summary || {
            total: (data.slots || []).length,
            available: (data.slots || []).filter((s: SlotData) => s.status === 'AVAILABLE').length,
            blocked: (data.slots || []).filter((s: SlotData) => s.status === 'BLOCKED').length,
            booked: (data.slots || []).filter((s: SlotData) => s.status === 'BOOKED').length,
          }
        );
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  // Fetch General Settings
  const fetchSettings = useCallback(async () => {
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
        if (data.doctorPhone) setDoctorPhone(data.doctorPhone);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDateSlots(selectedDate);
      fetchSettings();
    }
  }, [selectedDate, isAuthenticated, fetchDateSlots, fetchSettings]);

  // Toggle single slot ON/OFF
  const handleToggleSlot = async (slot: SlotData) => {
    if (slot.status === 'BOOKED') {
      setActiveBookedSlot(slot);
      return;
    }

    setActionSlotId(slot.id);
    try {
      const res = await fetch('/api/admin/block-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_SLOT',
          date: selectedDate,
          timeSlot: slot.displayTime,
          reason: slot.status === 'AVAILABLE' ? 'Turned OFF by doctor' : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Slot updated successfully');
        fetchDateSlots(selectedDate);
      } else {
        showToast(data.error || 'Failed to update slot', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while updating slot', 'error');
    } finally {
      setActionSlotId(null);
    }
  };

  // Toggle Entire Day ON/OFF
  const handleToggleWholeDay = async () => {
    setIsLoadingSlots(true);
    try {
      const res = await fetch('/api/admin/block-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_DAY',
          date: selectedDate,
          reason: !isFullDayBlocked ? 'Entire day turned OFF by doctor' : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Day status updated');
        fetchDateSlots(selectedDate);
      } else {
        showToast(data.error || 'Failed to toggle day', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while toggling day', 'error');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Cancel Booking and Free Slot
  const handleCancelBooking = async () => {
    if (!activeBookedSlot?.booking?.id) return;
    setIsCancellingBooking(true);

    try {
      const res = await fetch('/api/admin/block-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CANCEL_BOOKING',
          bookingId: activeBookedSlot.booking.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Booking cancelled and slot is now open');
        setActiveBookedSlot(null);
        fetchDateSlots(selectedDate);
      } else {
        showToast(data.error || 'Failed to cancel booking', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error cancelling booking', 'error');
    } finally {
      setIsCancellingBooking(false);
    }
  };

  // Save timing configuration
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSaveSettingsSuccess(false);

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
          doctorPhone,
        }),
      });

      if (res.ok) {
        setSaveSettingsSuccess(true);
        showToast('Schedule rules saved successfully!');
        fetchDateSlots(selectedDate);
        setTimeout(() => setSaveSettingsSuccess(false), 3000);
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const toggleWorkingDay = (key: string) => {
    setWorkingDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  // Group slots into morning and evening
  const morningSlots = slots.filter((s) => s.period === 'morning');
  const eveningSlots = slots.filter((s) => s.period === 'evening');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FCFAF6] text-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white border border-orange-200 p-7 sm:p-8 shadow-warm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 mx-auto mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-slate-900">Admin Authentication</h2>
            <p className="text-xs text-slate-500 mt-1">Please enter your password to manage consultation slots.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-3 rounded-xl bg-[#FFFDF9] border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-medium">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isAuthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unlock Slot Manager'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-orange-600 hover:underline font-semibold">
              ← Back to Main Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-slate-800 pb-24">
      
      {/* Toast Notification Banner */}
      {feedbackMsg && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 transition-colors flex items-center gap-1.5 text-xs font-bold border border-orange-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                <span>Doctor Time Slot Manager</span>
                <span className="text-[10px] font-sans font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                  1-Click ON/OFF
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                Tap any slot below to instantly turn it ON (Open) or OFF (Blocked).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDateSlots(selectedDate)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Refresh Slots"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSlots ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className="py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{showSettingsDrawer ? 'Hide Rules' : 'Timing Settings'}</span>
              {showSettingsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* ========================================================================= */}
        {/* COLLAPSIBLE TIMING RULES & SETTINGS PANEL                                  */}
        {/* ========================================================================= */}
        {showSettingsDrawer && (
          <form
            onSubmit={handleSaveSettings}
            className="rounded-3xl bg-white border-2 border-orange-200 p-5 sm:p-7 shadow-md space-y-5 animate-in fade-in"
          >
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>Consultation Window & Working Days Rules</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set standard working hours. Slots are auto-generated based on these times.
                </p>
              </div>

              {saveSettingsSuccess && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Saved!
                </span>
              )}
            </div>

            {/* Working Days Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Active Working Days
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {daysList.map((day) => {
                  const isActive = workingDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleWorkingDay(day.key)}
                      className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all text-center ${
                        isActive
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                          : 'bg-[#FFFDF9] border-slate-200 text-slate-700 hover:border-orange-200'
                      }`}
                    >
                      {day.label} {isActive ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shift Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-orange-100 space-y-2">
                <p className="text-xs font-bold text-orange-800">🌅 Morning Shift Times</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Start Time (24h)</label>
                    <input
                      type="time"
                      value={morningStart}
                      onChange={(e) => setMorningStart(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">End Time (24h)</label>
                    <input
                      type="time"
                      value={morningEnd}
                      onChange={(e) => setMorningEnd(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-orange-100 space-y-2">
                <p className="text-xs font-bold text-orange-800">🌆 Evening Shift Times</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Start Time (24h)</label>
                    <input
                      type="time"
                      value={eveningStart}
                      onChange={(e) => setEveningStart(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">End Time (24h)</label>
                    <input
                      type="time"
                      value={eveningEnd}
                      onChange={(e) => setEveningEnd(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Duration, Buffer, Fee */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Slot Duration (Min)</label>
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={slotDurationMin}
                  onChange={(e) => setSlotDurationMin(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Buffer Break (Min)</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={bufferTimeMin}
                  onChange={(e) => setBufferTimeMin(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Fee (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all"
              >
                {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save New Timing Rules</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* ACTIVE DATE SELECTOR TOOLBAR                                              */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-white border border-orange-200 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Step 1: Choose Date</p>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <span>Slots For:</span>
                <span className="text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-xl border border-orange-200">
                  {selectedDate ? format(parseISO(selectedDate), 'EEEE, dd MMMM yyyy') : ''}
                </span>
              </h2>
            </div>

            {/* Custom Date Input */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Pick Any Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Quick Date Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {quickDates.map((qd) => {
              const isSelected = selectedDate === qd.dateString;
              return (
                <button
                  key={qd.dateString}
                  type="button"
                  onClick={() => setSelectedDate(qd.dateString)}
                  className={`py-2 px-3.5 rounded-xl border text-xs font-bold shrink-0 transition-all text-center flex flex-col items-center ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm scale-102'
                      : 'bg-[#FFFDF9] border-slate-200 text-slate-700 hover:border-orange-300'
                  }`}
                >
                  <span className={`text-[10px] uppercase ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                    {qd.dayLabel}
                  </span>
                  <span className="font-extrabold">{qd.formattedDate}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1-CLICK WHOLE DAY MASTER CONTROL CARD & SUMMARY COUNTER                     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Master Day Toggle Card */}
          <div className={`md:col-span-2 rounded-3xl p-5 border-2 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isFullDayBlocked
              ? 'bg-rose-50/90 border-rose-300 text-rose-950'
              : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full animate-pulse ${
                  isFullDayBlocked ? 'bg-rose-500' : 'bg-emerald-500'
                }`}></span>
                <h3 className="text-sm sm:text-base font-black">
                  {isFullDayBlocked ? 'Day Status: 🔴 BLOCKED / DAY OFF' : 'Day Status: 🟢 OPEN FOR BOOKING'}
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                {isFullDayBlocked
                  ? 'All morning and evening slots for this date are completely turned OFF for public.'
                  : 'Public landing page shows slots as available. You can toggle individual slots below.'}
              </p>
            </div>

            <button
              onClick={handleToggleWholeDay}
              disabled={isLoadingSlots}
              className={`py-3 px-5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0 ${
                isFullDayBlocked
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isFullDayBlocked ? 'Turn ON Entire Day' : 'Turn OFF Entire Day (Leave / Busy)'}</span>
            </button>
          </div>

          {/* Slots Stats Pill */}
          <div className="rounded-3xl bg-white border border-orange-200 p-4 shadow-sm flex flex-col justify-center space-y-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date Summary</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-lg font-black text-emerald-700 leading-none">{summary.available}</p>
                <p className="text-[9px] font-bold text-emerald-800 mt-1">🟢 Open</p>
              </div>
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                <p className="text-lg font-black text-rose-700 leading-none">{summary.blocked}</p>
                <p className="text-[9px] font-bold text-rose-800 mt-1">🔴 Blocked</p>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-lg font-black text-blue-700 leading-none">{summary.booked}</p>
                <p className="text-[9px] font-bold text-blue-800 mt-1">🔵 Booked</p>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE VISUAL SLOT GRID (MORNING & EVENING)                           */}
        {/* ========================================================================= */}
        {isLoadingSlots ? (
          <div className="py-16 text-center rounded-3xl bg-white border border-orange-100 shadow-sm space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Loading time slots for {selectedDate}...</p>
          </div>
        ) : isFullDayBlocked ? (
          <div className="p-8 text-center rounded-3xl bg-white border-2 border-rose-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-rose-900">
              Entire Day ({selectedDate}) is Turned OFF
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No slots are shown on the website for this day. Click &ldquo;Turn ON Entire Day&rdquo; above if you want to open slots.
            </p>
            <button
              onClick={handleToggleWholeDay}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
            >
              ✓ Re-Open & Turn ON All Slots For This Day
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Legend Guide Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-orange-100 text-xs shadow-xs">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                Slot Status Guide (Click to Toggle):
              </span>

              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  🟢 ON / Available (Click to Turn OFF)
                </span>
                <span className="flex items-center gap-1.5 font-bold text-rose-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  🔴 OFF / Blocked (Click to Turn ON)
                </span>
                <span className="flex items-center gap-1.5 font-bold text-blue-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  🔵 Booked by Patient (Click to View/Cancel)
                </span>
              </div>
            </div>

            {/* MORNING SLOTS SECTION */}
            <div className="rounded-3xl bg-white border border-orange-200 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-orange-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌅</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-serif">
                    Morning Consultation Window ({morningStart} - {morningEnd})
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {morningSlots.length} Total Slots
                </span>
              </div>

              {morningSlots.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No morning slots generated.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {morningSlots.map((slot) => {
                    const isUpdating = actionSlotId === slot.id;
                    const isAvail = slot.status === 'AVAILABLE';
                    const isBlk = slot.status === 'BLOCKED';
                    const isBkd = slot.status === 'BOOKED';

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handleToggleSlot(slot)}
                        disabled={isUpdating}
                        className={`p-3 rounded-2xl border text-left transition-all relative active:scale-95 shadow-xs flex flex-col justify-between min-h-[82px] ${
                          isAvail
                            ? 'bg-emerald-50/80 hover:bg-emerald-100/90 border-emerald-300 text-emerald-950'
                            : isBlk
                            ? 'bg-rose-50/80 hover:bg-rose-100/90 border-rose-300 text-rose-950'
                            : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-950'
                        }`}
                      >
                        {/* Top Row: Time & Status Badge */}
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-extrabold">{slot.startTime}</span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                              isAvail
                                ? 'bg-emerald-600 text-white'
                                : isBlk
                                ? 'bg-rose-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {isAvail ? 'ON' : isBlk ? 'OFF' : 'BOOKED'}
                          </span>
                        </div>

                        {/* Bottom Row: Detail / Click Action Label */}
                        <div className="mt-1 w-full truncate">
                          {isUpdating ? (
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Updating...
                            </span>
                          ) : isAvail ? (
                            <span className="text-[10px] font-semibold text-emerald-800">
                              🟢 Open (Tap to OFF)
                            </span>
                          ) : isBlk ? (
                            <span className="text-[10px] font-semibold text-rose-800">
                              🔴 Blocked (Tap to ON)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-blue-900 truncate block">
                              👤 {slot.booking?.patientName || 'Patient'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* EVENING SLOTS SECTION */}
            <div className="rounded-3xl bg-white border border-orange-200 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-orange-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌆</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-serif">
                    Evening Consultation Window ({eveningStart} - {eveningEnd})
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {eveningSlots.length} Total Slots
                </span>
              </div>

              {eveningSlots.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No evening slots generated.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {eveningSlots.map((slot) => {
                    const isUpdating = actionSlotId === slot.id;
                    const isAvail = slot.status === 'AVAILABLE';
                    const isBlk = slot.status === 'BLOCKED';
                    const isBkd = slot.status === 'BOOKED';

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handleToggleSlot(slot)}
                        disabled={isUpdating}
                        className={`p-3 rounded-2xl border text-left transition-all relative active:scale-95 shadow-xs flex flex-col justify-between min-h-[82px] ${
                          isAvail
                            ? 'bg-emerald-50/80 hover:bg-emerald-100/90 border-emerald-300 text-emerald-950'
                            : isBlk
                            ? 'bg-rose-50/80 hover:bg-rose-100/90 border-rose-300 text-rose-950'
                            : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-950'
                        }`}
                      >
                        {/* Top Row: Time & Status Badge */}
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-extrabold">{slot.startTime}</span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                              isAvail
                                ? 'bg-emerald-600 text-white'
                                : isBlk
                                ? 'bg-rose-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {isAvail ? 'ON' : isBlk ? 'OFF' : 'BOOKED'}
                          </span>
                        </div>

                        {/* Bottom Row: Detail / Click Action Label */}
                        <div className="mt-1 w-full truncate">
                          {isUpdating ? (
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Updating...
                            </span>
                          ) : isAvail ? (
                            <span className="text-[10px] font-semibold text-emerald-800">
                              🟢 Open (Tap to OFF)
                            </span>
                          ) : isBlk ? (
                            <span className="text-[10px] font-semibold text-rose-800">
                              🔴 Blocked (Tap to ON)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-blue-900 truncate block">
                              👤 {slot.booking?.patientName || 'Patient'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* BOOKED PATIENT SLOT DETAILS & CANCEL MODAL                                */}
      {/* ========================================================================= */}
      {activeBookedSlot && activeBookedSlot.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white border-2 border-blue-200 p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Booked Slot Details
                </span>
                <h3 className="text-base font-bold text-slate-900 font-serif mt-1">
                  {activeBookedSlot.booking.patientName}
                </h3>
              </div>
              <button
                onClick={() => setActiveBookedSlot(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#FFFDF9] p-3 rounded-2xl border border-orange-100">
                <div>
                  <p className="text-[10px] text-slate-400">Date & Slot:</p>
                  <p className="font-bold text-slate-900">{activeBookedSlot.date}</p>
                  <p className="text-emerald-700 font-semibold">{activeBookedSlot.displayTime}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">WhatsApp / Phone:</p>
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {activeBookedSlot.booking.patientPhone}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Booking ID:</p>
                  <p className="font-mono font-bold text-orange-600">{activeBookedSlot.booking.bookingNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Fee Paid:</p>
                  <p className="font-bold text-emerald-700">₹{activeBookedSlot.booking.amount || 21}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-700 mb-1">Consultation Topic:</p>
                <span className="px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 font-semibold text-xs">
                  {activeBookedSlot.booking.problemCategory}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-700 mb-1">Patient&apos;s Question / Problem:</p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 max-h-32 overflow-y-auto">
                  {activeBookedSlot.booking.problemDetail}
                </div>
              </div>

              {activeBookedSlot.booking.meetUrl && (
                <a
                  href={activeBookedSlot.booking.meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Video className="w-4 h-4" />
                  <span>Open Google Meet Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {/* Cancel Booking & Free Slot Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveBookedSlot(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleCancelBooking}
                  disabled={isCancellingBooking}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isCancellingBooking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Cancel Booking & Open Slot</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
