'use client';

import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';

interface StickyCTAProps {
  onOpenBooking: () => void;
}

export default function StickyCTA({ onOpenBooking }: StickyCTAProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-modal safe-area-bottom">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black text-[#FF6B00]">₹21</span>
            <span className="text-xs text-slate-400 line-through">₹1500</span>
          </div>
          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#FF6B00]" />
            5-Min Google Meet
          </p>
        </div>

        <button
          onClick={onOpenBooking}
          className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <span>Book Slot @ ₹21</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
