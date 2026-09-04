'use client';

import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenBooking: () => void;
}

export default function Header({ onOpenBooking }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FF6B00] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
            SG
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Dr. Shafali Garg
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Consultant & Life Guidance
            </p>
          </div>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Private Google Meet</span>
          </div>

          <button
            onClick={onOpenBooking}
            className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-semibold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <span>Book @ ₹21</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
}
