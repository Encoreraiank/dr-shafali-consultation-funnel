import React from 'react';
import { Shield, Lock } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-10 pb-24 md:pb-10 text-slate-400 text-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FF6B00] text-white flex items-center justify-center font-bold text-xs">
              SG
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Dr. Shafali Garg</p>
              <p className="text-[11px] text-slate-500">Bhartiya Sanskriti Ki Vigyanik Soch</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              100% Secure Payment
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#FF6B00]" />
              Private Consultation
            </span>
          </div>

          <div>
            <Link
              href="/admin"
              className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors py-1 px-2.5 rounded bg-slate-50 border border-slate-200"
            >
              Doctor & Admin Login 🔐
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-400 space-y-1">
          <p>
            Disclaimer: Consultations are for personal guidance, astrological study, life direction, and self-reflection.
          </p>
          <p>
            © {new Date().getFullYear()} Dr. Shafali Garg. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
