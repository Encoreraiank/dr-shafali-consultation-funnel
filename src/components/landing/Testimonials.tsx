'use client';

import React from 'react';
import { Star, CheckCircle } from 'lucide-react';

export default function Testimonials() {
  const reviews = [
    {
      name: 'Mr. Vikas Aggarwal',
      role: 'MD, I-Power Batteries Pvt. Ltd.',
      text: 'Shafali ji has a strong grip on human behavior and psychology alongside astrology. The clarity was immediate in just a few minutes.',
    },
    {
      name: 'Pooja Sharma',
      role: 'Senior Product Manager',
      text: 'I was overwhelmed regarding a career pivot. In 5 minutes, Dr. Shafali pointed out the exact mental blockage I was ignoring. Highly recommended!',
    },
    {
      name: 'Rajesh Verma',
      role: 'Business Owner',
      text: 'Her scientific perspective on timing and decisions is genuine and actionable. Very helpful guidance.',
    },
  ];

  return (
    <section className="py-14 sm:py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            What Clients Say
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Real feedback from guided professionals and entrepreneurs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex text-amber-400 gap-1 mb-3">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  &ldquo;{r.text}&rdquo;
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    {r.name}
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                  </p>
                  <p className="text-[10px] text-slate-400">{r.role}</p>
                </div>
                <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">
                  Verified
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
