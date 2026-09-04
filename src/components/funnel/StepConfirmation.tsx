'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, Video, Calendar, Copy, ExternalLink, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BookingRecord } from '@/types';
import { format } from 'date-fns';

interface StepConfirmationProps {
  booking: BookingRecord;
  meetUrl: string;
  onClose: () => void;
}

export default function StepConfirmation({
  booking,
  meetUrl,
  onClose,
}: StepConfirmationProps) {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F97316', '#F59E0B', '#10B981', '#FB923C'],
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    if (meetUrl) {
      navigator.clipboard.writeText(meetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const generateGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`5-Min Consultation with Dr. Shafali Garg`);
    const details = encodeURIComponent(
      `Special ₹21 Consultation\nBooking ID: ${booking.bookingNumber}\nJoin Google Meet: ${meetUrl}\nCategory: ${booking.problemCategory}`
    );
    const location = encodeURIComponent(meetUrl);

    let dates = '';
    try {
      const start = new Date(booking.startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
      const end = new Date(booking.endTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
      dates = `${start}/${end}`;
    } catch {
      dates = '';
    }

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
  };

  return (
    <div className="space-y-6 text-center text-slate-800">
      {/* Animated Success Badge */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 mb-3 shadow-md shadow-emerald-500/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 mb-1">
          Payment & Booking Confirmed!
        </span>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif mt-1">
          Your Consultation is Scheduled
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Booking ID: <strong className="text-orange-600 font-mono font-bold">{booking.bookingNumber}</strong>
        </p>
      </div>

      {/* Digital Consultation Pass Card */}
      <div className="rounded-2xl bg-[#FFFDF9] border-2 border-orange-200 p-5 shadow-warm text-left relative overflow-hidden">
        
        {/* Pass Header */}
        <div className="flex items-center justify-between pb-3 border-b border-orange-100">
          <div>
            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Consultation Pass</p>
            <h4 className="text-sm font-bold text-slate-900">Dr. Shafali Garg</h4>
          </div>
          <span className="text-xs font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
            5 Min Call
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 py-3 text-xs text-slate-700">
          <div>
            <p className="text-[10px] text-slate-400">Date:</p>
            <p className="font-semibold text-slate-900">
              {booking.date ? format(new Date(booking.date), 'dd MMMM yyyy') : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Time (IST):</p>
            <p className="font-semibold text-emerald-700">{booking.timeSlot}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Patient:</p>
            <p className="font-medium text-slate-800">{booking.patientName}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Paid Amount:</p>
            <p className="font-bold text-orange-600">₹{booking.amount} (Verified)</p>
          </div>
        </div>

        {/* Google Meet Box */}
        <div className="mt-2 p-3.5 rounded-xl bg-white border border-emerald-300 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <Video className="w-4 h-4" />
              Unique Google Meet Link:
            </span>
            <span className="text-[10px] text-slate-500">Auto-Generated</span>
          </div>

          <p className="text-xs font-mono text-slate-800 bg-slate-50 p-2 rounded-lg truncate select-all border border-slate-200">
            {meetUrl}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Join Google Meet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-orange-500" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Action Buttons: Calendar & WhatsApp reminder */}
      <div className="space-y-2.5">
        <a
          href={generateGoogleCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs border border-amber-300 flex items-center justify-center gap-2 transition-colors"
        >
          <Calendar className="w-4 h-4 text-orange-600" />
          <span>Add to Google Calendar Reminder</span>
        </a>

        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 text-left font-medium">
          <MessageCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>
            Confirmation & Meet link dispatched to WhatsApp: <strong>{booking.patientPhone}</strong>
          </span>
        </div>
      </div>

      {/* Important instructions */}
      <div className="text-left text-[11px] text-slate-600 space-y-1 bg-orange-50/50 p-3 rounded-xl border border-orange-200">
        <p className="font-semibold text-slate-800">📌 Please Note:</p>
        <p>• Join the Google Meet call 2 minutes before your scheduled slot.</p>
        <p>• Keep your primary question clear and concise for maximum benefit in 5 minutes.</p>
      </div>

      {/* Done Button */}
      <button
        type="button"
        onClick={onClose}
        className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm"
      >
        Done & Close
      </button>
    </div>
  );
}
