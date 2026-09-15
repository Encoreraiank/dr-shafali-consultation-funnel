'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar,
  Clock,
  Save,
  CheckCircle2,
  Ban,
  Phone,
  Power,
  Sparkles,
  AlertCircle,
  Video,
  Lock,
  ExternalLink,
  RefreshCw,
  XCircle,
  Sun,
  Moon,
  ArrowLeft,
  Loader2,
  Check,
  RotateCcw,
  Info
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
  status: 'AVAILABLE' | 'BLOCKED' | 'BOOKED' | 'PAST';
  isPast?: boolean;
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

interface SummaryData {
  total: number;
  available: number;
  blocked: number;
  booked: number;
  past: number;
}

export default function SimpleScheduleManager() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  // Live IST Clock
  const [liveClockIST, setLiveClockIST] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        setLiveClockIST(timeStr);
      } catch {
        setLiveClockIST(format(new Date(), 'hh:mm:ss a'));
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Active Tab: 'SLOTS' (Slot ON/OFF) or 'TIMINGS' (Change Hours)
  const [activeTab, setActiveTab] = useState<'SLOTS' | 'TIMINGS'>('SLOTS');

  // Selected Date state
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Slots State
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [summary, setSummary] = useState<SummaryData>({ total: 0, available: 0, blocked: 0, booked: 0, past: 0 });
  const [isFullDayBlocked, setIsFullDayBlocked] = useState<boolean>(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Mutable refs to prevent stale closure race conditions
  const slotsRef = useRef<SlotData[]>([]);
  slotsRef.current = slots;

  const isFullDayBlockedRef = useRef<boolean>(false);
  isFullDayBlockedRef.current = isFullDayBlocked;

  const syncDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal for Viewing Booked Patient
  const [selectedBookingSlot, setSelectedBookingSlot] = useState<SlotData | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Doctor Timing Settings State
  const [workingDays, setWorkingDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
  const [morningStart, setMorningStart] = useState<string>('10:00');
  const [morningEnd, setMorningEnd] = useState<string>('13:00');
  const [eveningStart, setEveningStart] = useState<string>('17:00');
  const [eveningEnd, setEveningEnd] = useState<string>('20:00');
  const [slotDurationMin, setSlotDurationMin] = useState<number>(5);
  const [bufferTimeMin, setBufferTimeMin] = useState<number>(2);
  const [isSavingTiming, setIsSavingTiming] = useState<boolean>(false);
  const [timingSavedSuccess, setTimingSavedSuccess] = useState<boolean>(false);

  const daysList = [
    { key: 'MON', label: 'Mon (सोम)' },
    { key: 'TUE', label: 'Tue (मंगल)' },
    { key: 'WED', label: 'Wed (बुध)' },
    { key: 'THU', label: 'Thu (गुरु)' },
    { key: 'FRI', label: 'Fri (शुक्र)' },
    { key: 'SAT', label: 'Sat (शनि)' },
    { key: 'SUN', label: 'Sun (रवि)' },
  ];

  // Quick Date Generator (Next 7 days)
  const quickDates = Array.from({ length: 7 }).map((_, idx) => {
    const d = addDays(new Date(), idx);
    const dStr = format(d, 'yyyy-MM-dd');
    return {
      dateString: dStr,
      dayLabel: idx === 0 ? 'Today (आज)' : idx === 1 ? 'Tomorrow (कल)' : format(d, 'EEE'),
      formattedDate: format(d, 'dd MMM'),
    };
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Check login on load
  useEffect(() => {
    const token = localStorage.getItem('dsg_admin_auth');
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsLoadingSlots(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');

    const trimmed = passwordInput.trim();
    const valid = ['admin@drshafali2026', 'admin123', 'admin', 'drshafali2026', '9540329351'];

    if (valid.includes(trimmed)) {
      localStorage.setItem('dsg_admin_auth', 'authenticated');
      setIsAuthenticated(true);
      setIsAuthLoading(false);
    } else {
      setAuthError('गलत पासवर्ड! (Password: admin@drshafali2026)');
      setIsAuthLoading(false);
    }
  };

  // Fetch Slots for Selected Date
  const fetchDateSlots = useCallback(async (date: string) => {
    setIsLoadingSlots(true);
    try {
      const res = await fetch(`/api/admin/block-slot?date=${date}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      const data = await res.json();
      if (res.ok) {
        const slotsData: SlotData[] = data.slots || [];
        setSlots(slotsData);
        slotsRef.current = slotsData;
        setIsFullDayBlocked(data.isFullDayBlocked || false);
        isFullDayBlockedRef.current = data.isFullDayBlocked || false;
        
        if (data.summary) {
          setSummary(data.summary);
        } else {
          setSummary({
            total: slotsData.length,
            available: slotsData.filter((s) => s.status === 'AVAILABLE').length,
            blocked: slotsData.filter((s) => s.status === 'BLOCKED').length,
            booked: slotsData.filter((s) => s.status === 'BOOKED').length,
            past: slotsData.filter((s) => s.status === 'PAST').length,
          });
        }

        if (data.settings) {
          if (data.settings.morningStart) setMorningStart(data.settings.morningStart);
          if (data.settings.morningEnd) setMorningEnd(data.settings.morningEnd);
          if (data.settings.eveningStart) setEveningStart(data.settings.eveningStart);
          if (data.settings.eveningEnd) setEveningEnd(data.settings.eveningEnd);
          if (data.settings.slotDurationMin) setSlotDurationMin(data.settings.slotDurationMin);
          if (data.settings.bufferTimeMin !== undefined) setBufferTimeMin(data.settings.bufferTimeMin);
          if (data.settings.workingDays) setWorkingDays(data.settings.workingDays);
        }
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDateSlots(selectedDate);
    }
  }, [selectedDate, isAuthenticated, fetchDateSlots]);

  // Atomic sync of all blocked slots for the active date to cloud server
  const syncBlocksToServer = useCallback((dateToSync: string, updatedSlots: SlotData[], fullDayBlocked: boolean) => {
    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }

    setIsSyncing(true);

    syncDebounceRef.current = setTimeout(async () => {
      try {
        const blockedTimeSlots = updatedSlots
          .filter((s) => s.status === 'BLOCKED')
          .map((s) => s.displayTime);

        const res = await fetch('/api/admin/block-slot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SET_DATE_BLOCKS',
            date: dateToSync,
            blockedTimeSlots,
            isFullDayBlocked: fullDayBlocked,
          }),
        });

        if (res.ok) {
          showToast('✅ Live Website par save ho gaya!');
        }
      } catch (err) {
        console.error('Failed to sync blocks:', err);
        showToast('Sync issue, please refresh', 'error');
      } finally {
        setIsSyncing(false);
      }
    }, 250);
  }, []);

  // 1-Click Slot Toggle (Uses functional setState to NEVER lose clicks)
  const handleToggleSlot = (clickedSlot: SlotData) => {
    if (clickedSlot.status === 'PAST' || clickedSlot.isPast) {
      showToast('Yeh time nikal chuka hai (Past Slot)! Isse change nahi kiya ja sakta.', 'error');
      return;
    }

    if (clickedSlot.status === 'BOOKED') {
      setSelectedBookingSlot(clickedSlot);
      return;
    }

    setSlots((prevSlots) => {
      const updatedSlots: SlotData[] = prevSlots.map((s) => {
        if (s.id === clickedSlot.id || s.displayTime === clickedSlot.displayTime) {
          const toggled: 'AVAILABLE' | 'BLOCKED' = s.status === 'AVAILABLE' ? 'BLOCKED' : 'AVAILABLE';
          return { ...s, status: toggled };
        }
        return s;
      });

      slotsRef.current = updatedSlots;
      
      // Recalculate summary live
      setSummary({
        total: updatedSlots.length,
        available: updatedSlots.filter((s) => s.status === 'AVAILABLE').length,
        blocked: updatedSlots.filter((s) => s.status === 'BLOCKED').length,
        booked: updatedSlots.filter((s) => s.status === 'BOOKED').length,
        past: updatedSlots.filter((s) => s.status === 'PAST').length,
      });

      syncBlocksToServer(selectedDate, updatedSlots, isFullDayBlockedRef.current);
      return updatedSlots;
    });
  };

  // 1-Click Whole Day Toggle (Pura Din ON / OFF)
  const handleToggleWholeDay = () => {
    const nextFullDayBlocked = !isFullDayBlocked;
    setIsFullDayBlocked(nextFullDayBlocked);
    isFullDayBlockedRef.current = nextFullDayBlocked;

    setSlots((prevSlots) => {
      const updatedSlots: SlotData[] = prevSlots.map((s) => {
        if (s.status === 'PAST' || s.isPast || s.status === 'BOOKED') {
          return s; // keep past and booked as is
        }
        return {
          ...s,
          status: nextFullDayBlocked ? 'BLOCKED' : 'AVAILABLE',
        };
      });

      slotsRef.current = updatedSlots;

      setSummary({
        total: updatedSlots.length,
        available: updatedSlots.filter((s) => s.status === 'AVAILABLE').length,
        blocked: updatedSlots.filter((s) => s.status === 'BLOCKED').length,
        booked: updatedSlots.filter((s) => s.status === 'BOOKED').length,
        past: updatedSlots.filter((s) => s.status === 'PAST').length,
      });

      syncBlocksToServer(selectedDate, updatedSlots, nextFullDayBlocked);
      return updatedSlots;
    });
  };

  // Preset standard timing
  const handleApplyPresetTimings = () => {
    setMorningStart('10:00');
    setMorningEnd('13:00');
    setEveningStart('17:00');
    setEveningEnd('20:00');
    setSlotDurationMin(5);
    setBufferTimeMin(2);
    setWorkingDays(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
    showToast('Standard Timings (10am-1pm & 5pm-8pm) set ho gayi hain! Ab neeche "Save" button dabayein.');
  };

  // Save Doctor Shift Timings
  const handleSaveTimings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTiming(true);
    setTimingSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/block-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_SETTINGS',
          settings: {
            morningStart,
            morningEnd,
            eveningStart,
            eveningEnd,
            slotDurationMin: Number(slotDurationMin),
            bufferTimeMin: Number(bufferTimeMin),
            workingDays,
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTimingSavedSuccess(true);
        showToast('✅ Nayi Timing save ho gayi hai aur Live Site par update ho gayi!');
        fetchDateSlots(selectedDate);
        setTimeout(() => setTimingSavedSuccess(false), 4000);
      } else {
        showToast(data.error || 'Timing save nahi ho payi', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving timings', 'error');
    } finally {
      setIsSavingTiming(false);
    }
  };

  // Cancel Booking and Re-Open Slot
  const handleCancelBooking = async () => {
    if (!selectedBookingSlot?.booking?.id) return;
    setIsCancelling(true);

    try {
      const res = await fetch('/api/admin/block-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CANCEL_BOOKING',
          bookingId: selectedBookingSlot.booking.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('✅ Booking cancel ho gayi hai aur slot ab sabhi ke liye open hai!');
        setSelectedBookingSlot(null);
        fetchDateSlots(selectedDate);
      } else {
        showToast(data.error || 'Cancel failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const toggleDay = (key: string) => {
    setWorkingDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const morningSlots = slots.filter((s) => s.period === 'morning');
  const eveningSlots = slots.filter((s) => s.period === 'evening');

  // If not logged in, show simple password screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FCFAF6] text-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white border-2 border-orange-200 p-7 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 mx-auto mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-slate-900">Dr. Shafali Garg — Admin</h2>
            <p className="text-xs text-slate-500 mt-1">Slot & Timing Control Panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Password dalein:
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Password (admin@drshafali2026)"
                className="w-full px-4 py-3 rounded-xl bg-[#FFFDF9] border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-bold">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
            >
              {isAuthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login Karein →'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-orange-600 hover:underline font-bold">
              ← Return to Main Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-slate-900 pb-20">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3">
          <div
            className={`px-5 py-3.5 rounded-2xl shadow-2xl border-2 flex items-center gap-2.5 text-xs font-bold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-600'
                : 'bg-rose-900 text-white border-rose-600'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-orange-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold flex items-center gap-1 border border-orange-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Main Site</span>
            </Link>

            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 font-serif">
                Dr. Shafali Garg — Slot Control
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{isSyncing ? '⚡ Live Site Par Save Ho Raha Hai...' : '✓ Live Site Se Connected'}</span>
                </p>
                {liveClockIST && (
                  <span className="hidden sm:inline text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    🕒 IST: {liveClockIST}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">👁️ Live Site Dekhein</span>
            </a>

            <button
              onClick={() => fetchDateSlots(selectedDate)}
              className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
              title="Refresh Slots"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSlots || isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        
        {/* ========================================================================= */}
        {/* TWO PRIMARY TABS: [ 🗓️ Slot ON/OFF ] vs [ ⏰ Timing Change Karein ]      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-2xl border border-orange-200 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('SLOTS')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'SLOTS'
                ? 'bg-[#FF6B00] text-white shadow-md'
                : 'text-slate-600 hover:bg-orange-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Slot ON / OFF Karein</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TIMINGS')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'TIMINGS'
                ? 'bg-[#FF6B00] text-white shadow-md'
                : 'text-slate-600 hover:bg-orange-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>2. Timing Change Karein</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SLOT ON / OFF MANAGER                                              */}
        {/* ========================================================================= */}
        {activeTab === 'SLOTS' && (
          <div className="space-y-4 animate-in fade-in">
            
            {/* 1. Date Selector Box */}
            <div className="bg-white rounded-3xl border border-orange-200 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-orange-600 uppercase">Tarikh Chunein (Date)</span>
                    {liveClockIST && (
                      <span className="text-[10px] font-bold text-slate-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full sm:hidden">
                        🕒 {liveClockIST}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedDate ? format(parseISO(selectedDate), 'EEEE, dd MMMM yyyy') : ''}
                  </h3>
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Other Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-300 text-xs font-extrabold text-slate-900"
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
                      className={`py-2 px-3.5 rounded-2xl border text-xs font-extrabold shrink-0 transition-all text-center ${
                        isSelected
                          ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-sm'
                          : 'bg-[#FFFDF9] border-slate-200 text-slate-700 hover:border-orange-300'
                      }`}
                    >
                      <p className={`text-[10px] ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                        {qd.dayLabel}
                      </p>
                      <p className="text-sm font-black">{qd.formattedDate}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Whole Day Turn OFF / ON Banner */}
            <div className={`rounded-3xl p-5 border-2 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
              isFullDayBlocked
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full animate-pulse ${
                    isFullDayBlocked ? 'bg-rose-600' : 'bg-emerald-600'
                  }`}></span>
                  <h4 className="text-base font-black">
                    {isFullDayBlocked
                      ? '🔴 Pura Din Band Hai (Doctor Leave / Day Off)'
                      : '🟢 Pura Din Chalu Hai (Slots Open)'}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {isFullDayBlocked
                    ? 'Iss din ke saare slots public website par band (hidden) hain.'
                    : 'Website par sabhi morning aur evening slots dikh rahe hain.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleWholeDay}
                className={`py-3 px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all shrink-0 ${
                  isFullDayBlocked
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>
                  {isFullDayBlocked
                    ? '🟢 Pura Din Wapas Chalu Karein'
                    : '🔴 Pura Din Band Karein (Chhutti)'}
                </span>
              </button>
            </div>

            {/* 3. Slot Stats Summary & Guide */}
            <div className="bg-white p-3.5 rounded-2xl border border-orange-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800">
                  {selectedDate === todayStr ? '📅 Aaj Ka Status:' : '📅 Selected Date Status:'}
                </span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700 text-[11px]">
                  Total: {summary.total}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
                  🟢 {summary.available} Open (ON)
                </span>
                <span className="font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 text-[11px]">
                  🔴 {summary.blocked} Band (OFF)
                </span>
                {summary.booked > 0 && (
                  <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-[11px]">
                    🔵 {summary.booked} Booked
                  </span>
                )}
                {summary.past > 0 && (
                  <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-300 text-[11px]">
                    ⏱️ {summary.past} Passed
                  </span>
                )}
              </div>
            </div>

            {/* 4. Slot Buttons Grid */}
            {isLoadingSlots ? (
              <div className="py-12 bg-white rounded-3xl border border-orange-200 text-center space-y-2">
                <Loader2 className="w-7 h-7 animate-spin text-[#FF6B00] mx-auto" />
                <p className="text-xs font-bold text-slate-500">Slots load ho rahe hain...</p>
              </div>
            ) : isFullDayBlocked ? (
              <div className="p-8 bg-white rounded-3xl border-2 border-rose-200 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <Ban className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-rose-900">
                  Pura Din ({selectedDate}) Band (OFF) hai
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Public site par koi slot nahi dikh raha. Chalu karne ke liye upar diye button par click karein.
                </p>
                <button
                  type="button"
                  onClick={handleToggleWholeDay}
                  className="py-2.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                >
                  🟢 Pura Din Wapas Chalu Karein
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Morning Slots */}
                <div className="bg-white rounded-3xl border border-orange-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-orange-100">
                    <div className="flex items-center gap-2">
                      <Sun className="w-5 h-5 text-amber-500" />
                      <h4 className="text-sm font-extrabold text-slate-900 font-serif">
                        🌅 Morning Slots ({morningStart} se {morningEnd})
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      {morningSlots.length} Slots
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {morningSlots.map((slot) => {
                      const isPast = slot.status === 'PAST' || Boolean(slot.isPast);
                      const isAvail = slot.status === 'AVAILABLE';
                      const isBlk = slot.status === 'BLOCKED';
                      const isBkd = slot.status === 'BOOKED';

                      if (isPast) {
                        return (
                          <div
                            key={slot.id}
                            className="p-3 rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 flex flex-col justify-between min-h-[75px] opacity-75 cursor-not-allowed select-none"
                            title="Yeh samay nikal chuka hai (Past slot)"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold line-through text-slate-400">{slot.startTime}</span>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-300 text-slate-600 uppercase">
                                ⏱️ PASSED
                              </span>
                            </div>
                            <div className="mt-1 text-[10px] font-semibold text-slate-400 truncate">
                              Time nikal gaya
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleToggleSlot(slot)}
                          className={`p-3 rounded-2xl border text-left transition-all active:scale-95 shadow-xs flex flex-col justify-between min-h-[75px] ${
                            isAvail
                              ? 'bg-emerald-50 hover:bg-emerald-100/90 border-emerald-300 text-emerald-950'
                              : isBlk
                              ? 'bg-rose-50 hover:bg-rose-100/90 border-rose-300 text-rose-950'
                              : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-950'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-black">{slot.startTime}</span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                                isAvail
                                  ? 'bg-emerald-600 text-white'
                                  : isBlk
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {isAvail ? '🟢 ON' : isBlk ? '🔴 OFF' : '🔵 BOOKED'}
                            </span>
                          </div>

                          <div className="mt-1 text-[10px] font-bold truncate">
                            {isAvail ? (
                              <span className="text-emerald-700">Open (Click to Band)</span>
                            ) : isBlk ? (
                              <span className="text-rose-700">Band (Click to Chalu)</span>
                            ) : (
                              <span className="text-blue-900">👤 {slot.booking?.patientName}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Evening Slots */}
                <div className="bg-white rounded-3xl border border-orange-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-orange-100">
                    <div className="flex items-center gap-2">
                      <Moon className="w-5 h-5 text-indigo-500" />
                      <h4 className="text-sm font-extrabold text-slate-900 font-serif">
                        🌆 Evening Slots ({eveningStart} se {eveningEnd})
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      {eveningSlots.length} Slots
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {eveningSlots.map((slot) => {
                      const isPast = slot.status === 'PAST' || Boolean(slot.isPast);
                      const isAvail = slot.status === 'AVAILABLE';
                      const isBlk = slot.status === 'BLOCKED';
                      const isBkd = slot.status === 'BOOKED';

                      if (isPast) {
                        return (
                          <div
                            key={slot.id}
                            className="p-3 rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 flex flex-col justify-between min-h-[75px] opacity-75 cursor-not-allowed select-none"
                            title="Yeh samay nikal chuka hai (Past slot)"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold line-through text-slate-400">{slot.startTime}</span>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-300 text-slate-600 uppercase">
                                ⏱️ PASSED
                              </span>
                            </div>
                            <div className="mt-1 text-[10px] font-semibold text-slate-400 truncate">
                              Time nikal gaya
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleToggleSlot(slot)}
                          className={`p-3 rounded-2xl border text-left transition-all active:scale-95 shadow-xs flex flex-col justify-between min-h-[75px] ${
                            isAvail
                              ? 'bg-emerald-50 hover:bg-emerald-100/90 border-emerald-300 text-emerald-950'
                              : isBlk
                              ? 'bg-rose-50 hover:bg-rose-100/90 border-rose-300 text-rose-950'
                              : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-950'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-black">{slot.startTime}</span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                                isAvail
                                  ? 'bg-emerald-600 text-white'
                                  : isBlk
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {isAvail ? '🟢 ON' : isBlk ? '🔴 OFF' : '🔵 BOOKED'}
                            </span>
                          </div>

                          <div className="mt-1 text-[10px] font-bold truncate">
                            {isAvail ? (
                              <span className="text-emerald-700">Open (Click to Band)</span>
                            ) : isBlk ? (
                              <span className="text-rose-700">Band (Click to Chalu)</span>
                            ) : (
                              <span className="text-blue-900">👤 {slot.booking?.patientName}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DOCTOR TIMING SETTINGS (Change Working Hours)                       */}
        {/* ========================================================================= */}
        {activeTab === 'TIMINGS' && (
          <form
            onSubmit={handleSaveTimings}
            className="bg-white rounded-3xl border-2 border-orange-200 p-5 sm:p-7 shadow-md space-y-6 animate-in fade-in"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-orange-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-serif flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#FF6B00]" />
                  <span>Doctor Consultation Timing Change Karein</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Yahan se aap Morning aur Evening ka time badal sakti hain.
                </p>
              </div>

              {/* Quick Reset to Standard Timing Button */}
              <button
                type="button"
                onClick={handleApplyPresetTimings}
                className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Standard 10am-1pm & 5pm-8pm Lagayein</span>
              </button>
            </div>

            {/* 1. Working Days */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-2">
                Hafte me kaun-kaun se din consultation hogi? (Working Days):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {daysList.map((day) => {
                  const isActive = workingDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleDay(day.key)}
                      className={`p-2.5 rounded-xl border text-xs font-extrabold transition-all text-center ${
                        isActive
                          ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-xs'
                          : 'bg-[#FFFDF9] border-slate-200 text-slate-700 hover:border-orange-300'
                      }`}
                    >
                      {day.label} {isActive ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Morning Shift */}
            <div className="p-4 rounded-2xl bg-[#FFF9F5] border border-orange-200 space-y-2">
              <p className="text-xs font-extrabold text-orange-900 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>🌅 Morning Consultation Ka Time:</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Morning Shuru Ka Time (Jaise 10:00 AM):
                  </label>
                  <input
                    type="time"
                    required
                    value={morningStart}
                    onChange={(e) => setMorningStart(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Morning Khatam Hone Ka Time (Jaise 13:00 / 01:00 PM):
                  </label>
                  <input
                    type="time"
                    required
                    value={morningEnd}
                    onChange={(e) => setMorningEnd(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-black text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 3. Evening Shift */}
            <div className="p-4 rounded-2xl bg-[#FFF9F5] border border-orange-200 space-y-2">
              <p className="text-xs font-extrabold text-orange-900 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>🌆 Evening Consultation Ka Time:</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Evening Shuru Ka Time (Jaise 17:00 / 05:00 PM):
                  </label>
                  <input
                    type="time"
                    required
                    value={eveningStart}
                    onChange={(e) => setEveningStart(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Evening Khatam Hone Ka Time (Jaise 20:00 / 08:00 PM):
                  </label>
                  <input
                    type="time"
                    required
                    value={eveningEnd}
                    onChange={(e) => setEveningEnd(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-black text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 4. Duration & Buffer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Ek Call Kitne Minute Ki Hogi? (Duration):
                </label>
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={slotDurationMin}
                  onChange={(e) => setSlotDurationMin(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs font-black text-slate-900"
                />
                <p className="text-[10px] text-slate-500 mt-1">Default 5 Minutes hai.</p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Calls Ke Beech Me Break / Buffer (Minutes):
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={bufferTimeMin}
                  onChange={(e) => setBufferTimeMin(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs font-black text-slate-900"
                />
                <p className="text-[10px] text-slate-500 mt-1">Default 2 Minutes break hai.</p>
              </div>
            </div>

            {/* Big Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingTiming}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#FFA000] hover:from-[#E05E00] hover:to-[#FF8800] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
              >
                {isSavingTiming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving to Live Website...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Timing & Update Live Site (टाइम सेव करें) →</span>
                  </>
                )}
              </button>
            </div>

            {timingSavedSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Nayi Timing save ho gayi hai aur Live Site par update ho gayi hai!</span>
              </div>
            )}
          </form>
        )}

      </div>

      {/* ========================================================================= */}
      {/* BOOKED PATIENT DETAILS & CANCEL MODAL                                    */}
      {/* ========================================================================= */}
      {selectedBookingSlot && selectedBookingSlot.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white border-2 border-blue-200 p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Booked Patient
                </span>
                <h3 className="text-base font-extrabold text-slate-900 font-serif mt-1">
                  {selectedBookingSlot.booking.patientName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingSlot(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#FFFDF9] p-3 rounded-2xl border border-orange-100">
                <div>
                  <p className="text-[10px] text-slate-400">Date & Time:</p>
                  <p className="font-extrabold text-slate-900">{selectedBookingSlot.date}</p>
                  <p className="text-emerald-700 font-bold">{selectedBookingSlot.displayTime}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">WhatsApp / Phone:</p>
                  <p className="font-extrabold text-slate-900 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {selectedBookingSlot.booking.patientPhone}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Booking ID:</p>
                  <p className="font-mono font-bold text-orange-600">{selectedBookingSlot.booking.bookingNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Topic:</p>
                  <p className="font-bold text-slate-800">{selectedBookingSlot.booking.problemCategory}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-700 mb-1">Patient ka Prashna / Issue:</p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 max-h-28 overflow-y-auto">
                  {selectedBookingSlot.booking.problemDetail}
                </div>
              </div>

              {selectedBookingSlot.booking.meetUrl && (
                <a
                  href={selectedBookingSlot.booking.meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Video className="w-4 h-4" />
                  <span>Google Meet Join Karein</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingSlot(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleCancelBooking}
                  disabled={isCancelling}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                >
                  {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
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
