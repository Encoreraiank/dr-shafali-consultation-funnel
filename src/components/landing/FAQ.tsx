'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Why is this consultation priced at only ₹21?',
      a: 'This introductory consultation is designed to make it effortless for new seekers to experience Dr. Shafali Garg’s personalized, scientific guidance without any financial barrier.',
    },
    {
      q: 'How will I join the Google Meet call?',
      a: 'Immediately after paying ₹21, an official Google Meet link is generated on your screen and dispatched to your WhatsApp & Email. Simply click the link at your booked time slot.',
    },
    {
      q: 'Can 5 minutes really help solve my problem?',
      a: 'Yes! Because you share your specific concern in advance, Dr. Shafali reviews your question beforehand. The 5 minutes are 100% focused on direct diagnosis and next steps.',
    },
    {
      q: 'Is my consultation completely confidential?',
      a: 'Yes, 100%. All conversations and details are strictly private between you and Dr. Shafali Garg.',
    },
  ];

  return (
    <section className="py-14 sm:py-16 bg-[#FAFAFA] border-t border-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Everything you need to know about the ₹21 5-Minute Consultation.
          </p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200/80 bg-white overflow-hidden transition-all shadow-subtle"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-4 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[#FF6B00]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
