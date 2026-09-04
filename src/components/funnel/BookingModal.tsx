'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import StepIntake from './StepIntake';
import StepSlots from './StepSlots';
import StepPayment from './StepPayment';
import StepConfirmation from './StepConfirmation';
import { BookingFormData, BookingRecord } from '@/types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

export default function BookingModal({
  isOpen,
  onClose,
  initialCategory = 'Career & Business',
}: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [sessionId, setSessionId] = useState<string>('');

  const [formData, setFormData] = useState<BookingFormData>({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    problemCategory: initialCategory,
    problemDetail: '',
    date: '',
    timeSlot: '',
  });

  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);
  const [confirmedMeetUrl, setConfirmedMeetUrl] = useState<string>('');

  // Generate unique session ID on mount
  useEffect(() => {
    setSessionId(`sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
  }, [isOpen]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const stepsHeader = [
    { num: 1, title: 'Your Query' },
    { num: 2, title: 'Time Slot' },
    { num: 3, title: 'Pay ₹21' },
    { num: 4, title: 'Google Meet' },
  ];

  const handlePaymentSuccess = (booking: BookingRecord, meetUrl: string) => {
    setConfirmedBooking(booking);
    setConfirmedMeetUrl(meetUrl);
    setCurrentStep(4);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Light Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={currentStep === 4 ? onClose : undefined}
      ></div>

      {/* Modal Dialog Card (Clean White with Orange/Yellow touches) */}
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-orange-200 shadow-2xl z-10 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Progress Bar */}
        <div className="p-4 sm:p-5 border-b border-orange-100 bg-[#FCFAF6] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 font-bold text-xs">
                ₹21
              </div>
              <span className="text-xs font-bold text-slate-800 tracking-wide">
                5-Min Special Consultation Funnel
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-orange-50 text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Dots */}
          <div className="grid grid-cols-4 gap-2">
            {stepsHeader.map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div key={step.num} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-orange-500'
                        : 'bg-slate-200'
                    }`}
                  ></div>
                  <p
                    className={`text-[10px] font-bold text-center truncate ${
                      isCurrent
                        ? 'text-orange-600'
                        : isDone
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 bg-white text-slate-800">
          {currentStep === 1 && (
            <StepIntake
              formData={formData}
              setFormData={setFormData}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <StepSlots
              formData={formData}
              setFormData={setFormData}
              sessionId={sessionId}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <StepPayment
              formData={formData}
              sessionId={sessionId}
              onSuccess={handlePaymentSuccess}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && confirmedBooking && (
            <StepConfirmation
              booking={confirmedBooking}
              meetUrl={confirmedMeetUrl}
              onClose={onClose}
            />
          )}
        </div>

      </div>
    </div>
  );
}
