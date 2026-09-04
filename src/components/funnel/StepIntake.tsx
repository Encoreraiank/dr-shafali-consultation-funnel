'use client';

import React, { useState } from 'react';
import { User, Phone, Mail, ArrowRight, MessageSquare } from 'lucide-react';
import { BookingFormData } from '@/types';

interface StepIntakeProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  onNext: () => void;
}

export default function StepIntake({ formData, setFormData, onNext }: StepIntakeProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    { id: 'Career & Business', label: '💼 Career & Business', desc: 'Job changes, financial blockages, venture timing' },
    { id: 'Relationships & Marriage', label: '❤️ Relationships & Marriage', desc: 'Compatibility, conflicts, marriage decisions' },
    { id: 'Life Direction & Purpose', label: '🧭 Life Path & Numerology', desc: 'Life purpose, birth chart analysis, strengths' },
    { id: 'Mental Peace & Wellness', label: '🧘 Inner Peace & Energy', desc: 'Overthinking, stress, spiritual remedies' },
    { id: 'Other Concern', label: '✨ Other Personal Query', desc: 'Specific personal or family questions' },
  ];

  const handleValidation = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Please enter your full name';
    }

    const cleanPhone = formData.patientPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      newErrors.patientPhone = 'Please enter a valid 10-digit WhatsApp number';
    }

    if (!formData.problemDetail.trim() || formData.problemDetail.trim().length < 10) {
      newErrors.problemDetail = 'Please provide a few sentences describing your problem (min 10 characters)';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleValidation} className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
          <span>Tell Us About Your Query</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Dr. Shafali Garg will review your question before the 5-minute call to give you focused clarity.
        </p>
      </div>

      {/* Category selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Select Problem Topic / Category <span className="text-orange-600">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map((cat) => {
            const isSelected = formData.problemCategory === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => setFormData((prev) => ({ ...prev, problemCategory: cat.id }))}
                className={`p-3 rounded-xl text-left border transition-all text-xs ${
                  isSelected
                    ? 'bg-orange-50 border-orange-500 text-orange-950 shadow-sm font-semibold ring-1 ring-orange-400'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-orange-200 hover:bg-orange-50/40'
                }`}
              >
                <p className="font-bold">{cat.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{cat.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Problem Description */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
            Describe Your Problem or Question <span className="text-orange-600">*</span>
          </label>
          <span className="text-[10px] text-slate-400">
            {formData.problemDetail.length}/500 chars
          </span>
        </div>
        <textarea
          rows={3}
          maxLength={500}
          value={formData.problemDetail}
          onChange={(e) => setFormData((prev) => ({ ...prev, problemDetail: e.target.value }))}
          placeholder="E.g., I am facing continuous career confusion between job switch and starting a business. Also feeling anxious about financial stability..."
          className="w-full rounded-xl bg-[#FFFDF9] border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
        />
        {errors.problemDetail && (
          <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.problemDetail}</p>
        )}
      </div>

      {/* Contact Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Your Full Name <span className="text-orange-600">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={formData.patientName}
              onChange={(e) => setFormData((prev) => ({ ...prev, patientName: e.target.value }))}
              placeholder="E.g. Rahul Sharma"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          {errors.patientName && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.patientName}</p>
          )}
        </div>

        {/* WhatsApp Mobile */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            WhatsApp Mobile Number <span className="text-orange-600">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
            <input
              type="tel"
              required
              value={formData.patientPhone}
              onChange={(e) => setFormData((prev) => ({ ...prev, patientPhone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          {errors.patientPhone && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.patientPhone}</p>
          )}
          <p className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            🔒 Google Meet link will be sent here automatically.
          </p>
        </div>
      </div>

      {/* Email (Optional) */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Email Address <span className="text-slate-400 font-normal">(Optional for Google Calendar invite)</span>
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="email"
            value={formData.patientEmail}
            onChange={(e) => setFormData((prev) => ({ ...prev, patientEmail: e.target.value }))}
            placeholder="rahul@example.com"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FFFDF9] border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <span>Continue to Select Date & Time Slot</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
