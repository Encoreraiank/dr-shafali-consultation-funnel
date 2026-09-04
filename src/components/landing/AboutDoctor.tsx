'use client';

import React from 'react';
import { Award, BookOpen, Users } from 'lucide-react';

export default function AboutDoctor() {
  return (
    <section className="py-14 sm:py-16 bg-[#FAFAFA] border-t border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7">
            <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
              About Dr. Shafali Garg
            </span>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Bhartiya Sanskriti Ki Vigyanik Soch
            </h2>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Dr. Shafali Garg has dedicated over 15 years to analyzing life patterns, numerology, and human psychology. Having delivered over 13,000 personal consultations, her approach focuses on practical, actionable solutions rather than superstition.
            </p>

            <div className="mt-5 p-4 rounded-xl bg-white border-l-4 border-[#FF6B00] text-slate-700 italic text-xs sm:text-sm shadow-subtle">
              &ldquo;ज्योतिष भाग्य नहीं बदलता बल्कि कर्म पथ बताता है, और सही कर्म से भाग्य को बदला जा सकता है।&rdquo;
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
                <p className="text-base font-bold text-slate-900">15+ Yrs</p>
                <p className="text-[11px] text-slate-500">Experience</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
                <p className="text-base font-bold text-slate-900">13,000+</p>
                <p className="text-[11px] text-slate-500">Consultations</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
                <p className="text-base font-bold text-slate-900">Author</p>
                <p className="text-[11px] text-slate-500">Numerology</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle text-center">
              <div className="w-32 h-44 mx-auto rounded-xl overflow-hidden bg-slate-50 border border-slate-200 mb-3">
                <img
                  src="https://drshafaligarg.com/wp-content/uploads/2023/12/WhatsApp-Image-2023-12-04-at-1.36.36-PM-212x300.jpeg"
                  alt="Dr. Shafali Garg Book"
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Author & Spiritual Researcher
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive Numerology & Life Path Guide
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
