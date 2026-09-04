'use client';

import React from 'react';
import { X, Award, BookOpen, Users, CheckCircle2, ShieldCheck } from 'lucide-react';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailsModal({ isOpen, onClose }: DetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-xs font-bold">
              SG
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">About Dr. Shafali Garg</h3>
              <p className="text-[10px] text-slate-400">Consultation Details</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            Dr. Shafali Garg is a renowned life guide and numerology researcher with <strong>15+ years of experience</strong> and <strong>13,000+ consultations</strong> delivered.
          </p>

          <div className="p-3 rounded-2xl bg-orange-50 border border-orange-100 text-orange-950 font-medium">
            &ldquo;ज्योतिष भाग्य नहीं बदलता बल्कि कर्म पथ बताता है, और सही कर्म से भाग्य को बदला जा सकता है।&rdquo;
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct 1-on-1 on Google Meet</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Instant Meeting Link on WhatsApp & Email</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Confidential Consultation</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#FF6B00] text-white font-bold text-xs shadow-sm hover:bg-[#E05E00]"
        >
          Got It
        </button>

      </div>
    </div>
  );
}
