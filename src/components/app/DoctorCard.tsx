'use client';

import React, { useState } from 'react';
import { Star, Video, ShieldCheck, Clock, Users, Award, Sparkles, Info } from 'lucide-react';
import Image from 'next/image';

interface DoctorCardProps {
  onOpenDetails: () => void;
}

export default function DoctorCard({ onOpenDetails }: DoctorCardProps) {
  const [photoMode, setPhotoMode] = useState<'photo' | 'mascot'>('photo');

  return (
    <div className="relative pt-3 pb-4">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FF6B00] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            SG
          </div>
          <span className="text-xs font-bold text-slate-800 tracking-tight">
            Consultation Portal
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPhotoMode(photoMode === 'photo' ? 'mascot' : 'photo')}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1 active:scale-95 transition-all"
            title="Toggle Cartoon Mascot / Real Photo"
          >
            <Sparkles className="w-3 h-3 text-[#FF6B00]" />
            <span>{photoMode === 'photo' ? 'View Mascot' : 'View Real Photo'}</span>
          </button>

          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200" title="Google Meet Verified">
            <Video className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Profile Header (matching inspiration image) */}
      <div className="relative mx-4 rounded-3xl bg-gradient-to-b from-[#FFF5EC] via-[#FFF9F5] to-white border border-[#FFE7D6] p-4 sm:p-5 shadow-sm overflow-hidden">
        
        <div className="flex items-center justify-between gap-4">
          {/* Text Details */}
          <div className="flex-1">
            {/* Rating Tag */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-slate-800 text-[11px] font-bold shadow-sm border border-amber-200 mb-2">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>4.9 (13K+ Reviews)</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Dr. Shafali Garg
            </h1>
            
            <p className="text-xs font-semibold text-[#FF6B00] mt-0.5">
              Bhartiya Sanskriti Ki Vigyanik Soch
            </p>

            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Special 5-Minute Direct Consultation on Google Meet for <strong className="text-slate-900">₹21</strong>
            </p>
          </div>

          {/* Doctor Portrait / Mascot */}
          <div className="relative w-24 h-28 sm:w-28 sm:h-32 shrink-0 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-md">
            <img
              src={photoMode === 'photo' ? '/images/dr_shafali_2.jpg' : '/images/dr_shafali_mascot.jpg'}
              alt="Dr. Shafali Garg"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>

        {/* Quick Action Pills (matching image 1) */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#FFE7D6]">
          <button
            onClick={onOpenDetails}
            className="py-2 px-2.5 rounded-xl bg-white text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Info className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Details</span>
          </button>

          <div className="py-2 px-2.5 rounded-xl bg-white text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-1.5 shadow-sm">
            <Video className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Meet</span>
          </div>

          <div className="py-2 px-2.5 rounded-xl bg-white text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Private</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-2.5 bg-white/90 rounded-2xl p-2.5 border border-slate-100 text-center">
          <div>
            <p className="text-xs font-extrabold text-slate-900">15+ Years</p>
            <p className="text-[10px] text-slate-400">Experience</p>
          </div>
          <div className="border-x border-slate-100">
            <p className="text-xs font-extrabold text-[#FF6B00]">13K+ Leads</p>
            <p className="text-[10px] text-slate-400">Consulted</p>
          </div>
          <div>
            <p className="text-xs font-extrabold text-emerald-600">₹21 Entry</p>
            <p className="text-[10px] text-slate-400">Low Cost</p>
          </div>
        </div>

      </div>
    </div>
  );
}
