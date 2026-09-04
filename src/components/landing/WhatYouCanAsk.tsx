'use client';

import React from 'react';
import { Briefcase, Heart, Compass, Sparkles, ArrowRight } from 'lucide-react';

interface WhatYouCanAskProps {
  onOpenBooking: () => void;
}

export default function WhatYouCanAsk({ onOpenBooking }: WhatYouCanAskProps) {
  const topics = [
    {
      icon: Briefcase,
      title: 'Career & Business Clarity',
      desc: 'Job vs. business dilemma, timing for new projects, overcoming stagnant phases, and career direction.',
    },
    {
      icon: Heart,
      title: 'Relationships & Family Peace',
      desc: 'Navigating relationship conflicts, marriage compatibility questions, and restoring harmony.',
    },
    {
      icon: Compass,
      title: 'Life Path & Numerology',
      desc: 'Understanding your core strengths, life purpose, and timing patterns from birth chart analysis.',
    },
    {
      icon: Sparkles,
      title: 'Inner Peace & Mindset',
      desc: 'Overcoming anxiety, mental overthinking, and scientific Vedic mindset guidance for clarity.',
    },
  ];

  return (
    <section className="py-14 sm:py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            What Can You Discuss in 5 Minutes?
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Targeted, direct clarity on the questions that matter most to you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((t, i) => {
            const Icon = t.icon;
            return (
              <div
                key={i}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover:border-[#FF6B00]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#FFF4ED] text-[#FF6B00] flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">
                    {t.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {t.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={onOpenBooking}
                    className="text-xs font-semibold text-[#FF6B00] hover:text-[#E05E00] flex items-center gap-1"
                  >
                    <span>Discuss this @ ₹21</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
