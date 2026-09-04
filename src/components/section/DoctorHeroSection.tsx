'use client';

import React from 'react';
import { Clock, Award, Star, Info } from 'lucide-react';

interface DoctorHeroSectionProps {
  onOpenDetails: () => void;
}

export default function DoctorHeroSection({ onOpenDetails }: DoctorHeroSectionProps) {
  return (
    <div
      className="relative w-full rounded-3xl p-4 sm:p-6 border border-[#F2E0CE] shadow-sm overflow-hidden"
      style={{
        backgroundImage: `url('/images/bg_mandala.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (sm: and up) - Side-by-side Left Column + Large Right Photo */}
      {/* ========================================================================= */}
      <div className="hidden sm:flex items-start justify-between gap-6">
        
        {/* Left Column */}
        <div className="flex-1 space-y-3 min-w-0">
          
          {/* 1. Rating Pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/95 border border-[#EED7BF] shadow-xs text-xs font-bold text-slate-800">
            <span className="text-[#F59E0B]">★</span>
            <span className="font-extrabold text-[#2B170C]">4.9/5</span>
            <span className="text-slate-300 font-normal">|</span>
            <span className="text-[#6E594F] font-medium">13K+ Consultations</span>
          </div>

          {/* 2. Doctor Name */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2B170C] font-serif tracking-tight leading-none pt-0.5">
            Dr. Shafali Garg
          </h1>

          {/* 3. Subheading */}
          <p className="text-sm sm:text-base font-bold text-[#E05E00] tracking-wide">
            Astrologer, Author & Motivational Speaker
          </p>

          {/* 4. Experience Line */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2B170C]">
            <Award className="w-4 h-4 text-[#2B170C]" />
            <span>15+ Years of Experience</span>
          </div>

          {/* 5. Get Clarity in Just 5 Minutes Box (Spacious & Clean, No Overlap) */}
          <div className="pt-2">
            <div className="py-3 px-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#F0DCBA] shadow-xs flex items-center justify-between gap-3 w-fit">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full border border-[#E05E00] bg-white flex items-center justify-center text-[#E05E00] shrink-0 shadow-xs">
                  <Clock className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#23150D] whitespace-nowrap leading-tight">
                    Get Clarity in Just 5 Minutes
                  </p>
                  <p className="text-[11px] text-[#5C4D44] whitespace-nowrap leading-tight mt-0.5">
                    Personal Guidance on What Matters to You
                  </p>
                </div>
              </div>

              <div className="w-[1px] h-9 bg-[#EAD7C2] shrink-0 mx-2"></div>

              <div className="text-center shrink-0 min-w-[80px]">
                <p className="text-[10px] font-semibold text-[#B05820] leading-none mb-0.5 whitespace-nowrap">
                  Introductory Offer
                </p>
                <p className="text-3xl font-black text-[#E05E00] leading-none tracking-tight">
                  ₹21
                </p>
                <p className="text-[11px] text-[#8A7D76] line-through font-medium leading-none mt-0.5">
                  ₹1,500
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Doctor Photo & Details Button */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative w-44 h-56 rounded-3xl overflow-hidden bg-white border-4 border-white shadow-lg">
            <img
              src="/images/dr_shafali_2.jpg"
              alt="Dr. Shafali Garg"
              className="w-full h-full object-cover object-top"
            />
          </div>

          <button
            type="button"
            onClick={onOpenDetails}
            className="mt-2.5 py-1 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Info className="w-3.5 h-3.5 text-[#E05E00]" />
            <span className="text-blue-600">Details</span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (< sm) - Top Info & Prominent Photo + Wide Clean Offer Box   */}
      {/* ========================================================================= */}
      <div className="flex sm:hidden flex-col space-y-3">
        
        {/* Top Header: Left Info + Right Prominent Photo */}
        <div className="flex items-start justify-between gap-3">
          
          <div className="flex-1 space-y-1.5 min-w-0">
            {/* Rating Pill */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/95 border border-[#EED7BF] shadow-xs text-[10px] font-bold text-slate-800">
              <span className="text-[#F59E0B]">★</span>
              <span className="font-extrabold text-[#2B170C]">4.9/5</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-[#6E594F] font-medium">13K+ Consults</span>
            </div>

            {/* Doctor Name */}
            <h1 className="text-2xl font-extrabold text-[#2B170C] font-serif tracking-tight leading-none pt-0.5">
              Dr. Shafali Garg
            </h1>

            {/* Subheading */}
            <p className="text-xs font-bold text-[#E05E00] tracking-wide leading-tight">
              Astrologer, Author & Motivational Speaker
            </p>

            {/* Experience */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2B170C] pt-0.5">
              <Award className="w-3.5 h-3.5 text-[#2B170C]" />
              <span>15+ Years of Experience</span>
            </div>
          </div>

          {/* Prominent Doctor Photo on Mobile */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative w-28 h-36 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-md">
              <img
                src="/images/dr_shafali_2.jpg"
                alt="Dr. Shafali Garg"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <button
              type="button"
              onClick={onOpenDetails}
              className="mt-1 py-0.5 px-3 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold border border-slate-200 shadow-xs flex items-center gap-1 active:scale-95 transition-all"
            >
              <Info className="w-3 h-3 text-[#E05E00]" />
              <span className="text-blue-600">Details</span>
            </button>
          </div>

        </div>

        {/* Mobile Offer Box (Full Width, Spacious, 100% No Overlap) */}
        <div className="p-3 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#F0DCBA] shadow-xs flex items-center justify-between gap-2.5 w-full">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full border border-[#E05E00] bg-white flex items-center justify-center text-[#E05E00] shrink-0 shadow-xs">
              <Clock className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#23150D] leading-tight truncate">
                Get Clarity in Just 5 Minutes
              </p>
              <p className="text-[10px] text-[#5C4D44] leading-tight truncate mt-0.5">
                Personal Guidance on What Matters to You
              </p>
            </div>
          </div>

          <div className="w-[1px] h-8 bg-[#EAD7C2] shrink-0 mx-1"></div>

          <div className="text-center shrink-0 min-w-[70px]">
            <p className="text-[9px] font-semibold text-[#B05820] leading-none mb-0.5">
              Introductory Offer
            </p>
            <p className="text-2xl font-black text-[#E05E00] leading-none tracking-tight">
              ₹21
            </p>
            <p className="text-[10px] text-[#8A7D76] line-through font-medium leading-none mt-0.5">
              ₹1,500
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
