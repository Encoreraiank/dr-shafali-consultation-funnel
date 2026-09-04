'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, Clock, Star, Video, Sparkles, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onOpenBooking: () => void;
}

export default function Hero({ onOpenBooking }: HeroProps) {
  return (
    <section className="pt-8 pb-16 sm:pt-14 sm:pb-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Clear Text & CTA */}
          <div className="lg:col-span-7 text-center lg:text-left">
            
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF4ED] text-[#E05E00] text-xs font-semibold mb-4 border border-[#FFD8C2]">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Special Online Consultation Offer</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Get Direct 1-on-1 Clarity From{' '}
              <span className="text-[#FF6B00]">Dr. Shafali Garg</span>
            </h1>

            {/* Subheading */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Have a pressing question about your career, relationship, life path, or personal peace? Talk directly for 5 minutes on Google Meet for just <strong className="text-slate-900 font-bold">₹21</strong>.
            </p>

            {/* Clean Benefits List */}
            <div className="mt-6 space-y-2.5 max-w-md mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-2.5 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1-on-1 Private Consultation on Google Meet</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Direct diagnosis of your main issue</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant confirmation & unique Google Meet link</span>
              </div>
            </div>

            {/* Simple Booking Action Card */}
            <div className="mt-8 p-5 rounded-2xl bg-[#FFF9F5] border border-[#FFE4D4] max-w-lg mx-auto lg:mx-0 text-left">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-extrabold text-[#FF6B00]">₹21</span>
                    <span className="text-xs text-slate-400 line-through">₹1,500</span>
                    <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                      98% OFF
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
                    5-Minute Dedicated Call
                  </p>
                </div>

                <button
                  onClick={onOpenBooking}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span>Book Consultation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-[#FFE4D4] flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  100% Confidential
                </span>
                <span className="text-orange-700 font-medium">⚡ Limited Daily Slots</span>
              </div>
            </div>

          </div>

          {/* Right Column: Clean Doctor Card */}
          <div className="lg:col-span-5">
            <div className="max-w-xs sm:max-w-sm mx-auto bg-white rounded-3xl p-4 border border-slate-100 shadow-card text-center">
              
              <div className="relative w-48 h-56 mx-auto rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 mb-4">
                <img
                  src="https://drshafaligarg.com/wp-content/uploads/2023/12/WhatsApp-Image-2023-12-04-at-1.36.36-PM.jpeg"
                  alt="Dr. Shafali Garg"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600";
                  }}
                />
              </div>

              <h3 className="text-lg font-bold text-slate-900">Dr. Shafali Garg</h3>
              <p className="text-xs text-slate-500 mt-0.5">Bhartiya Sanskriti Ki Vigyanik Soch</p>

              <div className="flex items-center justify-center gap-1 mt-2 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-xs font-bold text-slate-800 ml-1">4.9/5</span>
                <span className="text-[11px] text-slate-400">(13,000+ Consultations)</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-sm font-bold text-slate-900">15+</p>
                  <p className="text-[10px] text-slate-500">Years Exp</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-sm font-bold text-slate-900">13K+</p>
                  <p className="text-[10px] text-slate-500">Guided</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-sm font-bold text-slate-900">Author</p>
                  <p className="text-[10px] text-slate-500">Books</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
