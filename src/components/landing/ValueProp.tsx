'use client';

import React from 'react';
import { ClipboardEdit, CalendarClock, CreditCard, Video, ArrowRight } from 'lucide-react';

interface ValuePropProps {
  onOpenBooking: () => void;
}

export default function ValueProp({ onOpenBooking }: ValuePropProps) {
  const steps = [
    {
      step: '1',
      icon: ClipboardEdit,
      title: 'Describe Your Issue',
      desc: 'Briefly state your primary question or challenge (Career, Relationship, Peace of mind).',
    },
    {
      step: '2',
      icon: CalendarClock,
      title: 'Choose a Slot',
      desc: 'Pick an available 5-minute time slot from the live calendar.',
    },
    {
      step: '3',
      icon: CreditCard,
      title: 'Pay ₹21 Online',
      desc: 'Complete payment via UPI (GPay/PhonePe) or card securely.',
    },
    {
      step: '4',
      icon: Video,
      title: 'Join Google Meet',
      desc: 'Get your unique Google Meet link instantly via WhatsApp & on-screen pass.',
    },
  ];

  return (
    <section className="py-14 sm:py-16 bg-[#FAFAFA] border-y border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How The ₹21 Consultation Works
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            A simple, automated 4-step process designed for quick clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#FFF4ED] text-[#FF6B00] flex items-center justify-center font-bold text-sm mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onOpenBooking}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-semibold text-xs sm:text-sm transition-all shadow-sm"
          >
            <span>Book Your ₹21 Slot Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
