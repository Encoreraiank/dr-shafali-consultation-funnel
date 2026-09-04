'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CreditCard, ArrowLeft, Loader2, Smartphone, AlertCircle } from 'lucide-react';
import { BookingFormData, BookingRecord } from '@/types';
import { format } from 'date-fns';

interface StepPaymentProps {
  formData: BookingFormData;
  sessionId: string;
  onSuccess: (booking: BookingRecord, meetUrl: string) => void;
  onBack: () => void;
}

export default function StepPayment({
  formData,
  sessionId,
  onSuccess,
  onBack,
}: StepPaymentProps) {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'TEST'>('UPI');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes timer

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handlePayment = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      // 1. Create order
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sessionId,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to initialize payment');
      }

      // 2. Simulate or execute payment verification
      const paymentId = `pay_${selectedMethod.toLowerCase()}_${Date.now()}`;
      const signature = `sig_${Date.now()}`;

      // Call verify endpoint
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentId,
          signature,
          paymentMethod: selectedMethod,
          bookingNumber: orderData.bookingNumber,
          ...formData,
          sessionId,
          utmSource: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') : null,
          utmMedium: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_medium') : null,
          utmCampaign: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_campaign') : null,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      // Success! Pass to parent confirmation
      onSuccess(verifyData.booking, verifyData.meetUrl);
    } catch (err: unknown) {
      console.error('Payment error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Payment process failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <span>Complete ₹21 Payment</span>
          </h3>
          <span className="text-[11px] font-mono text-orange-800 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full font-bold">
            Slot Reserved: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          100% Encrypted & Secure Gateway. Automatic Google Meet link generated upon payment.
        </p>
      </div>

      {/* Summary Box */}
      <div className="rounded-2xl bg-[#FFFDF9] border border-orange-200 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-orange-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">5-Min 1-on-1 Consultation</h4>
            <p className="text-xs text-orange-600 font-semibold">With Dr. Shafali Garg (Google Meet)</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-orange-600">₹21</span>
            <p className="text-[10px] text-slate-400 line-through">₹1,500</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-1">
          <div>
            <p className="text-[10px] text-slate-400">Scheduled Date:</p>
            <p className="font-semibold text-slate-900">
              {formData.date ? format(new Date(formData.date), 'dd MMMM yyyy') : 'Selected Date'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Time Slot (IST):</p>
            <p className="font-semibold text-emerald-700">{formData.timeSlot}</p>
          </div>
          <div className="col-span-2 pt-1 border-t border-orange-100">
            <p className="text-[10px] text-slate-400">Patient Details:</p>
            <p className="font-medium text-slate-800">
              {formData.patientName} ({formData.patientPhone})
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Select Payment Method
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* UPI */}
          <button
            type="button"
            onClick={() => setSelectedMethod('UPI')}
            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
              selectedMethod === 'UPI'
                ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold ring-2 ring-orange-400'
                : 'bg-white border-slate-200 text-slate-700 hover:border-orange-200'
            }`}
          >
            <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">UPI / GPay / PhonePe / Paytm</p>
              <p className="text-[10px] text-slate-500">Instant direct payment</p>
            </div>
          </button>

          {/* Card */}
          <button
            type="button"
            onClick={() => setSelectedMethod('CARD')}
            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
              selectedMethod === 'CARD'
                ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold ring-2 ring-orange-400'
                : 'bg-white border-slate-200 text-slate-700 hover:border-orange-200'
            }`}
          >
            <CreditCard className="w-5 h-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-xs font-bold">Cards / Net Banking</p>
              <p className="text-[10px] text-slate-500">All Indian banks supported</p>
            </div>
          </button>
        </div>
      </div>

      {/* Error display */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Security note */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          256-Bit SSL Encrypted
        </span>
        <span>Amount to Pay: <strong className="text-orange-600 text-sm font-bold">₹21</strong></span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          disabled={isProcessing}
          onClick={onBack}
          className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={handlePayment}
          className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying & Generating Meet Link...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Pay ₹21 & Confirm Consultation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
