'use client';

import React from 'react';
import { Clock, Award, Star, Info } from 'lucide-react';

interface DoctorHeroSectionProps {
  onOpenDetails: () => void;
}

export default function DoctorHeroSection({ onOpenDetails }: DoctorHeroSectionProps) {
  return (
    <div
      className="relative w-full rounded-3xl p-5 sm:p-6 border border-[#F2E0CE] shadow-sm overflow-hidden"
      style={{
        backgroundImage: `url('/images/bg_mandala.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex flex-col md:flex-row items-start justify-between gap-5">
        
        {/* Left Column (Rating, Name, Subheading, Experience & Exact Clarity Box) */}
        <div className="flex-1 space-y-2.5 w-full">
          
          {/* 1. Rating Pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/95 border border-[#EED7BF] shadow-sm text-xs font-bold text-slate-800">
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
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2B170C] pt-0.5">
            <Award className="w-4 h-4 text-[#2B170C]" />
            <span>15+ Years of Experience</span>
          </div>

          {/* 5. Get Clarity in Just 5 Minutes Box (Exact Match to Image 1 & 3) */}
          <div className="mt-3 p-3 sm:py-3 sm:px-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#F0DCBA] shadow-sm flex items-center justify-between gap-2 sm:gap-3 w-fit max-w-full">
            
            {/* Left: Clock Icon & Single Line Texts */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#E05E00] bg-white flex items-center justify-center text-[#E05E00] shrink-0 shadow-sm">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#23150D] whitespace-nowrap leading-tight">
                  Get Clarity in Just 5 Minutes
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#5C4D44] whitespace-nowrap leading-tight mt-0.5">
                  Personal Guidance on What Matters to You
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-8 sm:h-9 bg-[#EAD7C2] shrink-0 mx-1 sm:mx-2"></div>

            {/* Right: Introductory Offer ₹21 */}
            <div className="text-center shrink-0 min-w-[75px] sm:min-w-[85px]">
              <p className="text-[9px] sm:text-[10px] font-semibold text-[#B05820] leading-none mb-0.5">
                Introductory Offer
              </p>
              <p className="text-2xl sm:text-3xl font-black text-[#E05E00] leading-none tracking-tight">
                ₹21
              </p>
              <p className="text-[10px] sm:text-[11px] text-[#8A7D76] line-through font-medium leading-none mt-0.5">
                ₹1,500
              </p>
            </div>

          </div>

        </div>

        {/* Right Column: Doctor Photo + Dynamic Details Button directly below */}
        <div className="flex flex-col items-center shrink-0 self-center md:self-start">
          <div className="relative w-40 h-48 sm:w-48 sm:h-56 rounded-3xl overflow-hidden bg-white border-4 border-white shadow-lg">
            <img
              src="/images/dr_shafali_2.jpg"
              alt="Dr. Shafali Garg"
              className="w-full h-full object-cover object-top"
            />
          </div>

          <button
            type="button"
            onClick={onOpenDetails}
            className="mt-2 py-1 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Info className="w-3.5 h-3.5 text-[#E05E00]" />
            <span className="text-blue-600">Details</span>
          </button>
        </div>

      </div>
    </div>
  );
}
