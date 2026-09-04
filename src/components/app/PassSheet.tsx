'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Video, Calendar, Copy, ExternalLink, MessageCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BookingRecord } from '@/types';
import { format } from 'date-fns';

interface PassSheetProps {
  booking: BookingRecord;
  meetUrl: string;
  onClose: () => void;
}

export default function PassSheet({
  booking,
  meetUrl,
  onClose,
}: PassSheetProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF6B00', '#FFB800', '#10B981'],
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleCopyLink = () => {
    if (meetUrl) {
      navigator.clipboard.writeText(meetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 text-center">
        
        {/* Header Badge */}
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
            ID: {booking.bookingNumber}
          </p>
        </div>

        {/* Digital Pass Box */}
        <div className="p-4 rounded-2xl bg-[#FFF9F5] border border-[#FFE4D4] text-left space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#FFE4D4]">
            <span className="text-[10px] font-bold text-[#FF6B00] uppercase">Dr. Shafali Garg</span>
            <span className="text-[10px] font-bold text-slate-500">5-Min Call</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-700">
            <div>
              <p className="text-[10px] text-slate-400">Date:</p>
              <p className="font-bold text-slate-900">
                {booking.date ? format(new Date(booking.date), 'dd MMM yyyy') : ''}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Time (IST):</p>
              <p className="font-bold text-emerald-700">{booking.timeSlot}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Patient:</p>
              <p className="font-medium text-slate-800 truncate">{booking.patientName}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Topic:</p>
              <p className="font-medium text-[#FF6B00] truncate">{booking.problemCategory}</p>
            </div>
          </div>

          {/* Google Meet Link Box */}
          <div className="pt-1">
            <div className="p-2.5 rounded-xl bg-white border border-emerald-300 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700">
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" />
                  Your Google Meet Link:
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-800 truncate bg-slate-50 p-1.5 rounded border border-slate-200 select-all">
                {meetUrl}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <a
            href={meetUrl}
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
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
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
          Details dispatched to WhatsApp: <strong>{booking.patientPhone}</strong>
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
        >
          Done
        </button>

      </div>
    </div>
  );
}
