'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  Video,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  User,
  Phone,
  MessageSquare,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  Award,
  Heart,
  Briefcase,
  Compass,
  Sparkles,
  Copy,
  ExternalLink,
  MessageCircle,
  X
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import confetti from 'canvas-confetti';
import { BookingRecord, Slot } from '@/types';
import DetailsModal from '@/components/app/DetailsModal';
import DoctorHeroSection from '@/components/section/DoctorHeroSection';

export default function AppHome() {
  // Booking Form State
  const [selectedTopic, setSelectedTopic] = useState<string>('Career & Wealth');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<string>('10:21 AM - 10:26 AM');
  const [showAllSlots, setShowAllSlots] = useState<boolean>(false);
  const dateScrollRef = useRef<HTMLDivElement>(null);
  
  // Patient details state
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [problemDetail, setProblemDetail] = useState<string>('');

  // Mobile Bottom Sheet state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<'DETAILS' | 'UPI_PAY'>('DETAILS');
  const [orderInfo, setOrderInfo] = useState<{
    bookingNumber: string;
    orderId: string;
    amount: number;
    upiId: string;
    upiLink: string;
    qrUrl: string;
  } | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [utrNumber, setUtrNumber] = useState<string>('');

  // Slots
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Process & Confirmation
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);
  const [confirmedMeetUrl, setConfirmedMeetUrl] = useState<string>('');
  const [isPassOpen, setIsPassOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Generate 120 days for extended multi-month availability (Sept, Oct, Nov, Dec, Jan, Feb, etc.)
  const today = new Date();
  const availableDates = Array.from({ length: 120 }).map((_, i) => {
    const d = addDays(today, i);
    return {
      dateString: format(d, 'yyyy-MM-dd'),
      dayNumber: format(d, 'd'),
      monthName: format(d, 'MMM'),
      monthKey: format(d, 'yyyy-MM'),
      fullMonth: format(d, 'MMMM yyyy'),
      dayLabel: i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' : format(d, 'EEE').toUpperCase(),
    };
  });

  // Extract unique months for the Month Selector dropdown
  const uniqueMonths = Array.from(
    new Map(
      availableDates.map((d) => [d.monthKey, { key: d.monthKey, label: d.fullMonth, firstDate: d.dateString }])
    ).values()
  );

  const scrollDates = (direction: 'left' | 'right') => {
    if (dateScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      dateScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMonthChange = (monthKey: string) => {
    const targetMonth = uniqueMonths.find((m) => m.key === monthKey);
    if (targetMonth) {
      setSelectedDate(targetMonth.firstDate);
      const targetElement = document.getElementById(`date-pill-${targetMonth.firstDate}`);
      if (targetElement && dateScrollRef.current) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  const topics = [
    {
      id: 'Career & Wealth',
      title: 'Career & Wealth',
      sub: 'Career • Business\nMoney',
      iconSrc: '/images/icons/career.png',
    },
    {
      id: 'Love & Relationships',
      title: 'Love & Relationships',
      sub: 'Marriage • Love\nCompatibility',
      iconSrc: '/images/icons/love.png',
    },
    {
      id: 'Life Path & Future',
      title: 'Life Path & Future',
      sub: 'Direction • Decisions\nTiming',
      iconSrc: '/images/icons/future.png',
    },
    {
      id: 'Inner Peace',
      title: 'Inner Peace',
      sub: 'Stress • Clarity\nEmotional Balance',
      iconSrc: '/images/icons/peace.png',
    },
  ];

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    async function fetchSlots() {
      setIsLoadingSlots(true);
      try {
        const res = await fetch(`/api/slots?date=${selectedDate}`);
        const data = await res.json();
        setSlots(data.slots || []);
        if (data.slots && data.slots.length > 0) {
          const firstAvail = data.slots.find((s: Slot) => s.isAvailable);
          if (firstAvail) setSelectedSlot(firstAvail.displayTime);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    if (selectedDate) fetchSlots();
  }, [selectedDate]);

  const displayedSlots = showAllSlots ? slots : slots.slice(0, 8);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    const cleanPhone = patientPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit WhatsApp number');
      return;
    }
    if (!selectedSlot) {
      setErrorMsg('Please select a time slot');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const sessionId = `sess_${Date.now()}`;

      // 1. Create order & get UPI payment details
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          problemCategory: selectedTopic,
          problemDetail: problemDetail.trim() || `${selectedTopic} consultation guidance`,
          date: selectedDate,
          timeSlot: selectedSlot,
          sessionId,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Order failed');

      setOrderInfo({
        bookingNumber: orderData.bookingNumber,
        orderId: orderData.orderId,
        amount: orderData.amount || 21,
        upiId: orderData.upiId || '9540329351@paytm',
        upiLink: orderData.upiLink || `upi://pay?pa=9540329351@paytm&pn=Dr%20Shafali%20Garg&am=21&cu=INR&tn=DSG%20Consultation`,
        qrUrl: orderData.qrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=9540329351@paytm&pn=Dr%20Shafali%20Garg&am=21&cu=INR`,
      });

      // Switch to UPI payment screen
      setCheckoutStep('UPI_PAY');
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalizePayment = async () => {
    if (!orderInfo) return;
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const sessionId = `sess_${Date.now()}`;
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderInfo.orderId,
          paymentId: utrNumber ? `upi_${utrNumber}` : `upi_pay_${Date.now()}`,
          signature: `sig_${Date.now()}`,
          paymentMethod: 'UPI',
          bookingNumber: orderInfo.bookingNumber,
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          problemCategory: selectedTopic,
          problemDetail: problemDetail.trim() || `${selectedTopic} consultation guidance`,
          date: selectedDate,
          timeSlot: selectedSlot,
          sessionId,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Verification failed');

      setConfirmedBooking(verifyData.booking);
      setConfirmedMeetUrl(verifyData.meetUrl);
      setIsCheckoutOpen(false);
      setCheckoutStep('DETAILS');
      setIsPassOpen(true);

      // Trigger Confetti
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF6B00', '#FFB800', '#10B981'],
      });
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Payment confirmation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyUpi = () => {
    if (orderInfo?.upiId) {
      navigator.clipboard.writeText(orderInfo.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (confirmedMeetUrl) {
      navigator.clipboard.writeText(confirmedMeetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const generateGoogleCalendarUrl = () => {
    if (!confirmedBooking) return '#';
    const title = encodeURIComponent(`5-Min Consultation with Dr. Shafali Garg`);
    const details = encodeURIComponent(
      `Special ₹21 Consultation\nBooking ID: ${confirmedBooking.bookingNumber}\nJoin Google Meet: ${confirmedMeetUrl}\nCategory: ${confirmedBooking.problemCategory}`
    );
    const location = encodeURIComponent(confirmedMeetUrl);

    let dates = '';
    try {
      const start = new Date(confirmedBooking.startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
      const end = new Date(confirmedBooking.endTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
      dates = `${start}/${end}`;
    } catch {
      dates = '';
    }

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
  };

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-slate-900 flex flex-col justify-between py-2 sm:py-6 px-2 sm:px-4">
      
      {/* Top Bar */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between pb-3 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FF6B00] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            SG
          </div>
          <span className="text-xs font-bold text-slate-800">
            Dr. Shafali Garg • ₹21 Consultation Portal
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-white/90 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Slots Open</span>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto space-y-4 pb-28">
        
        {/* ========================================================================= */}
        {/* 1. MASTER DOCTOR HERO SECTION (EXACT MATCH TO USER SCREENSHOT)            */}
        {/* ========================================================================= */}
        <DoctorHeroSection onOpenDetails={() => setIsDetailsOpen(true)} />

        {/* ========================================================================= */}
        {/* 2. THREE TRUST BADGES ROW (1 Clean Row on both Mobile & PC)                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          <div className="p-2 sm:p-3.5 rounded-2xl bg-white border border-[#F0DCBA] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 shadow-xs">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#FFF3E8] text-[#E05E00] flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-[#26140B] leading-tight truncate sm:whitespace-normal">Personal Guidance</p>
              <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 hidden xs:block sm:block truncate">1-on-1 with Dr. Shafali</p>
            </div>
          </div>

          <div className="p-2 sm:p-3.5 rounded-2xl bg-white border border-[#F0DCBA] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 shadow-xs">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#FFF3E8] text-[#E05E00] flex items-center justify-center shrink-0">
              <Video className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-[#26140B] leading-tight truncate sm:whitespace-normal">Video / Audio Call</p>
              <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 hidden xs:block sm:block truncate">Connect from anywhere</p>
            </div>
          </div>

          <div className="p-2 sm:p-3.5 rounded-2xl bg-white border border-[#F0DCBA] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 shadow-xs">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#FFF3E8] text-[#E05E00] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-[#26140B] leading-tight truncate sm:whitespace-normal">100% Private</p>
              <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 hidden xs:block sm:block truncate">Your privacy priority</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. WHAT CAN YOU ASK TICKER BANNER (Smooth Infinite Loop Auto-Slider)       */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#FFF8EE] border border-[#F0DCBA] overflow-hidden">
          <p className="text-center text-xs font-bold text-[#C05A18] mb-2">
            What can you ask during your consultation?
          </p>
          <div className="relative overflow-hidden w-full py-0.5">
            <div className="animate-marquee flex items-center gap-6 text-xs text-[#332218] font-medium">
              
              {/* Set 1 */}
              <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E05E00]" />
                Career & Business
              </span>
              <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E05E00]" />
                Relationships & Marriage
              </span>
              <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E05E00]" />
                Life Decisions
              </span>
              <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E05E00]" />
                Personal Growth
              </span>
              <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E05E00]" />
                Kundli & Astrology
              </span>

              {/* Set 2 (Duplicate for Seamless Infinite Loop) */}
              <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E05E00]" />
                Career & Business
              </span>
              <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E05E00]" />
                Relationships & Marriage
              </span>
              <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E05E00]" />
                Life Decisions
              </span>
              <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E05E00]" />
                Personal Growth
              </span>
              <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E05E00]" />
                Kundli & Astrology
              </span>

            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. INTERACTIVE BOOKING CONSOLE CARD                                       */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-white border border-[#F0DCBA] p-5 sm:p-7 shadow-sm space-y-6">
          
          {/* STEP 1: CHOOSE WHAT YOU NEED GUIDANCE ON */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2.5">
              1. Choose What You Need Guidance On
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {topics.map((t) => {
                const isSelected = selectedTopic === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTopic(t.id)}
                    className={`p-3 sm:p-4 rounded-2xl border text-center flex flex-col items-center justify-between min-h-[120px] sm:min-h-[130px] transition-all relative active:scale-95 ${
                      isSelected
                        ? 'bg-[#FFF9F5] border-2 border-[#FF6B00] text-slate-900 shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                        ✓
                      </span>
                    )}

                    <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center mb-1">
                      <img
                        src={t.iconSrc}
                        alt={t.title}
                        className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                      />
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        {t.title}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-[#7A6E65] mt-1 whitespace-pre-line leading-tight">
                        {t.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: CHOOSE YOUR DATE (Interactive Smooth Slider with Month Selector) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  2. Choose Your Date
                </h3>
                <span className="text-[11px] font-bold text-[#E05E00] bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                  {format(new Date(selectedDate), 'MMMM yyyy')}
                </span>
              </div>

              {/* Slider Controls & Month Selector Dropdown */}
              <div className="flex items-center gap-1.5">
                {/* Scroll Left Button */}
                <button
                  type="button"
                  onClick={() => scrollDates('left')}
                  className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition-all shadow-xs"
                  title="Scroll dates left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Scroll Right Button */}
                <button
                  type="button"
                  onClick={() => scrollDates('right')}
                  className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition-all shadow-xs"
                  title="Scroll dates right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Month Choose Option Dropdown */}
                <div className="relative flex items-center">
                  <div className="flex items-center gap-1 text-xs font-bold text-[#E05E00] bg-[#FFF8F2] hover:bg-[#FFF2E5] border border-orange-200 px-2.5 py-1 rounded-xl shadow-xs transition-all cursor-pointer">
                    <Calendar className="w-3.5 h-3.5 text-[#E05E00]" />
                    <span className="text-[11px] font-bold">{format(new Date(selectedDate), 'MMMM')}</span>
                    <span className="text-[9px] text-orange-400">▾</span>
                  </div>
                  <select
                    value={format(new Date(selectedDate), 'yyyy-MM')}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-xs font-bold"
                  >
                    {uniqueMonths.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Horizontal Date Slider Container */}
            <div
              ref={dateScrollRef}
              className="flex gap-2 overflow-x-auto pb-2 scroll-smooth no-scrollbar"
              style={{ scrollBehavior: 'smooth' }}
            >
              {availableDates.map((d) => {
                const isSelected = selectedDate === d.dateString;
                return (
                  <button
                    key={d.dateString}
                    id={`date-pill-${d.dateString}`}
                    type="button"
                    onClick={() => setSelectedDate(d.dateString)}
                    className={`min-w-[76px] sm:min-w-[80px] py-3 px-1.5 rounded-2xl border text-center transition-all shrink-0 active:scale-95 select-none ${
                      isSelected
                        ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-md font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className={`text-[10px] font-bold tracking-wider leading-none ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                      {d.dayLabel}
                    </p>
                    <p className={`text-lg font-black mt-1 leading-none ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {d.dayNumber}
                    </p>
                    <p className={`text-[10px] font-medium mt-1 leading-none ${isSelected ? 'text-orange-100' : 'text-slate-500'}`}>
                      {d.monthName}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: CHOOSE YOUR TIME (IST) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                3. Choose Your Time (IST)
              </h3>
              <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Available Times for {format(new Date(selectedDate), 'd MMM')}</span>
              </span>
            </div>

            {isLoadingSlots ? (
              <div className="py-6 flex items-center justify-center text-xs text-slate-400 bg-[#FAFAFA] rounded-2xl border border-slate-100">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00] mr-2" />
                <span>Checking available slots...</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="py-5 px-4 text-center bg-[#FFFBF5] rounded-2xl border border-orange-200/70 space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  All slots for {format(new Date(selectedDate), 'dd MMMM')} are completed or reserved.
                </p>
                <p className="text-[11px] text-slate-500">
                  Please select another date or tomorrow from the date slider above.
                </p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {displayedSlots.map((slot) => {
                    const isSelected = selectedSlot === slot.displayTime;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedSlot(slot.displayTime)}
                        className={`py-2.5 px-1.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                          isSelected
                            ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-sm font-bold'
                            : slot.isAvailable
                            ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 hover:border-emerald-500'
                            : 'bg-slate-50 border-slate-100 text-slate-300 line-through cursor-not-allowed'
                        }`}
                      >
                        {slot.startTime}
                      </button>
                    );
                  })}
                </div>

                {slots.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllSlots(!showAllSlots)}
                    className="w-full mt-2 text-center text-xs text-slate-500 hover:text-slate-800 font-semibold py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-1"
                  >
                    <span>{showAllSlots ? 'Show Less Slots' : 'View More Slots ⌄'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* FLOATING STICKY BOTTOM ACTION CARD (Exact Pixel-Perfect Match to Image)   */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-4 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto bg-[#FFFDF9]/98 backdrop-blur-md rounded-3xl border border-[#F2DECA] p-4 sm:p-5 shadow-2xl shadow-orange-950/10 space-y-2.5">
          
          <div className="flex items-center justify-between gap-4">
            {/* Left: Price and Subtitle */}
            <div className="shrink-0">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#FF6B00] leading-none tracking-tight">
                  ₹21
                </span>
                <span className="text-xs sm:text-sm text-[#8A7D76] line-through font-medium leading-none">
                  ₹1,500
                </span>
              </div>
              <p className="text-xs text-[#2B170C] font-semibold leading-tight mt-1.5">
                5-Min Private Consultation
              </p>
            </div>

            {/* Right: Book My ₹21 Consultation Button */}
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="py-3.5 px-6 sm:px-8 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-sm sm:text-base shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all shrink-0"
            >
              <span>Book My ₹21 Consultation</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Bottom Trust Sub-row */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] text-[#6E594F] font-medium pt-1">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#8A7D76]" />
              Private & Confidential
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8A7D76]" />
              Secure Payment
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#8A7D76]" />
              Only 5 Minutes
            </span>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* PATIENT CHECKOUT SHEET / MODAL                                            */}
      {/* ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider">Direct 1-on-1 Meet</span>
                <h3 className="text-base font-bold text-slate-900">Dr. Shafali Garg Consultation</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#FFF9F5] border border-[#FFE4D4] flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] text-slate-400">Selected Slot:</p>
                <p className="font-bold text-slate-900">
                  {selectedDate ? format(new Date(selectedDate), 'dd MMM yyyy') : ''} • {selectedSlot}
                </p>
                <p className="text-[10px] text-[#FF6B00] font-semibold">🎯 {selectedTopic}</p>
              </div>
              <span className="text-sm font-extrabold text-[#FF6B00] bg-white px-2.5 py-1 rounded-xl border border-orange-200">
                ₹21
              </span>
            </div>

            {checkoutStep === 'DETAILS' ? (
              <form onSubmit={handleBookingSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Your Full Name <span className="text-[#FF6B00]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="E.g. Rahul Sharma"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    WhatsApp Mobile Number <span className="text-[#FF6B00]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00]"
                  />
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    🔒 Google Meet link will be dispatched here.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Brief Concern / Main Question (Optional)
                  </label>
                  <input
                    type="text"
                    value={problemDetail}
                    onChange={(e) => setProblemDetail(e.target.value)}
                    placeholder="What primary issue would you like to discuss?"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#FFA000] hover:from-[#E05E00] hover:to-[#FF8800] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all mt-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating UPI Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Proceed to UPI Payment (₹21) →</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: DIRECT UPI PAYMENT SCREEN */
              <div className="space-y-3.5 text-xs text-center">
                
                {/* 1-Click Pay on Mobile */}
                {orderInfo?.upiLink && (
                  <a
                    href={orderInfo.upiLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <span>⚡ Open UPI App (GPay / PhonePe / Paytm)</span>
                  </a>
                )}

                {/* QR Code Container */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center space-y-2">
                  <p className="text-[11px] font-bold text-slate-800">
                    Scan & Pay ₹21 with Any UPI App
                  </p>
                  
                  {orderInfo?.qrUrl && (
                    <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <img
                        src={orderInfo.qrUrl}
                        alt="Dr. Shafali Garg UPI QR Code"
                        className="w-40 h-40 object-contain mx-auto"
                      />
                    </div>
                  )}

                  {/* Copy UPI ID */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
                    <span className="text-[11px] font-mono font-bold text-slate-700">
                      {orderInfo?.upiId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="text-[10px] font-bold text-[#FF6B00] hover:text-[#E05E00] ml-1 flex items-center gap-0.5"
                    >
                      {copiedUpi ? 'Copied! ✓' : 'Copy'}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    {errorMsg}
                  </p>
                )}

                {/* Confirm Paid Button */}
                <button
                  type="button"
                  onClick={handleFinalizePayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Your Google Meet Room...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>I Have Paid ₹21 • Confirm Slot</span>
                    </>
                  )}
                </button>

                {/* Back to Details */}
                <button
                  type="button"
                  onClick={() => setCheckoutStep('DETAILS')}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold underline pt-1"
                >
                  ← Edit Name / Phone Number
                </button>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMED GOOGLE MEET PASS MODAL                                          */}
      {/* ========================================================================= */}
      {isPassOpen && confirmedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 text-center">
            
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full">
                Booking Confirmed • ₹21 Paid
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Consultation Scheduled
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                ID: {confirmedBooking.bookingNumber}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF9F5] border border-[#FFE4D4] text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#FFE4D4]">
                <span className="text-[10px] font-bold text-[#FF6B00] uppercase">Dr. Shafali Garg</span>
                <span className="text-[10px] font-bold text-slate-500">5-Min Call</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <p className="text-[10px] text-slate-400">Date:</p>
                  <p className="font-bold text-slate-900">
                    {confirmedBooking.date ? format(new Date(confirmedBooking.date), 'dd MMM yyyy') : ''}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Time (IST):</p>
                  <p className="font-bold text-emerald-700">{confirmedBooking.timeSlot}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Patient:</p>
                  <p className="font-medium text-slate-800 truncate">{confirmedBooking.patientName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Topic:</p>
                  <p className="font-medium text-[#FF6B00] truncate">{confirmedBooking.problemCategory}</p>
                </div>
              </div>

              {/* Google Meet Link */}
              <div className="pt-1">
                <div className="p-2.5 rounded-xl bg-white border border-emerald-300 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700">
                    <span className="flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" />
                      Your Google Meet Link:
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-800 truncate bg-slate-50 p-1.5 rounded border border-slate-200 select-all">
                    {confirmedMeetUrl}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={confirmedMeetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Join Google Meet Call</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>

                <a
                  href={generateGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center justify-center gap-1 border border-amber-200 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Calendar</span>
                </a>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <MessageCircle className="w-3 h-3 text-emerald-600" />
              Dispatched to WhatsApp: <strong>{confirmedBooking.patientPhone}</strong>
            </p>

            <button
              onClick={() => setIsPassOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              Done
            </button>

          </div>
        </div>
      )}

      {/* Details Modal */}
      <DetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

    </div>
  );
}
