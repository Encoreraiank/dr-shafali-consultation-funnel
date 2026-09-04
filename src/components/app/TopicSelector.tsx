'use client';

import React from 'react';
import { Briefcase, Heart, Compass, Sparkles } from 'lucide-react';

interface TopicSelectorProps {
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
}

export default function TopicSelector({
  selectedTopic,
  onSelectTopic,
}: TopicSelectorProps) {
  const topics = [
    { id: 'Career & Business', label: 'Career & Wealth', icon: Briefcase },
    { id: 'Relationships & Marriage', label: 'Relationships', icon: Heart },
    { id: 'Life Direction & Purpose', label: 'Life Path & Chart', icon: Compass },
    { id: 'Mental Peace & Wellness', label: 'Inner Peace', icon: Sparkles },
  ];

  return (
    <div className="px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-800">
          1. Select Consultation Topic
        </label>
        <span className="text-[10px] text-slate-400">5-Min Focus</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {topics.map((t) => {
          const Icon = t.icon;
          const isSelected = selectedTopic === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTopic(t.id)}
              className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all active:scale-95 ${
                isSelected
                  ? 'bg-[#FFF4ED] border-[#FF6B00] text-slate-900 ring-1 ring-[#FF6B00] shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-[#FF6B00] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold truncate leading-tight">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
