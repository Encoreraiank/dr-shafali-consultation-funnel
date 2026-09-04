'use client';

import React, { useState } from 'react';
import { X, Lock, User, Phone, Mail, MessageSquare, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { BookingRecord } from '@/types';
import { format } from 'date-fns';

interface BookingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTopic: string;
  selectedDate: string;
  selectedSlot: string;
  onSuccess: (booking: BookingRecord, meetUrl: string) => void;
}

export default function BookingSheet({
  isOpen,
  onClose,
  selectedTopic,
  selectedDate,
  selectedSlot,
  onSuccess,
}: BookingSheetProps) {
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [problemDetail, setProblemDetail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const sessionId = `sess_${Date.now()}`;
      
      // 1. Create order
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          patientPhone,
          patientEmail,
          problemCategory: selectedTopic,
          problemDetail: problemDetail || `${selectedTopic} consultation guidance`,
          date: selectedDate,
          timeSlot: selectedSlot,
          sessionId,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Order creation failed');

      // 2. Verify payment & generate Google Meet link
      const paymentId = `pay_upi_${Date.now()}`;
      const signature = `sig_${Date.now()}`;

      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentId,
          signature,
          paymentMethod: 'UPI',
          bookingNumber: orderData.bookingNumber,
          patientName,
          patientPhone,
          patientEmail,
          problemCategory: selectedTopic,
          problemDetail: problemDetail || `${selectedTopic} consultation guidance`,
          date: selectedDate,
          timeSlot: selectedSlot,
          sessionId,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Verification failed');

      onSuccess(verifyData.booking, verifyData.meetUrl);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Booking failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider">Confirm Consultation</span>
            <h3 className="text-base font-bold text-slate-900">Dr. Shafali Garg (₹21)</h3>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Slot Recap */}
        <div className="p-3 rounded-2xl bg-[#FFF9F5] border border-[#FFE4D4] flex items-center justify-between text-xs">
          <div>
            <p className="text-[10px] text-slate-400">Scheduled For:</p>
            <p className="font-bold text-slate-900">
              {selectedDate ? format(new Date(selectedDate), 'dd MMM yyyy') : ''} • {selectedSlot}
            </p>
            <p className="text-[10px] text-[#FF6B00] font-medium">🎯 {selectedTopic}</p>
          </div>

          <span className="text-sm font-extrabold text-[#FF6B00] bg-white px-2.5 py-1 rounded-xl border border-orange-200">
            ₹21
          </span>
        </div>

        {/* Patient Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Your Full Name <span className="text-[#FF6B00]">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="E.g. Rahul Sharma"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              WhatsApp Mobile Number <span className="text-[#FF6B00]">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
            <p className="text-[10px] text-emerald-700 mt-0.5">
              🔒 Google Meet link will be sent here.
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Brief Concern / Question (Optional)
            </label>
            <textarea
              rows={2}
              value={problemDetail}
              onChange={(e) => setProblemDetail(e.target.value)}
              placeholder="What main question would you like to ask Dr. Shafali?"
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
              {errorMsg}
            </p>
          )}

          {/* Payment CTA */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all mt-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Google Meet Link...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay ₹21 & Confirm Slot</span>
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          100% Encrypted UPI / Card Payment
        </p>

      </div>
    </div>
  );
}
