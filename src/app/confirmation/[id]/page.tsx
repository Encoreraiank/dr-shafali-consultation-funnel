import React from 'react';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { Video, CheckCircle2, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface ConfirmationPageProps {
  params: {
    id: string; // bookingNumber or id
  };
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { bookingNumber: params.id },
        { id: params.id },
      ],
    },
  });

  if (!booking) {
    notFound();
  }

  const meetUrl = booking.meetUrl || 'https://meet.google.com';

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-slate-800 flex flex-col justify-between py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto w-full">
        {/* Brand header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-orange-600 font-semibold hover:underline mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-2xl font-bold font-serif text-slate-900">Dr. Shafali Garg</h1>
          <p className="text-xs text-orange-600 font-semibold">5-Minute Consultation Pass</p>
        </div>

        {/* Digital Pass Card */}
        <div className="rounded-3xl bg-white border-2 border-orange-200 p-6 sm:p-8 shadow-warm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700">Booking Confirmed</p>
                <p className="text-sm font-bold text-slate-900 font-mono">{booking.bookingNumber}</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-orange-500 text-white px-2.5 py-1 rounded-full">
              ₹21 Paid
            </span>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-xs text-slate-700">
            <div>
              <p className="text-[10px] text-slate-400">Scheduled Date:</p>
              <p className="font-semibold text-slate-900 text-sm">
                {booking.date ? format(new Date(booking.date), 'dd MMMM yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Time Slot (IST):</p>
              <p className="font-semibold text-emerald-700 text-sm">{booking.timeSlot}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Patient Name:</p>
              <p className="font-medium text-slate-800">{booking.patientName}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Topic Category:</p>
              <p className="font-medium text-orange-700">{booking.problemCategory}</p>
            </div>
          </div>

          {/* Google Meet Action Box */}
          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-emerald-300 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                Google Meet Consultation Link
              </span>
              <span className="text-[10px] text-slate-500">1-on-1 Direct</span>
            </div>

            <p className="text-xs font-mono text-slate-800 bg-white p-2.5 rounded-lg select-all break-all border border-slate-200">
              {meetUrl}
            </p>

            <a
              href={meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <span>Join Google Meet Call</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Guidelines */}
          <div className="text-[11px] text-slate-600 space-y-1 bg-orange-50/60 p-4 rounded-xl border border-orange-200">
            <p className="font-semibold text-slate-800">📌 Consultation Guidelines:</p>
            <p>1. Please click the Google Meet link 2 minutes before {booking.timeSlot}.</p>
            <p>2. Keep your primary question clear and direct for the best 5-minute guidance.</p>
            <p>3. Ensure your camera and microphone permissions are enabled.</p>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 mt-8">
        © {new Date().getFullYear()} Dr. Shafali Garg. 100% Confidential Consultation System.
      </div>
    </div>
  );
}
